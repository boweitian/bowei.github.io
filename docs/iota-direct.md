# IOTA on Netlify

The personal site builds with Hugo when `main` changes. The Netlify project `bowei-iota` hosts the two IOTA apps and their access controls. The personal site's `iota-proxy` Edge Function forwards `/iota/` and `/iota-demonstration/` to that project, keeping both paths on `bowei.netlify.app`.

Publish IOTA releases to `bowei-iota` with their existing access-control Edge Functions, `_headers`, and `_redirects`. Check the anonymous and signed-in views of both apps using a draft deploy before publishing. The homepage build uses the repository's Hugo files and the proxy. The IOTA assets, compiled access-control functions, and credentials live outside this repository.

The 9B model continues to run on the GPU server. Netlify proxies the five inference operations to its public asynchronous endpoints. Submission immediately returns HTTP 202; the browser polls a random result URL, so model generation does not occupy a long Netlify proxy request. Exact model responses and native conversation history are retained. The API is public, admits one inference at a time, limits request size, isolates portal-wide private trial results, and rejects unrelated browser origins. Jobs expire after six minutes and results after fifteen minutes.

The public API backend depends on the GPU allocation and the server's tunnel. When rotating the tunnel, update the proxy routes in the IOTA project's deploy and its app manifest where applicable.
