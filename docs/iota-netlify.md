# Fixed IOTA entry on the existing Netlify site

The production URL is `https://bowei.netlify.app/iota/`. The Hugo homepage and blog keep their current routes.

Visitors open the app directly without a username, password, or login prompt. The repository includes an AES-256-GCM encrypted snapshot of the existing IOTA site, including its experiment evidence and downloads, published with the owner's explicit authorization. Configure the private Netlify environment variables before merging or deploying. The build decrypts the snapshot into ignored `static/iota/` and adds the asynchronous transport script; plaintext research assets, passwords, bridge tokens, user conversations, model weights, and worker runtime files are not committed. The existing interface and exact model responses are retained.

## One-time Netlify configuration

In the **bowei** project, open **Project configuration → Environment variables** and import the private `netlify.env` file prepared on the server. Set the one background variable for **Builds and Functions** (or all scopes) in the production context:

- `IOTA_BRIDGE_TOKEN`: private random token, also used to decrypt the app snapshot.

Never put these values in `netlify.toml`, a GitHub issue, a PR, or browser JavaScript. Do not rotate the bridge token without re-encrypting the snapshot. Deploy Previews also need the variables in their own context to test the app. Unconfigured previews fail closed; configure variables before merging so the existing site's build succeeds.

Merge the reviewed branch into `main` and let the existing Netlify integration build it. Node 22 is selected for the added Netlify function; the existing Hugo version and build flags are retained. No custom domain, ngrok account, or Cloudflare tunnel is needed.

## Server worker

The model stays on the current GPU server. On that server run:

```bash
python scripts/iota_worker.py \
  --env-file /path/outside/repository/netlify.env \
  --site https://bowei.netlify.app
```

The credentials file must have permissions `0600`. The worker takes an exclusive file lock and polls every 15 seconds while idle. It sends an online heartbeat and claims at most one inference task. While generating, a separate heartbeat keeps the status accurate. Completed responses are retried safely if the network disconnects. Polling and storing data consume the Netlify account's function/storage allowance; review usage in the dashboard.

The worker contacts Netlify over outbound HTTPS and forwards only the five existing inference operations to the loopback portal on port 8768. It does not expose a server port publicly. Netlify requests finish quickly: submit returns HTTP 202, the browser polls a private random task ID, and the exact model response arrives when ready. This avoids the proxy request timeout and removes changing tunnel hostnames from the model path.

Pages, status, inference submission, and random-ID result polling are public. Only the worker heartbeat/claim/result endpoint requires the private bearer token. An atomic storage lease admits one request at a time, including across concurrent function invocations. Submitted work expires after six minutes; results expire after fifteen minutes and are periodically deleted. A missing heartbeat marks the model offline within one minute. Existing browser profile/history storage is retained under the new site's origin; old tunnel-origin localStorage is not automatically transferable, so use the existing export/import controls to migrate it.

The worker reconnects after temporary errors and survives a shell disconnect when launched by a service manager. A host reboot still requires a configured startup service. The included example systemd service is for a machine administrator to install after editing paths; no system service is installed automatically.

To update the bundled application after rebuilding the original server's `dist/`, run `node scripts/package-iota.mjs --dist /absolute/path/to/dist --env-file /private/path/netlify.env`, commit only the encrypted snapshot, and redeploy. Rotating the worker token requires repackaging before changing the Netlify environment variable.

## GPU lifetime

A fixed website address does not extend a Slurm GPU allocation. The current partition allows at most 72 hours per job. The portal must still be switched to a healthy replacement allocation before expiry; queue availability can interrupt inference. Existing pages and evidence stay available during an interruption. The bridge automatically follows whichever model session the local portal serves.

## Verification

```bash
npm ci
npm test
python -m py_compile scripts/iota_worker.py
```

Run `node scripts/prepare-iota.mjs` with the private build token to validate decryption and build the `/iota/` static tree. `tests/preview.mjs` is a local integration harness with an in-memory store; production always uses Netlify Blobs with strong consistency and conditional writes. A full Netlify deployment must additionally verify Edge Function routing, actual Blobs persistence, public visitor access, private worker authentication, and two real model conversations. Local tests cannot certify those provider-side settings.
