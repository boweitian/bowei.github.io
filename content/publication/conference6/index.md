---
title: 'Spectral Principal Paths: A Spectral Perspective on Linear Representation Formation in LLMs'

# Authors
# If you created a profile for a user (e.g. the default `admin` user), write the username (folder name) here
# and it will be replaced with their full name and linked to their profile.
authors:
  - Bowei Tian
  - Xuntao Lyu
  - Meng Liu
  - Hongyi Wang
  - Ang Li

# Author notes (optional)
# author_notes:
#   - 'Equal contribution'
#   - 'Equal contribution'

date: '2026-07-08T00:00:00Z'
doi: ''

# Schedule page publish date (NOT publication's date).
# publishDate: '2026-06-19T00:00:00Z'

# Publication type.
# Legend: 0 = Uncategorized; 1 = Conference paper; 2 = Journal article;
# 3 = Preprint / Working Paper; 4 = Report; 5 = Book; 6 = Book section;
# 7 = Thesis; 8 = Patent
publication_types: ['1']

# Publication name and optional abbreviated publication name.
publication: In Conference on Language Modeling (COLM)
publication_short: In Conference on Language Modeling (COLM)

abstract: High-level representations have become a central focus in enhancing AI transparency and control, shifting attention from individual neurons or circuits to structured semantic directions that align with human-interpretable concepts. While the Linear Representation Hypothesis (LRH) suggests that such directions emerge in representations, it remains unclear how these representations originate and why they become increasingly stable across layers. To solve this issue, we introduce the Input-Space Linearity Hypothesis, positing that concept-aligned directions originate in the input space and are steadily maintained with increasing depth. We then propose the Spectral Principal Path (SPP) framework, which formalizes how deep networks progressively distill linear representations along the spectral principal directions. We provide rigorous stability guarantees for the SPP based on the Wedin perturbation theorem, identifying testable conditions, including spectral gap and context incoherence, that jointly ensure layer-wise directional preservation. By bridging theoretical analysis with empirical evidence, this work identifies a spectral view of how linear representations arise in LLMs, and suggests potential implications for concept-level controllable, robust, and coherent approaches to fairness and transparency in modern AI systems.

# Summary. An optional shortened abstract.
# summary: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis posuere tellus ac convallis placerat. Proin tincidunt magna sed ex sollicitudin condimentum.

tags: [Counterfactuals, Path Specific Fairness, Causal Inference]

# Display this page in the Featured widget?
featured: false

# Custom links (uncomment lines below)
# links:
# - name: Custom Link
#   url: http://example.org

url_pdf: ''
# url_code: ''
# url_dataset: 'https://github.com/wowchemy/wowchemy-hugo-themes'
# url_poster: ''
# url_project: ''
# url_slides: ''
# url_source: 'https://github.com/wowchemy/wowchemy-hugo-themes'
# url_video: 'https://youtube.com'

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder.
# image:
#   caption: 'Image credit: [**Unsplash**](https://unsplash.com/photos/pLCdAaMFLTE)'
#   focal_point: ''
#   preview_only: false

# Associated Projects (optional).
#   Associate this publication with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `internal-project` references `content/project/internal-project/index.md`.
#   Otherwise, set `projects: []`.
# projects:
#   - example

# Slides (optional).
#   Associate this publication with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides: "example"` references `content/slides/example/index.md`.
#   Otherwise, set `slides: ""`.
# slides: example
---

<!-- {{% callout note %}}
Click the _Cite_ button above to demo the feature to enable visitors to import publication metadata into their reference management software.
{{% /callout %}}

{{% callout note %}}
Create your slides in Markdown - click the _Slides_ button to check out the example.
{{% /callout %}} -->

<!-- Supplementary notes can be added here, including [code, math, and images](https://wowchemy.com/docs/writing-markdown-latex/). -->
