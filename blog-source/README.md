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
date: "2026-09-27"
categories: [Research]
jupyter: python3
---
```

Omit `jupyter` for posts without executable Python. The blog index updates
automatically when the project is rendered. Edit the `.qmd` sources, not the
generated HTML in `static/blog`.

## Shared settings

- `_quarto.yml`: site navigation, theme, table of contents, and code folding.
- `posts/_metadata.yml`: default author and the shared comments component for all posts.
- `_includes/giscus.html`: Giscus repository settings and browser language selection.
  Unsupported languages fall back to English. Keep comment scripts out of articles.
- `_environment.local`: optional local `QUARTO_PYTHON` path, ignored by Git.
  In VS Code, select the same Python using **Python: Select Interpreter**;
  the Preview button can override this path with the selected interpreter.

New posts inherit the author, appearance, and comments automatically. Only add
`jupyter: python3` when a post executes Python code.

## Homepage pixel garden

The homepage alone loads `assets/pixel-garden.css` and `assets/pixel-garden.js`.
The garden displays the latest 26 weeks and the last-year total for the GitHub
username in `index.qmd` (`data-user`). Data comes from the public
[GitHub Contributions API](https://github.com/grubersjoe/github-contributions-api)
and is cached in the browser for one hour; no token is embedded in the site.
If the service is unavailable, the widget shows cached data or a retry message.
Click a day to move the cat, click the cat to pet it, or enable its optional walk.
Reduced-motion preferences disable animation and continuous walking.
