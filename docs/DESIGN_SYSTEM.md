# HNG Shop Mobile Design System

## Design direction

HNG Shop uses a warm editorial visual language: paper surfaces, near-black text, terracotta actions, serif display typography, fine rules, generous negative space, and carefully cropped product imagery.

The mobile application should feel native without becoming a generic marketplace interface. Avoid dense dashboards, excessive cards, gradients used as decoration, bright multicolour status systems, and interchangeable sans-serif ecommerce layouts.

## Design principles

### Editorial hierarchy

- Lead with one strong headline rather than several competing cards.
- Use display serif type for identity and moments of emphasis.
- Use compact uppercase sans labels for structure and utility.
- Prefer fine horizontal rules and open space over containers around every element.

### Product-first imagery

- Product images are the dominant catalogue element.
- Use deliberate portrait and landscape crops.
- Never stretch, letterbox, or apply unapproved colour filters.
- Keep controls outside the primary visual focal point where practical.

### Restrained interaction

- Primary actions use ink or terracotta, not generic platform blue.
- Motion confirms relationships and state; it is not decorative spectacle.
- Native gestures and safe-area behavior take priority over mimicking web layout exactly.

### Trust through clarity

- Always show NGN pricing clearly.
- State when displayed cart totals are provisional.
- Distinguish payment, fulfillment, and email state.
- Never imply that a deep link or browser return proves payment.

## Colour system

| Token        | Hex       | Role                                                |
| ------------ | --------- | --------------------------------------------------- |
| `paper`      | `#F2EEE5` | App background, light surfaces                      |
| `paperDeep`  | `#E4DCCD` | Skeletons, inset surfaces, disabled backgrounds     |
| `ink`        | `#171714` | Primary text, dark panels, primary actions          |
| `muted`      | `#6D695F` | Supporting text and secondary metadata              |
| `line`       | `#CFC7B8` | Borders, separators, inactive outlines              |
| `accent`     | `#B33D20` | Primary emphasis, errors, focus, active controls    |
| `accentDark` | `#84301C` | Pressed accent state                                |
| `moss`       | `#33483B` | Paid/success state and restrained positive emphasis |
| `ochre`      | `#D7A05A` | Limited illustration accent                         |
| `white`      | `#FFFFFF` | Email surface and rare contrast use                 |

Semantic mapping:

- Background: `paper`
- Elevated/inset background: `paperDeep`
- Primary foreground: `ink`
- Secondary foreground: `muted`
- Primary border: `line`
- Primary action: `ink`
- Interactive emphasis: `accent`
- Destructive/error: `accent`
- Confirmed payment: `moss`
- Disabled foreground: `muted` at reduced opacity

Do not introduce green for every success-like state. `moss` specifically means confirmed positive status, especially paid. Fulfillment remains neutral unless there is a product decision to change it.

## Typography

### Families

Display semantic family:

```text
iOS: Iowan Old Style, Palatino
Android fallback: serif
Web fallback: Palatino Linotype, Book Antiqua, Georgia, serif
```

Sans semantic family:

```text
iOS: Arial or system sans
Android: sans-serif
Web: Arial, Helvetica, sans-serif
```

The current project does not include licensed font files. Keep typography semantic so a bundled cross-platform display font can be introduced later without rewriting components.

### Mobile type styles

| Style            | Size | Line height | Weight | Tracking | Family          |
| ---------------- | ---: | ----------: | -----: | -------: | --------------- |
| `displayHero`    |   64 |          58 |    400 |     -2.8 | Display         |
| `displayScreen`  |   48 |          46 |    400 |     -2.0 | Display         |
| `displaySection` |   34 |          36 |    400 |     -1.0 | Display         |
| `displayMetric`  |   32 |          34 |    400 |     -0.8 | Display         |
| `title`          |   24 |          28 |    400 |     -0.4 | Display         |
| `bodyLarge`      |   18 |          28 |    400 |        0 | Sans            |
| `body`           |   16 |          24 |    400 |        0 | Sans            |
| `bodySmall`      |   14 |          20 |    400 |        0 | Sans            |
| `label`          |   12 |          16 |    700 |      1.4 | Sans, uppercase |
| `eyebrow`        |   12 |          16 |    700 |      2.6 | Sans, uppercase |
| `badge`          |   11 |          14 |    700 |      1.3 | Sans, uppercase |

Dynamic Type rules:

- Do not set fixed text container heights.
- Allow primary actions to grow vertically.
- At large accessibility sizes, change two-column arrangements to one column.
- Do not truncate order numbers, prices, field errors, or status labels.

## Spacing

The base unit is 4 points.

| Token      | Value |
| ---------- | ----: |
| `space.0`  |     0 |
| `space.1`  |     4 |
| `space.2`  |     8 |
| `space.3`  |    12 |
| `space.4`  |    16 |
| `space.5`  |    20 |
| `space.6`  |    24 |
| `space.8`  |    32 |
| `space.10` |    40 |
| `space.12` |    48 |
| `space.14` |    56 |
| `space.16` |    64 |
| `space.20` |    80 |
| `space.24` |    96 |

Screen gutters:

- Compact phones: 20 points.
- Standard phones: 24 points.
- Tablets: 32–48 points with a bounded content width.

## Shape and borders

| Token             |             Value | Usage                                  |
| ----------------- | ----------------: | -------------------------------------- |
| `radius.none`     |                 0 | Editorial rule-based sections          |
| `radius.sm`       |                 6 | Small badges and compact controls      |
| `radius.md`       |                 8 | Fields, alerts, item thumbnails        |
| `radius.lg`       |                12 | Dark summaries and panels              |
| `radius.xl`       |                16 | Hero media and large skeletons         |
| `radius.full`     |               999 | Buttons, pills, circular controls      |
| `border.hairline` | platform hairline | Dividers                               |
| `border.standard` |                 1 | Fields, secondary controls             |
| `focus.width`     |                 2 | Visible keyboard/web focus equivalents |

Avoid drop shadows as the default separation technique. Use background contrast, space, and borders. If a native floating element requires elevation, keep it subtle and neutral.

## Touch and interaction

- Minimum target: 44 by 44 points.
- Standard field and button height: at least 48 points.
- Primary checkout action: at least 56 points.
- Use pressed-state opacity or `accentDark`, not scale-only feedback.
- Provide haptic feedback only for meaningful confirmation, never every tap.
- Respect reduced motion.
- Avoid hover-dependent affordances in mobile designs.

## Motion

| Motion                | Duration | Curve       |
| --------------------- | -------: | ----------- |
| Micro state           |   120 ms | ease out    |
| Control transition    |   180 ms | ease in-out |
| Screen content reveal |   240 ms | ease out    |
| Image transition      |   300 ms | ease in-out |

Reduced motion:

- Remove parallax and scale transitions.
- Replace pulsing skeletons with static placeholders if requested by platform settings.
- Keep opacity changes brief.

## Image system

- Catalogue portrait: `4:5`.
- Catalogue landscape: `5:4` or `16:10` where layout permits.
- Product detail hero: `4:5` on phone.
- Cart/order thumbnail: square.
- Use cover resize mode.
- Use image caching and a `paperDeep` placeholder.
- Product image alt labels should identify the product only when the image is informative and not already duplicated by adjacent accessible text.

## Component specifications

### Primary button

- Ink background, paper text.
- Full radius.
- 12-point bold uppercase label with wide tracking.
- Minimum height 48; checkout variant 56.
- Pressed background: accent or accent dark.
- Disabled opacity: 0.5; retain readable label.

### Secondary button

- Transparent background.
- One-point line border.
- Ink text.
- Pressed border/text: accent.
- Full radius.

### Text action

- Muted or ink text.
- Accent on active/pressed state.
- Maintain a 44-point hit area even when glyph height is smaller.

### Field

- Label above field in `label` style.
- Transparent or paper background.
- One-point line border and 8-point radius.
- Minimum height 48.
- Error uses accent border and associated body-small message.
- Do not use placeholder text as the only label.

### Select/picker

- Same visual shell as Field.
- Open a native picker or accessible bottom sheet.
- Preserve exact state/FCT values from the API contract.

### Quantity stepper

- Minus, tabular quantity, plus.
- Each control has a 44-point target.
- Accessible labels include product name.
- At quantity one, minus removes the line and must be announced accordingly.

### Product tile

- Image-first.
- Product name and price always visible.
- Supporting copy may be limited to two lines.
- Entire tile is one accessible action.
- Do not place multiple unlabeled overlay actions on the image.

### Status pill

- Text label always present.
- Paid: moss background with paper text.
- Failed: accent background with paper text.
- Pending and neutral fulfillment: paperDeep background with ink text.
- Refunded/cancelled: outlined neutral treatment unless product direction changes.

### Order summary panel

- Ink background and paper text for checkout emphasis.
- White separators at approximately 20% opacity.
- Supporting labels at approximately 55–65% opacity while maintaining contrast.
- Item images use square thumbnails.

### Inline alert

- Accent border and accent text on paper for errors.
- Ink/moss treatment for non-error notices.
- Include an icon only when it adds meaning; text remains sufficient.
- Expose alert semantics to assistive technology.

### Empty state

- Accent eyebrow.
- Large display headline.
- Short muted explanation.
- One primary recovery action.

### Skeleton

- Use paperDeep or low-opacity ink blocks.
- Match final layout dimensions.
- Mark the region busy and provide a concise accessible label.

## Content design

Voice:

- Calm, editorial, direct, and reassuring.
- Local without stereotypes.
- Avoid urgency, fake scarcity, and exaggerated claims.
- Prefer `collection`, `piece`, and `selection` where they remain clear.

Approved patterns:

- `Objects for living well.`
- `A considered way to shop.`
- `Complimentary delivery across Nigeria.`
- `Prices are confirmed securely before payment.`
- `Your first order starts here.`

Avoid:

- `Hurry!`
- `Only 1 left!`
- Unsupported delivery promises.
- Saying an order is “on its way” before fulfillment has progressed.
- Saying confirmation was emailed when email status is failed or pending.

Terminology:

- Customer UI uses British/Nigerian `fulfilment` in prose.
- API/database identifiers retain `fulfillment` for compatibility.
- Use `cart`, not `basket`.
- Use `sign in`, not `login`, in primary customer copy.

## Accessibility

- Support VoiceOver and TalkBack.
- Preserve 44-point targets.
- Associate every error with its input.
- Expose busy and changed states.
- Provide text status labels.
- Preserve contrast under disabled opacity.
- Test the checkout and payment result at large Dynamic Type sizes.
- Do not auto-focus fields in a way that traps screen-reader users.
- Move focus to meaningful headings after stack navigation when platform behavior does not do so reliably.

## Anti-patterns

- Generic white cards on a grey dashboard background.
- Blue default buttons or links that ignore brand tokens.
- Excessive rounded cards around every section.
- Neon gradients, glassmorphism, or decorative blur.
- Product grids with identical aspect ratios and no editorial rhythm.
- Tiny icon-only actions.
- Trusting colour without status text.
- Showing browser concepts such as URL paths or HTTP errors to customers.
- Recreating web hover effects as unnecessary native animation.
