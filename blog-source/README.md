# Writing the blog

The personal website uses Hugo. Quarto renders this directory into
`../static/blog`, which Hugo publishes at `/blog/`. Commit both the source and
the rendered output: Netlify runs Hugo and does not execute Quarto or Python.

## Add a post

1. Create `posts/<post-slug>/index.qmd`.
2. Add a title, date, description, and categories in its YAML header.
3. Write the post. Keep its images and other resources in the same folder.
4. From this directory, run `quarto preview` to preview or `quarto render` to
   generate the published files. Python posts require a Jupyter environment
   with the packages used in the article. Set `QUARTO_PYTHON` if needed.
5. From the repository root, review and commit `blog-source` and `static/blog`,
   then push to the branch connected to Netlify.

Example header:

```yaml
---
title: "My new post"
description: "A short summary of the post."
author: "Bowei Tian"
date: "2026-09-27"
categories: [Research]
jupyter: python3
---
```

Omit `jupyter` for posts without executable Python. The blog index updates
automatically when the project is rendered. Edit the `.qmd` sources, not the
generated HTML in `static/blog`.
