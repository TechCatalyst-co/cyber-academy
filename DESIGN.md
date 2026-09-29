---
name: Cyber Academy by TechCatalyst
description: The client's compliance register. Royal frame, white ruled pages, mono register marks.
colors:
  royal: "#1F4487"
  royal-deep: "#173768"
  royal-rail-hover: "#2A5199"
  royal-soft: "#E4E9F3"
  on-royal-quiet: "#C9D3E8"
  mist: "#93A7CB"
  mist-series: "#7B91BC"
  ink: "#101821"
  ink-2: "#3D4859"
  muted: "#586579"
  white: "#FFFFFF"
  paper-2: "#F4F6FA"
  tint: "#E9EDF5"
  rule: "#CBD4E4"
  gridline: "#E6EAF2"
  good: "#3B8A5A"
  good-ink: "#1F6B3E"
  good-soft: "#E6F1EA"
  warn: "#C4891F"
  warn-ink: "#7A5200"
  warn-soft: "#F7EEDB"
  crit: "#B8322B"
  crit-ink: "#9E2A23"
  crit-soft: "#F6E4E2"
  dark-paper-2: "#151F2C"
  dark-tint: "#1B283B"
  dark-rule: "#2A384D"
  dark-text: "#F2F5FA"
  dark-ink-2: "#C5CFDE"
  dark-muted: "#9AABC9"
  dark-brand: "#2B56A3"
  dark-brand-hover: "#3563B5"
  dark-brand-ink: "#A9BCE3"
  dark-brand-soft: "#1A2B47"
  dark-series-1: "#8FA9DD"
  dark-series-2: "#4E6591"
  dark-good: "#5FAF80"
  dark-good-ink: "#7CC79A"
  dark-warn: "#D9A441"
  dark-warn-ink: "#E3B868"
  dark-crit: "#D9665C"
  dark-crit-ink: "#F2958C"
typography:
  display:
    fontFamily: "Archivo, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 5vw, 4rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.03em"
    fontVariation: "\"wdth\" 125"
  headline:
    fontFamily: "Archivo, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "2.1rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.015em"
    fontVariation: "\"wdth\" 118"
  figure-hero:
    fontFamily: "Archivo, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "2.9rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\""
    fontVariation: "\"wdth\" 118"
  figure:
    fontFamily: "Archivo, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "1.7rem"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.02em"
    fontFeature: "\"tnum\""
  title:
    fontFamily: "Archivo, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "1.08rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.005em"
    fontVariation: "\"wdth\" 118"
  body:
    fontFamily: "Archivo, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  lesson:
    fontFamily: "Archivo, Helvetica Neue, Arial, system-ui, sans-serif"
    fontSize: "1.04rem"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.7rem"
    fontWeight: 500
    letterSpacing: "0.08em"
  register:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.74rem"
    fontWeight: 400
    letterSpacing: "0.06em"
  mark:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.68rem"
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "0.05em"
rounded:
  mark: "2px"
  stamp: "3px"
  tab: "5px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  2xs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "28px"
  xl: "32px"
  2xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.royal}"
    textColor: "{colors.white}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.royal-deep}"
    textColor: "{colors.white}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.royal}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-secondary-hover:
    backgroundColor: "{colors.royal-soft}"
    textColor: "{colors.royal}"
  button-small:
    rounded: "{rounded.md}"
    padding: "4px 10px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "9px 11px"
  rail:
    backgroundColor: "{colors.royal}"
    textColor: "{colors.white}"
    width: "256px"
  nav-item:
    textColor: "{colors.white}"
    rounded: "{rounded.tab}"
    padding: "8px 10px"
  nav-item-hover:
    backgroundColor: "{colors.royal-rail-hover}"
  nav-item-active:
    backgroundColor: "{colors.white}"
    textColor: "{colors.royal}"
  binder-tab:
    backgroundColor: "{colors.tint}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.tab}"
    padding: "8px 14px"
  binder-tab-active:
    backgroundColor: "{colors.white}"
    textColor: "{colors.royal}"
  ledger-mark-good:
    textColor: "{colors.good-ink}"
    typography: "{typography.mark}"
    rounded: "{rounded.mark}"
    padding: "1px 6px 1px 5px"
  ledger-mark-warn:
    textColor: "{colors.warn-ink}"
    typography: "{typography.mark}"
    rounded: "{rounded.mark}"
    padding: "1px 6px 1px 5px"
  ledger-mark-crit:
    textColor: "{colors.crit-ink}"
    typography: "{typography.mark}"
    rounded: "{rounded.mark}"
    padding: "1px 6px 1px 5px"
  ledger-mark-neutral:
    textColor: "{colors.ink-2}"
    typography: "{typography.mark}"
    rounded: "{rounded.mark}"
    padding: "1px 6px 1px 5px"
  evidence-stamp:
    textColor: "{colors.royal}"
    rounded: "{rounded.stamp}"
    padding: "1px 6px"
  month-column-open:
    backgroundColor: "{colors.royal-soft}"
    textColor: "{colors.ink}"
    padding: "10px 10px 12px"
  status-bar:
    rounded: "{rounded.stamp}"
    height: "16px"
---

# Design System: Cyber Academy by TechCatalyst

## Overview

**Creative North Star: "The Compliance Register"**

Every screen is a page of the client's compliance register. A Royal navigation rail frames a white work area; inside it, sections are ruled off with Ink lines, ledgers carry register numbers in a leading mono column, completed items take a rectangular evidence stamp, and the page's own index runs as numbered binder tabs. The register is the product's promise made visible: whatever an admin sees can be printed and handed to an insurer, so the screen already looks like the record.

Density is that of a working ledger, not a marketing dashboard. Figures sit in a single summary strip divided by vertical hairlines, with the compliance rate set large in wide Royal Archivo and the rest at a working size. Colour is the TechCatalyst Brand Style Guide v1.0 applied literally: White ground, Royal for the frame, titles and actions, Ink for text and rules, Mist for tints, dividers and chart fills. Status hues are muted and appear only as the ink of outlined ledger marks and thin bars. Dark mode follows the system and sits on Ink, keeping the Royal rail.

The system refuses floating KPI cards over a grey canvas. Surfaces are flat paper; shadow belongs only to things that float above the page. Motion is limited to 150 to 200 ms state changes (row highlight, tab state, rail slide on mobile) with no page-load choreography.

**Key Characteristics:**
- Royal rail and Royal wide titles frame a white, Ink-ruled work area.
- Sections open on a 2px Ink rule with a mono section number, never inside a card.
- Every ledger leads with a mono register number (C-00N, E-00N, X-00N, P-00N, R-00N).
- Status is an outlined mono mark: icon plus uppercase word, no fill.
- Completed, recorded items carry a rectangular mono evidence stamp.
- Two families only: wide Archivo for voice, normal Archivo for data, JetBrains Mono for the record.

## Colors

The TechCatalyst four (Royal, White, Mist, Ink) do all the brand work; a small set of derived tints and three muted status hues carry state.

### Primary
- **TechCatalyst Royal** (`royal`): the navigation rail, the sign-in brand field, page titles (H1), section numbers, primary buttons, links, evidence stamps, the open month's outline in the program ledger, and the Compliant segment of the status bar. In dark mode the Royal rail stays; buttons lift to `dark-brand` and Royal text lifts to `dark-brand-ink` so it stays legible on Ink.
- **Royal Deep** (`royal-deep`): primary button hover only.
- **Rail Hover Royal** (`royal-rail-hover`): hover fill for nav items and rail buttons on the Royal rail.
- **Royal Wash** (`royal-soft`): hover fill for secondary buttons, binder tabs and ledger month columns; selected fill for checks and quiz options; the open month's background.
- **Quiet on Royal** (`on-royal-quiet`): secondary text on the rail and on Royal bands (nav group labels, context meta, role line, the tagline). Brand-safe replacement for Mist-as-text on Royal.

### Secondary
- **Mist** (`mist`): tints, dividers and chart fills only. The At risk segment of the status bar, the square separators in the register line, the hover rule under a ledger month, input and button hover borders, the dashed border of a shown-once secret. Never text.
- **Mist Series** (`mist-series`): the second chart series (Clicked) against Royal's Reported.

### Neutral
- **White** (`white`): the page ground and the certificate. Text on Royal and on Ink bands.
- **Ink** (`ink`): body text and the strong rule (section rules, page-head rule, ledger header rule, binder-tab baseline). In dark mode Ink becomes the page ground and the strong rule turns Mist.
- **Ink Secondary** (`ink-2`): supporting copy, inactive binder-tab labels, legend text, form labels.
- **Register Grey** (`muted`): mono labels, register numbers, table headers, notes. Passes AA on White.
- **Ledger Paper** (`paper-2`): row hover, scheduled month columns, group rows, notices, the lesson scenario panel.
- **Tab Tint** (`tint`): inactive binder tabs and the empty track of bars and meters.
- **Hairline** (`rule`): row rules, tile dividers, input and button borders.
- **Gridline** (`gridline`): chart gridlines only.

### Status
Muted on purpose so status reads as annotation, not alarm. The `-ink` value is the text/border colour of a ledger mark; the base value fills thin bars (risk bars, the Non-compliant status-bar segment, score ring); the `-soft` value is reserved for answered quiz options.
- **Ledger Green** (`good`, `good-ink`, `good-soft`): Compliant, Completed, Reported, Active.
- **Ledger Amber** (`warn`, `warn-ink`, `warn-soft`): At risk, Due soon, Clicked; medium risk.
- **Ledger Red** (`crit`, `crit-ink`, `crit-soft`): Non-compliant, Overdue, Entered data; high risk; negative deltas.

### Dark mode
Applied when the system prefers dark (unless the user forces light) or when `data-theme="dark"` is set. Ground is Ink; `dark-paper-2`, `dark-tint`, `dark-rule` step up from it; text is `dark-text` / `dark-ink-2` / `dark-muted`; Royal actions use `dark-brand` / `dark-brand-hover`, Royal text uses `dark-brand-ink`, washes use `dark-brand-soft`; chart series are `dark-series-1` / `dark-series-2`; status hues brighten to the `dark-good`, `dark-warn`, `dark-crit` family. The rail stays Royal in both modes.

### Named Rules
**The Mist Never Speaks Rule.** Mist is a fill, a tint or a rule, never text, and nothing is ever set White on Mist. Secondary text on Royal uses Quiet on Royal instead.

**The Royal Frame Rule.** Royal owns the frame (rail, sign-in field, certificate and evidence-pack bands), the titles and the actions. The work area stays White; Royal never becomes a card or panel fill inside it.

**The Muted Status Rule.** Status hues colour only the outline and word of a ledger mark and thin data bars. They never fill a row, a panel or a tile; the one exception is the soft tint behind an answered quiz option.

## Typography

**Display Font:** Archivo variable, width axis 118 to 125 (with Helvetica Neue, Arial, system-ui)
**Body Font:** Archivo variable at normal width (same fallbacks)
**Label/Mono Font:** JetBrains Mono variable (with ui-monospace, SFMono-Regular, Menlo, Consolas)

Both families are self-hosted woff2 under SIL OFL. Archivo's width axis supplies the brand guide's unnamed wide grotesque.

**Character:** A stretched, heavy grotesque speaks for TechCatalyst in titles and headline figures; the same family at normal width carries the data quietly; a monospace records everything that is a code, a number in a register, a date on a stamp or a column label.

### Hierarchy
- **Display** (700, width 125, clamp(2.6rem, 5vw, 4rem), line-height 0.98): the product name on the sign-in brand field. The certificate title uses the same voice at 2.3rem in Royal.
- **Headline** (700, width 118, 2.1rem, 1.12; 1.6rem under 860px): the page H1, in Royal, with the register line beneath it.
- **Figure Hero** (700, width 118, 2.9rem, 1.05, tabular): the first figure of a summary strip, in Royal. One per strip.
- **Figure** (650, 1.7rem, 1.15, tabular): the remaining summary-strip figures, in Ink.
- **Title** (700, width 118, 1.08rem): section heads (H2) after the mono section number; ledger group rows reuse wide 700 at 0.9rem in Royal.
- **Body** (400, 15px, 1.55): all data and UI copy; row names at 600, sub-lines at 0.8rem muted.
- **Lesson** (400, 1.04rem, 1.7, max 68ch): learner lesson text only; lesson headings 1.55rem wide 700 in Royal.
- **Label** (JetBrains Mono 500, 0.7rem, 0.08em, uppercase): tile labels, field captions, nav group labels, table headers (0.68rem, 0.07em).
- **Register** (JetBrains Mono, 0.74rem, 0.06em, uppercase in the page meta line): register numbers, the page register line, course codes, month codes, section numbers.
- **Mark** (JetBrains Mono 500, 0.68rem, 0.05em, uppercase): ledger marks; evidence stamps use 0.64rem at 0.06em.

### Named Rules
**The Wide Voice Rule.** Width 118 to 125 is reserved for titles, section heads, hero figures and group rows. Data, table cells and body copy stay at normal width.

**The Mono Record Rule.** If it is an identifier, a code, a date on a stamp or a column label, it is set in JetBrains Mono. Prose and names never are.

## Layout

Two-column shell: a sticky 256px Royal rail and a fluid main column padded 30px 40px 64px, pages capped at 1320px with 28px between sections. Each page opens with a page head: optional back crumb, Royal H1, a mono uppercase register line of facts separated by small Mist squares (for a client: register number, program year, month of 12, plan), an optional sub-line, and actions right-aligned to the baseline; a 2px Ink rule closes it. Numbered binder tabs follow and stick to the top while scrolling.

Content sits on a 12-column grid with 36px row and 32px column gaps; sections span 12, 8/4, 7/5 or 6/6. The summary strip is an auto-fit row of figures (min 150px) divided by vertical hairlines, the first flush left. The program ledger is a single 12-column ruled row of months.

Responsive: under 1180px all partial spans go full width and the program ledger wraps to 6 columns. Under 860px the rail becomes an off-canvas drawer (280px, 200ms slide) behind a sticky Royal top bar, main padding drops to 20px 16px, the hero figure takes a full row and the rest pair up, the ledger wraps to 3 columns, the player's step list becomes a horizontal scroller, and forms go single column. Print hides the rail, tabs and banners and keeps sections unbroken.

**The Ruled Section Rule.** A section begins with a 2px Ink rule, then a baseline row of mono section number, wide title and a muted one-line gloss. Sections are separated by rules and space, never enclosed in cards.

**The Register Number Rule.** Every ledger leads with a narrow mono register-number column: a letter prefix and a three-digit index (C- clients, E- employees, X- exceptions, P- phishing campaigns, R- reports). Client numbers are assigned by date added, server-side, and must read the same on every screen that shows them. Course ledgers lead with the course code in Royal instead.

## Elevation & Depth

Flat paper. Depth is conveyed by rules (2px Ink for structure, 1px hairline between rows), tonal washes (Ledger Paper, Tab Tint, Royal Wash) and the Royal frame. Shadow appears only on layers that float above the page: modal, toast, chart tooltip and the open mobile drawer. The ledger's hover and open states use inset rules, not lift.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 2px 4px rgba(16, 24, 33, .06), 0 12px 32px rgba(16, 24, 33, .12)`; dark: `0 2px 4px rgba(0, 0, 0, .3), 0 16px 40px rgba(0, 0, 0, .45)`): modal, toast, tooltip, open mobile drawer.
- **Open month outline** (`box-shadow: inset 0 0 0 2px` Royal ink): the current program month.
- **Month hover rule** (`box-shadow: inset 0 -3px 0` Mist): hovered or focused ledger month.

**The Flat Paper Rule.** Nothing on the page surface casts a shadow. If an element is not floating over the page, it gets a rule or a wash instead.

## Shapes

Small, almost-square corners that read as printed forms: 2px on ledger marks, 3px on evidence stamps and the status bar, 5px on binder tabs (top corners only) and nav items, 6px on buttons, inputs, checks, quiz options and the ledger frame, 8px on modals. Avatars are the only circles. Rules carry the structure: 2px Ink for section and page heads, 1.5px Ink under ledger headers, 1px hairline between rows. Evidence stamps use a 1.5px border so they read as stamped rather than drawn.

## Components

### Buttons
Plain and firm; weight 650 at 0.86rem, gap 7px for an optional 16px line icon.
- **Shape:** gently squared (6px).
- **Primary:** Royal fill, White text, padding 8px 14px. One per page head (Evidence pack, Add employee, Print).
- **Secondary:** White fill, hairline border, Royal text; hover takes Royal Wash with a Mist border.
- **Small:** 4px 10px at 0.78rem, for row actions (Open, Export, Preview).
- **Link button:** Royal, underlined 3px offset, for inline actions.
- **Hover / Focus:** 150ms ease-out background and border change; focus is a 2px Royal outline offset 2px (White on the rail).
- **Disabled:** 50% opacity with a progress cursor.

### Ledger marks (status)
- **Style:** outlined, unfilled; 1px border in the text colour, 2px corners, JetBrains Mono 0.68rem uppercase, a 12px line icon before the word.
- **Kinds:** good (check), warn (clock or alert), crit (alert), neutral (Hairline border, Ink Secondary text; minus or clock icon, or none), accent (Royal, for plan and track labels).
- Status is never colour alone: every mark carries its word.

### Evidence stamp
Rectangular mono stamp for completed, recorded items: 1.5px Royal border, Royal text, 3px corners, 0.64rem uppercase ("EVIDENCED", "EVIDENCED SEP 27", the certificate number). A late completion stamps in Register Grey. On the certificate it scales to 0.74rem with 4px 10px padding.

### Binder tabs
The page's section index. Numbered mono prefix (01, 02 ...) then the section name at 600 weight. Inactive tabs are Tab Tint with a hairline border and no bottom edge; the current tab turns White, takes an Ink side border and a 3px Royal top edge, and drops 1px to join the Ink baseline rule. Sticky under the page head; horizontally scrollable when narrow.

### Summary strip
One ruled row of figures with vertical hairline dividers and a hairline beneath. Each figure: mono uppercase label, figure, muted note (deltas in good-ink or crit-ink at 650). The first figure is the hero in wide Royal. Followed by the status bar.

### Status bar
A 16px segmented bar with 2px gaps and 3px corners: Compliant in Royal, At risk in Mist, Non-compliant in crit. Always accompanied by a legend of square keys with the count as a word.

### Program ledger (signature)
Twelve month columns in one ruled row (6px frame, hairline dividers). Each column stacks mono month code (M01), module code, completion figure, a 4px Royal progress bar, and either an evidence stamp (closed), an "N OVERDUE" late stamp, or muted due text. Scheduled months sit on Ledger Paper with the word Scheduled. The open month is outlined 2px in Royal on Royal Wash. Hover or focus shows a Mist inset rule and reveals the month's release, due date and counts; selecting opens that course.

### Ledgers / Tables
Full-width, tabular numerals, first and last cells flush to the section edges. Headers are mono uppercase muted labels over a 1.5px Ink rule, sticky. Rows are 11px 12px with hairline rules; clickable rows wash to Ledger Paper in 150ms. Main cell text at 600 with a muted sub-line. Group rows use Ledger Paper with wide Royal type.

### Inputs / Fields
- **Style:** White fill, hairline border, 6px corners, 9px 11px padding; label above at 0.82rem 650 in Ink Secondary; hints 0.78rem muted.
- **Hover:** border goes Mist.
- **Focus:** 2px Royal outline, border cleared.
- **Checks and quiz options:** bordered 6px rows; checked takes a Royal border on Royal Wash. Answered quiz options take the good or crit border on the matching soft tint.
- **Error:** crit-ink text at 0.86rem.

### Navigation
Royal rail, 256px: TechCatalyst logo (white) above the product name in wide 700 White, a ruled context block for the current client (name, mono meta), mono uppercase group labels in Quiet on Royal, then items with an 18px line icon at 75% opacity. Hover takes Rail Hover Royal; the current item inverts to a White fill with Royal text and full-opacity icon. The foot holds the avatar, name, role and outlined rail buttons. Under 860px the rail becomes a drawer behind a sticky Royal top bar with a menu button.

### Branded bands
Certificate and evidence pack open with a Royal band carrying the white TechCatalyst logo left and a mono uppercase caption right in Quiet on Royal. The certificate is always light (hard-set White, Ink, Royal) because it is a printed artifact; the evidence pack ends with a 05 Attestation section of three signature lines (prepared by, reviewed by, date) on Ink rules with mono captions.

## Do's and Don'ts

### Do:
- **Do** open every page with the Royal H1, the mono register line beneath it, and a 2px Ink rule.
- **Do** lead every ledger with a mono register-number column, and keep a client's C-00N identical on every screen that shows it.
- **Do** show status as an outlined mono mark with an icon and a word; pair every coloured bar with a labelled legend.
- **Do** stamp completed, recorded items with the rectangular mono evidence stamp.
- **Do** set identifiers, codes, dates on stamps and column labels in JetBrains Mono; keep names and prose in Archivo.
- **Do** keep state changes between 150 and 200 ms ease-out and honour reduced motion.
- **Do** use the brand guide's accessible pairings only: White on Royal, White on Ink, Ink on Mist, Royal on White.

### Don't:
- **Don't** put figures in floating KPI cards over a grey canvas; use the ruled summary strip.
- **Don't** set text in Mist, and never set White on Mist.
- **Don't** fill rows, panels or tiles with status colour; status hues belong to marks and thin bars.
- **Don't** add shadows to anything that sits on the page; shadow is only for modals, toasts, tooltips and the open drawer.
- **Don't** use wide Archivo for data, table cells or body copy.
- **Don't** show any brand other than TechCatalyst; client names appear as context only.
