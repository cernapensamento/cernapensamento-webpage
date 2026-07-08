---
name: Nocturnal Prestige
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d1c5b4'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#9a8f80'
  outline-variant: '#4e4639'
  surface-tint: '#e9c176'
  primary: '#e9c176'
  on-primary: '#412d00'
  primary-container: '#c5a059'
  on-primary-container: '#4e3700'
  inverse-primary: '#775a19'
  secondary: '#c8c6c5'
  on-secondary: '#303030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#b0c6f9'
  on-tertiary: '#173059'
  tertiary-container: '#8fa5d6'
  on-tertiary-container: '#233a65'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea5'
  primary-fixed-dim: '#e9c176'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5d4201'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1b1b1c'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#b0c6f9'
  on-tertiary-fixed: '#001a41'
  on-tertiary-fixed-variant: '#304671'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
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
  headline-md:
    fontFamily: Libre Caslon Text
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.1em
spacing:
  unit: 8px
  container-max: 1120px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
This design system explores a sophisticated, high-end editorial aesthetic tailored for dark environments. The brand personality is authoritative, intellectual, and curated, targeting a discerning audience that values deep-focus reading and premium content. 

The style combines **Minimalism** with **Tonal Layering**. By utilizing a restricted palette of deep charcoals and muted metallics, the UI recedes to prioritize typography and imagery. The emotional response is one of calm, nocturnal focus and "quiet luxury," moving away from the starkness of traditional light-mode editorial layouts toward a more immersive, cinematic experience.

## Colors
The palette is rooted in a deep charcoal foundation to reduce eye strain and enhance perceived contrast for the gold accents. 

- **Background (#121212):** The base canvas for all views.
- **Surface (#1E1E1E):** Used for elevated containers, cards, and navigation bars to provide structural depth.
- **Primary Text (#E0E0E0):** An off-white shade that ensures high legibility without the harshness of pure white.
- **Accent Gold (#C5A059):** A muted brass/gold used sparingly for active states, featured links, and brand-critical iconography. 
- **Dividers (#2A2A2A):** Extremely low-contrast borders that define space without cluttering the visual field.

## Typography
The typographic system relies on the interplay between the historical elegance of **Libre Caslon Text** and the functional clarity of **Work Sans**. 

- **Headlines:** Use Libre Caslon Text to establish an authoritative editorial voice. Display sizes should utilize slight negative letter-spacing to feel tighter and more intentional.
- **Body:** Work Sans provides a grounded, neutral counterpoint that excels in low-light readability. 
- **Metadata/Labels:** Use Work Sans in uppercase with generous tracking for a modern, architectural feel that contrasts with the traditional serif headlines.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop to mimic the structured columns of a high-end magazine, centered within the viewport.

- **Desktop:** 12-column grid with a 1120px max-width. Large 40px margins create a sense of exclusivity and "white space" (even in dark mode).
- **Mobile:** 4-column fluid grid. Margins compress to 16px to maximize reading area.
- **Rhythm:** Vertical rhythm is strictly enforced in increments of 8px (the spacing unit). Use generous padding (48px+) between major content sections to allow the eye to rest.

## Elevation & Depth
In this dark editorial system, depth is achieved through **Tonal Layers** rather than shadows. 

- **Level 0 (Base):** #121212 for the global background.
- **Level 1 (Surface):** #1E1E1E for cards, modals, and input fields.
- **Level 2 (Active/Hover):** #252525 for interactive states.

Avoid drop shadows entirely to maintain a flat, modern-classic look. Instead, use a 1px solid border (#2A2A2A) to define the edges of surfaces. Subtle 40% opacity gold glows can be used for high-importance focus states.

## Shapes
This design system utilizes **Sharp (0)** corners for all UI elements. 

The 0px radius reinforces the professional, structural, and "printed matter" quality of the interface. Buttons, cards, images, and input fields should all maintain crisp 90-degree angles to align with the geometric precision of the typography and grid.

## Components
- **Buttons:** Primary buttons use a solid Accent Gold background with black text for maximum impact. Secondary buttons use a ghost style with a 1px #E0E0E0 border and white text.
- **Inputs:** Text fields are #1E1E1E with a bottom-only border of #2A2A2A. On focus, the border transitions to Accent Gold.
- **Cards:** Cards are flush with the surface color (#1E1E1E) and use sharp corners. They should not have shadows; use the tonal difference and thin borders to separate them from the background.
- **Lists:** Editorial lists (e.g., table of contents) should use Work Sans labels with Libre Caslon Text titles. Dividers between list items must be #2A2A2A and 1px thin.
- **Featured Quotes:** Use large-scale Libre Caslon Text in italic, centered, with an Accent Gold vertical bar to the left for visual emphasis.