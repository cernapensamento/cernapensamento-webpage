---
name: The Editorial Standard
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#303030'
  inverse-on-surface: '#f2f0f0'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#775a19'
  on-secondary: '#ffffff'
  secondary-container: '#fed488'
  on-secondary-container: '#785a1a'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1c18'
  on-tertiary-container: '#85847e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'
  tertiary-fixed: '#e5e2db'
  tertiary-fixed-dim: '#c9c6c0'
  on-tertiary-fixed: '#1c1c18'
  on-tertiary-fixed-variant: '#474742'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display-lg:
    fontFamily: Libre Caslon Text
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: -0.01em
  display-lg-mobile:
    fontFamily: Libre Caslon Text
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  headline-sm:
    fontFamily: Libre Caslon Text
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Source Sans 3
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 28px
  label-md:
    fontFamily: Source Sans 3
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Source Sans 3
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.03em
spacing:
  unit: 4px
  container-max: 1120px
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
---

## Brand & Style

This design system is built for a weekly literary and philosophical journal. The personality is intellectual, authoritative, and timeless. It prioritizes the "deep reading" experience, moving away from the frantic pace of modern digital media toward a deliberate, contemplative environment.

The aesthetic follows a **Refined Minimalist** approach. It leverages heavy whitespace, strict typographic hierarchies, and a limited, high-quality color palette to signal credibility and focus. Visual noise is systematically removed to ensure that the philosophical and economic discourse remains the primary focus. The emotional response should be one of calm, intellectual rigor, and institutional permanence.

## Colors

The palette is rooted in the physical history of publishing. 

- **Primary (Deep Charcoal):** Used for headlines and primary text to ensure maximum legibility and a sense of gravity.
- **Secondary (Muted Gold):** Reserved for accents, such as category tags, drop caps, or high-level call-to-actions. It provides a sense of prestige without being ostentatious.
- **Tertiary (Ivory Parchment):** The global background color. It reduces eye strain compared to pure white and evokes the tactile quality of high-grade paper.
- **Neutral:** A range of grays used for secondary metadata, borders, and UI supporting elements.

Avoid pure black (#000000) to maintain a sophisticated, organic feel.

## Typography

The typography strategy employs a "Serif for Thought, Sans for Utility" philosophy. 

**Libre Caslon Text** is used for all editorial headings. Its classical proportions and sharp serifs provide the necessary authority for philosophical discourse. For display sizes, a slight negative letter-spacing is applied to tighten the visual impact.

**Source Sans 3** is used for body copy and UI labels. It was chosen for its exceptional legibility in long-form prose and its neutral, modern character that doesn't compete with the headlines. 

Editorial body text should be kept to a maximum line length of 65-75 characters to optimize reading speed and comprehension.

## Layout & Spacing

This design system utilizes a **Fixed Grid** model for desktop to maintain the feel of a printed journal, centering content within a wide margin. 

- **Grid:** A 12-column grid for desktop, transitioning to a single-column flow for mobile.
- **Rhythm:** An 8px baseline grid ensures vertical rhythm. 
- **Whitespace:** Generous section gaps (120px+) are used to separate distinct essays or philosophical inquiries, providing "breathing room" for the reader to process information.
- **Mobile:** On smaller screens, margins are reduced, but line-height is maintained to ensure the reading experience remains un-cramped.

## Elevation & Depth

To maintain a "printed page" aesthetic, this design system avoids heavy shadows and 3D effects. Depth is conveyed through **Tonal Layers** and **Low-Contrast Outlines**.

- **Surface Tiers:** The base layer is the Ivory Parchment. Cards or featured sections may use a slightly lighter or darker tint (2-3% variance) to create subtle separation.
- **Borders:** Instead of shadows, use 1px solid borders in a soft neutral (e.g., #E5E1D8) to define containers.
- **Interactive States:** Lifted elements (like a hovered article card) should not use a shadow; instead, they should employ a subtle background color shift or the appearance of the secondary gold accent as a thin border.

## Shapes

The shape language is strictly **Sharp (0px)**. 

In keeping with traditional publishing and the brutalist-minimalist leanings of academic journals, rounded corners are avoided. Every button, input field, and image container features crisp, 90-degree angles. This reinforces the "unrefined" yet professional nature of the content and differentiates it from consumer-grade "soft" web apps.

## Components

- **Buttons:** Primary buttons are solid Deep Charcoal with Ivory text. Secondary buttons are outlined (1px Deep Charcoal). All buttons are rectangular with no corner radius.
- **Article Cards:** Minimalist layouts. Headline in Libre Caslon, a short excerpt in Source Sans, and a Muted Gold category label at the top. No shadows; separation via whitespace or a thin bottom border.
- **Input Fields:** Bottom-border only (underlined style) to mimic the act of writing on a line. 
- **Drop Caps:** For long-form essays, the first letter of the first paragraph may be rendered in Libre Caslon, Muted Gold, spanning 3 lines of text.
- **Pull Quotes:** Centered or slightly offset text in Libre Caslon, italicized, with thin Muted Gold vertical rules on either side.
- **Navigation:** A minimalist top-bar with a centered wordmark. Links use the `label-md` style with high letter spacing.