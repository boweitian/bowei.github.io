---
title: 'SPARC: Scalable Path-Specific Counterfactual Fairness via Causal Conditional Independence'

# Authors
# If you created a profile for a user (e.g. the default `admin` user), write the username (folder name) here
# and it will be replaced with their full name and linked to their profile.
authors:
  - Bowei Tian
  - Yexiao He
  - Ziyao Wang
  - Meng Liu
  - Yongkai Wu
  - Ang Li

# Author notes (optional)
# author_notes:
#   - 'Equal contribution'
#   - 'Equal contribution'

date: '2026-06-19T00:00:00Z'
doi: ''

# Schedule page publish date (NOT publication's date).
# publishDate: '2026-06-19T00:00:00Z'

# Publication type.
# Legend: 0 = Uncategorized; 1 = Conference paper; 2 = Journal article;
# 3 = Preprint / Working Paper; 4 = Report; 5 = Book; 6 = Book section;
# 7 = Thesis; 8 = Patent
publication_types: ['3']

# Publication name and optional abbreviated publication name.
publication: In European Conference on Computer Vision (ECCV)
publication_short: In European Conference on Computer Vision (ECCV)

abstract: Deep learning models exhibit fairness concerns when predictions are inadvertently influenced by sensitive attributes. However, existing attempts to make Path-Specific Counterfactual Fairness optimizable rely on estimating marginal potential outcome probabilities—an approach that fundamentally requires high-dimensional conditional density estimation and breaks down in modalities such as medical images, where the curse of dimensionality renders reliable estimation infeasible. To address this limitation, we reduce the problem of enforcing Path-Specific Counterfactual Fairness to a causal conditional independence constraint and prove that satisfying this constraint is sufficient to eliminate the unfair causal effect. This reduction replaces intractable counterfactual estimation with a discriminative optimization objective that remains scalable in high-dimensional settings.

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
