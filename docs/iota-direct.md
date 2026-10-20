# Direct Netlify deployment

The application is served at `https://bowei.netlify.app/iota/` as ordinary public static files. It has no visitor login, Netlify Functions, database, private runtime token, or environment-variable import. The existing homepage and blog keep their original files and routes.

The 9B model continues to run on the GPU server. Netlify proxies the five inference operations to its public asynchronous endpoints. Submission immediately returns HTTP 202; the browser polls a random result URL, so model generation does not occupy a long Netlify proxy request. Exact model responses and native conversation history are retained. The API is public, admits one inference at a time, limits request size, isolates portal-wide private trial results, and rejects unrelated browser origins. Jobs expire after six minutes and results after fifteen minutes.

`scripts/restore-iota.mjs` preserves the currently published app on subsequent Hugo builds: it downloads the public manifest and listed files, verifies each SHA-256 and size, and adds the app's proxy routes while keeping other generated routes. The first deployment was prepared separately with an exact backup of all published personal-homepage files. Private model weights and server credentials are not part of the deployment or repository.

No app archive or decrypted research data is added to this source branch. The existing approved encrypted archive remains only on the earlier development branch; that branch's password/worker-token implementation is superseded and should not be merged.

The public API backend still depends on the GPU allocation and the server's tunnel. A fixed Netlify address keeps the web pages available, but does not itself extend GPU time or guarantee model uptime. When rotating the tunnel, update the published manifest's `backend` and matching proxy routes. The Netlify deployment authorization belongs to the site administrator; it is not a visitor login or an application runtime secret.
