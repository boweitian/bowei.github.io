"""Outbound-only bridge: Netlify task -> existing local GPU portal -> Netlify result.

Run one process per site; the lock prevents concurrent consumers on this server.
Credentials live in a private external .env file, never the repository.
"""
import argparse
import fcntl
import json
import logging
import os
from pathlib import Path
import signal
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

ALLOWED = {'/api/studio/chat', '/api/studio/compare', '/api/studio/walk',
           '/api/studio/direction', '/api/route'}
LOG = logging.getLogger('iota-worker')


def load_env(path):
    result = {}
    for line in Path(path).read_text().splitlines():
        if line.strip() and not line.lstrip().startswith('#'):
            key, value = line.split('=', 1)
            result[key.strip()] = value.strip()
    return result


def http(url, body=None, token=None, timeout=15):
    headers = {}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    if body is not None:
        headers['Content-Type'] = 'application/json'
    request = urllib.request.Request(url, data=None if body is None else json.dumps(body, ensure_ascii=False).encode(), headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        try:
            value = json.loads(error.read())
        except (ValueError, UnicodeError):
            value = {'error': 'HTTP ' + str(error.code)}
        return error.code, value


class Worker:
    def __init__(self, site, upstream, token, interval=15):
        parsed = urllib.parse.urlsplit(site)
        if parsed.scheme != 'https' or parsed.path not in ['', '/'] or parsed.username or parsed.query or parsed.fragment:
            raise ValueError('Site must be an HTTPS origin')
        if urllib.parse.urlsplit(upstream).hostname not in ['127.0.0.1', 'localhost']:
            raise ValueError('The GPU portal must be on loopback')
        self.endpoint = site.rstrip('/') + '/iota/api/bridge'
        self.upstream = upstream.rstrip('/')
        self.token = token
        self.interval = interval
        self.stopping = threading.Event()
        self.last_cleanup = 0

    def state(self):
        try:
            code, value = http(self.upstream + '/api/status', timeout=6)
            if code == 200 and value.get('application') == 'iota-interactive':
                return value
        except (OSError, ValueError):
            pass
        return {'application': 'iota-interactive', 'online': False, 'message': '模型暂未连接。'}

    def exchange(self, claim=True, result=None):
        payload = {'status': self.state(), 'claim': claim}
        if result is not None:
            payload['result'] = result
        elif time.monotonic() - self.last_cleanup > 600:
            payload['cleanup'] = True
        code, value = http(self.endpoint, payload, self.token)
        if code != 200:
            # Do not log headers, tokens, prompts, or model responses.
            raise RuntimeError('Netlify bridge returned HTTP ' + str(code))
        if payload.get('cleanup'):
            self.last_cleanup = time.monotonic()
        return value

    def run_job(self, job):
        if job.get('path') not in ALLOWED or not isinstance(job.get('body'), dict):
            return {'id': job['id'], 'status': 400, 'body': {'error': 'Invalid inference operation'}}
        try:
            code, value = http(self.upstream + job['path'], job['body'], timeout=300)
        except (OSError, ValueError):
            code, value = 503, {'error': '模型连接中断，请稍后重试。'}
        return {'id': job['id'], 'status': code, 'body': value}

    def serve(self):
        LOG.info('Outbound IOTA bridge started')
        result = None
        delay = self.interval
        while not self.stopping.is_set():
            try:
                update = self.exchange(claim=result is None, result=result)
                if result is not None:
                    result = None
                job = update.get('job')
                if job:
                    LOG.info('Processing inference task')
                    finished = threading.Event()

                    def heartbeat():
                        while not finished.wait(15):
                            try:
                                self.exchange(claim=False)
                            except (OSError, ValueError, RuntimeError):
                                LOG.warning('Heartbeat temporarily unavailable')

                    thread = threading.Thread(target=heartbeat, daemon=True)
                    thread.start()
                    try:
                        result = self.run_job(job)
                    finally:
                        finished.set()
                        thread.join(timeout=20)
                    delay = 1
                else:
                    delay = self.interval
            except (OSError, ValueError, RuntimeError) as error:
                # A stale result should not prevent new jobs forever after a server-side lease expires.
                if 'HTTP 409' in str(error):
                    result = None
                LOG.warning('Bridge unavailable; retrying (%s)', type(error).__name__)
                delay = min(60, max(self.interval, delay * 2))
            self.stopping.wait(delay)
        try:
            http(self.endpoint, {'status': {'online': False}, 'claim': False}, self.token, timeout=5)
        except (OSError, ValueError):
            pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--env-file', required=True, type=Path)
    parser.add_argument('--site', default='https://bowei.netlify.app')
    parser.add_argument('--upstream', default='http://127.0.0.1:8768')
    parser.add_argument('--interval', type=int, default=15)
    args = parser.parse_args()
    if args.env_file.stat().st_mode & 0o077:
        raise SystemExit('Credential file must have mode 0600')
    env = load_env(args.env_file)
    token = env.get('IOTA_BRIDGE_TOKEN', '')
    if len(token) < 32:
        raise SystemExit('Set a private IOTA_BRIDGE_TOKEN of at least 32 characters')
    lock = args.env_file.with_suffix('.worker.lock').open('w')
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        raise SystemExit('A worker already owns this configuration')
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
    worker = Worker(args.site, args.upstream, token, max(2, args.interval))
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, lambda *_: worker.stopping.set())
    worker.serve()


if __name__ == '__main__':
    main()
