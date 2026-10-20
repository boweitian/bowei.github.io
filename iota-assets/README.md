# Private application snapshot

`site.tar.gz.enc` is deliberately ignored and not included in this branch. It contains an encrypted copy of the existing password-protected IOTA site and research assets. Publishing that encrypted research payload to this public repository requires separate explicit owner authorization.

The application build expects this artifact. Until its distribution is approved and it is supplied, this branch is a code-only draft and must not replace the current production deployment. The original server copy and its access controls remain in place.

`scripts/package-iota.mjs` creates the AES-256-GCM encrypted artifact with the private worker token. Neither that token nor any plaintext snapshot belongs in this repository. Keep a backup of the private build configuration separately.
