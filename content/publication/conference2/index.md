---
title: 'MEGATRON: Backdooring Vision Transformers with Invisible Triggers'

# Authors
# If you created a profile for a user (e.g. the default `admin` user), write the username (folder name) here
# and it will be replaced with their full name and linked to their profile.
authors:
  - Xueluan Gong
  - Bowei Tian
  - Meng Xue
  - Yanjiao Chen
  - Qian Wang
  - Mengyuan Sun

# Author notes (optional)
# author_notes:
#   - 'Equal contribution'
#   - 'Equal contribution'

date: '2024-01-01T00:00:00Z'
doi: ''

# Schedule page publish date (NOT publication's date).
# publishDate: '2023-04-05T00:00:00Z'

# Publication type.
# Legend: 0 = Uncategorized; 1 = Conference paper; 2 = Journal article;
# 3 = Preprint / Working Paper; 4 = Report; 5 = Book; 6 = Book section;
# 7 = Thesis; 8 = Patent
publication_types: ['3']

# Publication name and optional abbreviated publication name.
publication: Under review
publication_short: Under review

abstract: Vision transformers have achieved impressive performance in various vision-related tasks, but their vulnerability to backdoor attacks is under-explored. A handful of existing works mainly adapt CNN-oriented backdoor attacks to vision transformers with visible triggers susceptible to state-of-the-art backdoor defenses. In this paper, we propose MEGATRON, a stealthy backdoor attack framework especially targeting vision transformers. The backdoor trigger is processed with masking operations to preserve its effectiveness and concealment as input images are converted into one-dimensional tokens by the transformer model. We discover that training the transformer model with standard backdoor loss functions yields poor attack performance. To address this difficulty, we design two loss terms to improve the attack performance. We propose latent loss to minimize the distance between the backdoored sample and the clean sample of the target label for each layer’s attention. We propose attention diffusion loss to emphasize the importance of the attention diffusion area while reducing the importance of the non-diffusion area during training. We also provide a theoretical analysis that elucidates the rationale behind the attention diffusion loss. Extensive experiments on CIFAR-10, GTSRB, CIFAR-100, and Tiny ImageNet demonstrate that MEGATRON outperforms state-of-the-art vision transformer backdoor attacks. With a trigger as small as 4 pixels, MEGATRON is able to realize a 100% attack success rate. Furthermore, MEGATRON achieves better evasiveness than baselines in terms of both human visual inspection and defense strategies. We will open-source our codes upon publication.

# Summary. An optional shortened abstract.
# summary: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis posuere tellus ac convallis placerat. Proin tincidunt magna sed ex sollicitudin condimentum.

tags: [Vision Transformer, Backdoor attack, Invisible Triggers]

# Display this page in the Featured widget?
featured: false

# Custom links (uncomment lines below)
# links:
# - name: Custom Link
#   url: http://example.org

url_pdf: 'https://arxiv.org/abs/2412.04776'
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
