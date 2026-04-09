# Arkenos Marketing UI Design System

## Reference
This marketing UI is intentionally modeled after the current ElevenLabs public site language shown in the reference screenshots:

- bright white page background
- warm stone canvases inside major sections
- pill controls everywhere
- large but restrained typography
- very light borders and shadows
- premium product-demo panels with lots of empty space
- color only inside focused demo surfaces, avatars, or small gradient orbs

This is not a generic SaaS dashboard aesthetic. It is not glassmorphism. It is not dark-first. It is not a loud startup brand system.

## Primary Goal
Build a calm, premium, editorial landing experience where:

- the shell is mostly monochrome
- the layout feels spacious and expensive
- interactive product previews carry the visual interest
- gradients appear as contained accents, not as page-level branding

## Non-Negotiables

### 1. Marketing Pages Are Light-First
For the public marketing site, default to a bright light theme.

- page background must stay white or near-white
- section canvases should use warm stone or neutral surfaces
- do not design the landing page around dark mode
- do not add a theme toggle to the marketing header
- do not rely on dark variants to make the UI feel complete

Dark mode can exist elsewhere in the product if needed, but the public-facing homepage and marketing sections should be designed to stand on their own in light mode.

### 2. The Shell Must Stay Quiet
Navigation, text, buttons, borders, and layout chrome should remain black, white, and neutral.

- avoid colorful navigation
- avoid gradient text
- avoid tinted cards for basic layout structure
- avoid glowy hover halos
- avoid noisy decorative effects in the header or page shell

If color appears outside a product demo, it should be extremely limited.

### 3. Pills Everywhere
The screenshots rely heavily on soft pill geometry.

- primary buttons: `rounded-full`
- secondary buttons: `rounded-full`
- tab controls: `rounded-full`
- badge controls: `rounded-full`
- small floating actions: `rounded-full`

Avoid mixed geometry where one area is soft and another becomes sharp or boxy without reason.

### 4. Typography Must Feel Editorial, Not Aggressive
The typography should feel confident and calm.

- use large headings with `font-medium` or `font-normal`
- avoid `font-bold` and `font-extrabold` for hero headlines
- avoid default overuse of `tracking-tight`
- use strong black for headings and soft gray for supporting copy
- keep body copy readable and unforced

Headlines should feel elegant, not compressed and shouty.

## Visual System

### Color
The color hierarchy should be:

1. white page background
2. warm stone section canvas
3. white inner card
4. black text and black CTA
5. contained color inside demos only

Preferred shell colors:

- background: `white`
- section canvas: `stone-50`, `zinc-50`, or equivalent warm neutral
- text: `zinc-900`
- secondary text: `zinc-500` to `zinc-600`
- border: subtle neutral, never high-contrast

Accent color usage:

- acceptable: gradient orb in a pill tab
- acceptable: blurred mesh inside a featured product tile
- acceptable: avatar or waveform accent inside a demo
- not acceptable: page-wide gradient washes
- not acceptable: rainbow UI chrome
- not acceptable: gradient typography

### Radius
Use generous radius consistently.

- outer section canvases: `rounded-[2rem]` to `rounded-[3rem]`
- inner cards: `rounded-2xl`
- controls: `rounded-full`

### Borders And Shadows
Depth should come from contrast, not effects.

- borders should be faint
- shadows should be soft and shallow
- avoid large blur shadows
- avoid thick outlines
- avoid glass or frosted surfaces as a default pattern

Good:

- `border-black/5`
- `border-zinc-200`
- `shadow-sm`
- subtle custom shadows under white cards only when needed

Bad:

- heavy backdrop blur nav bars
- obvious glow effects
- deep layered card stacks
- dark translucent glass surfaces on the marketing site

## Layout Rules

### Hero Structure
The hero should match the reference composition:

1. top navigation with restrained spacing
2. two-column editorial intro
3. large full-width product canvas below

Rules:

- left side: large headline
- right side: explanatory paragraph and two CTAs
- below: one oversized demo canvas with generous padding
- avoid stacking everything into a centered blob
- preserve a lot of open space

### Section Rhythm
Each major section should feel like its own editorial spread.

- alternate between white page background and warm stone canvases
- keep sections tall and breathable
- use fewer, larger objects rather than many small cards
- let whitespace do the work

## Header Guidance
The header should feel simple and expensive, not animated and clever.

- keep the logo treatment restrained
- keep nav labels calm and readable
- use black text on white
- use a simple `Log in` button and a black `Sign up` pill
- avoid glowing logo effects
- avoid floating command hints in the marketing header
- avoid complex hover backgrounds unless they are nearly invisible

The header should look closer to a premium product website than a dashboard shell.

## Product Demo Guidance
The product demos are where color and motion can live, but even there the layout should remain clean.

- demos should sit inside a warm neutral outer canvas
- primary demo cards should be white
- keep the number of visible controls low
- prefer one strong focal demo over many competing widgets
- use color in blobs, orbs, avatars, and contained preview content
- leave large regions of negative space

The demo should feel premium and understandable at a glance, not dense.

## Illustration Guidance
For supporting sections like safety, use thin monochrome line-art.

- wireframe geometry
- concentric circles
- simple technical diagrams
- lightly drawn symbolic forms

Do not replace these with emoji-like glyphs or heavy iconography.

## Motion Guidance
Motion should be subtle and purposeful.

- use gentle entrance transitions
- use slow ambient motion inside demo accents if needed
- avoid hyperactive looping UI
- avoid motion in the header unless there is a strong reason
- avoid making every hover state animated

The page should feel alive, not busy.

## Anti-Patterns
If a design choice resembles one of these, it is likely off-spec:

- dark-mode-first landing page
- glassmorphism nav
- startup glow effects
- bold gradient text
- compressed tight-tracking hero type
- dashboard-style chrome on the homepage
- too many segmented controls and toggles
- colorful status chips in core marketing shell
- centered section layouts when the reference is editorial and asymmetrical
- dense cards with not enough whitespace

## Implementation Checklist
Before shipping a marketing page, verify:

- the page works in light mode without relying on dark styling
- the shell is mostly monochrome
- headings use restrained weight
- pills are used consistently
- borders and shadows are subtle
- there is no glassy or glowy header treatment
- colorful elements are contained inside demo content
- sections have enough whitespace
- supporting illustrations use thin line art where appropriate
- the overall feeling is closer to ElevenLabs than to a generic AI SaaS template

## Example Component Intent

### Primary Button
```html
<button className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-zinc-800 transition-colors">
  Sign up
</button>
```

### Secondary Button
```html
<button className="rounded-full bg-white text-zinc-900 border border-zinc-200 px-6 py-2.5 text-sm font-medium hover:bg-zinc-50 transition-colors">
  Contact sales
</button>
```

### Section Canvas
```html
<section className="bg-white">
  <div className="mx-auto max-w-7xl px-6">
    <div className="rounded-[2.5rem] bg-stone-50 p-8 md:p-12">
      <!-- Content -->
    </div>
  </div>
</section>
```

### Demo Card
```html
<div className="rounded-2xl bg-white border border-black/5 shadow-sm p-8">
  <!-- Demo content -->
</div>
```
