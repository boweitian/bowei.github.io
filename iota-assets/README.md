# Private application snapshot

`site.tar.gz.enc` contains an AES-256-GCM encrypted copy of the existing password-protected IOTA site and research assets. The repository owner explicitly authorized publishing this encrypted snapshot while keeping the decryption key private. Only this approved encrypted artifact is tracked; other encrypted files remain ignored.

The application build decrypts this artifact using the private Netlify build configuration. Configure the environment variables described in `docs/iota-netlify.md` before merging or deploying. The original server copy and its access controls remain in place.

`scripts/package-iota.mjs` creates the AES-256-GCM encrypted artifact with the private worker token. Neither that token nor any plaintext snapshot belongs in this repository. Keep a backup of the private build configuration separately.
