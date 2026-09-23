# WhatNext Design System

**Version 1.0**

## 1. Purpose

This document is the canonical design reference for WhatNext. It exists so that future interface work follows a coherent system instead of introducing one-off visual decisions.

WhatNext helps people decide what to do next when their day feels busy or messy. The interface should reduce the thinking required to move forward while preserving the product's existing behavior.

This system is organized as:

**Foundations → Primitives → Product Components → Patterns**

Implementation should follow the same direction:

**Design tokens → Primitive UI components → Product/domain components → Page composition**

### Decision status

The following status vocabulary is used throughout this document:

- **Locked v1:** A deliberate Design System v1.0 decision. Do not change it casually or through incidental implementation work.
- **Candidate token:** An implementation target that permits only the tuning explicitly described for that token. Candidate status does not permit casual visual-direction changes.
- **Defined:** The design contract exists; implementation occurs when required by the current product UI. Defined does not mean every component must be implemented immediately.
- **Deferred:** Intentionally outside the current scope. Do not implement without a future product requirement.

## 2. Product and design principles

### Emotional progression

**Relief → Confidence → Momentum**

The practical outcome is efficiency, but the interface should create clarity and relief rather than pressure.

### Design personality

The core personality is **calm competence**.

WhatNext should feel:

- Calm
- Capable
- Dependable
- Focused
- Warm
- Decisive

It should not feel:

- Corporate
- Clinical
- Gamified
- Hustle- or productivity-obsessed
- Futuristic or AI-heavy
- Childish or family-themed
- Sterile
- Visually loud

### Primary design principle

> When life feels busy, WhatNext reduces the thinking required to move forward.

### Trust over magic

Recommendations should feel understandable, not mysterious. Explain why a task fits the user's current situation in reassuring, plain language. Do not present deterministic product behavior as AI magic or use futuristic AI styling.

### Behavior preservation

Visual design work must not silently become a product or UX redesign. Future implementation must preserve the current product behavior unless a separate product decision explicitly changes it.

Locked v1 behavior includes:

- The persistent-workspace order: Current Context → Recommendation → Tasks
- Task create, read, update, and delete behavior
- Recommendation and scoring logic
- Readiness and blocking behavior
- Partial-progress behavior
- Interruption-risk behavior
- Browser persistence
- No-suitable-task behavior
- AI explanation and fallback behavior
- Suggested Plan behavior

## 3. Foundations

### 3.1 Color

#### Brand direction: A1 Evergreen

**Status: Locked v1.**

The Evergreen direction is locked. The scale values are Candidate tokens.

Evergreen should communicate calmness, dependability, and grounded confidence. It must not intentionally signal finance or money, sustainability or environmentalism, or nature and wellness branding. Do not introduce leaf imagery or other nature branding merely because the brand color is green.

| Token | Value | Status |
| --- | --- | --- |
| `evergreen-50` | `#F2F7F4` | Candidate token |
| `evergreen-100` | `#E3EFE8` | Candidate token |
| `evergreen-200` | `#C7DFD1` | Candidate token |
| `evergreen-300` | `#9FC6AE` | Candidate token |
| `evergreen-400` | `#6EA083` | Candidate token |
| `evergreen-500` | `#427D5E` | Candidate token |
| `evergreen-600` | `#286044` | Candidate token |
| `evergreen-700` | `#1F4D37` | Candidate token |
| `evergreen-800` | `#183C2C` | Candidate token |
| `evergreen-900` | `#102A1F` | Candidate token |

Primary action states:

| State | Token |
| --- | --- |
| Default | `evergreen-600` |
| Hover | `evergreen-700` |
| Pressed | `evergreen-800` |

Minor value adjustments are acceptable only when required for accessibility or contrast. Do not casually change the Evergreen visual direction.

#### Neutrals

**Status: Locked v1.**

Use slightly warm neutrals rather than cold blue-gray or slate foundations.

| Semantic token | Value |
| --- | --- |
| `canvas` | `#F7F8F6` |
| `surface-primary` | `#FFFFFF` |
| `surface-secondary` | `#F3F5F3` |
| `surface-elevated` | `#FFFFFF` |
| `text-primary` | `#17211D` |
| `text-secondary` | `#56615C` |
| `text-muted` | `#6A746F` |
| `text-disabled` | `#A4ACA8` |
| `border-subtle` | `#E8ECE9` |
| `border-default` | `#D8DEDA` |
| `border-strong` | `#BBC5BF` |
| `border-control` | `#7B8580` |

`text-muted` is an accessibility-driven minor tuning of the original v1 value. It maintains at least WCAG AA 4.5:1 normal-text contrast on both Surface primary and Canvas. `border-control` provides meaningful control-boundary contrast on those same surfaces.

Minor tuning is permitted only when required to satisfy accessibility or contrast requirements and must preserve the intended warm-neutral visual direction.

#### Semantic colors

**Status: Locked v1.**

The semantic families, treatment, and values are locked and have been verified for WCAG AA text contrast.

Brand color and status color are conceptually separate. Define each semantic family with `surface`, `border`, `text`, and `icon` tokens:

- Success
- Warning
- Danger
- Info

Use a pale surface, restrained border, and darker text/icon. Warning remains amber, Danger remains muted red, and Info remains restrained blue. Avoid large saturated semantic-color blocks unless the meaning genuinely requires that prominence.

| Family | Surface | Border | Text | Icon |
| --- | --- | --- | --- | --- |
| Success | `#EDF7F0` | `#B9DCC5` | `#245C3B` | `#245C3B` |
| Warning | `#FFF8E8` | `#E8D19B` | `#75530A` | `#75530A` |
| Danger | `#FFF1F1` | `#E7B8B8` | `#8A3030` | `#8A3030` |
| Info | `#EFF6FC` | `#BCD3E5` | `#285A78` | `#285A78` |

### 3.2 Semantic token philosophy

**Status: Locked v1.**

The token architecture is an explicit implementation boundary:

- Raw visual values belong only in centralized foundation or token definitions.
- Primitive components consume foundation and/or semantic tokens.
- Product and domain components consume semantic or component tokens and primitives.
- Product and domain components must not contain raw hex colors, direct palette utilities, arbitrary radius values, or arbitrary shadow/elevation values when a system token exists.
- Centralization applies to color, spacing, typography, radius, motion, and elevation/shadow values wherever system tokens exist.

Semantic names describe purpose rather than merely appearance. Central semantic mappings should include:

- `action-primary`
- `action-primary-hover`
- `action-primary-pressed`
- `surface-recommendation`
- `text-primary`
- `text-secondary`
- `border-subtle`
- `status-success-*`
- `status-warning-*`
- `status-danger-*`
- `status-info-*`
- `radius-card`
- `elevation-1`

The primary-action mappings are:

| Semantic token | Foundation token |
| --- | --- |
| `action-primary` | `evergreen-600` |
| `action-primary-hover` | `evergreen-700` |
| `action-primary-pressed` | `evergreen-800` |

Additional semantic mappings established for v1 are:

| Semantic token | Foundation token |
| --- | --- |
| `action-secondary-pressed` | `evergreen-100` |
| `text-brand` | `evergreen-800` |

Palette and foundation tokens may underpin semantic tokens, but product/domain components must use the semantic or component layer. Avoid scattering values or direct utilities such as `#286044`, `bg-green-700`, `text-slate-500`, arbitrary radii, or arbitrary shadows throughout components.

State tokens should remain separate from hierarchy tokens. For example, Danger expresses destructive meaning; it does not automatically imply the most visually prominent button.

### 3.3 Typography

**Status: Locked v1.**

Use **Inter** with appropriate system sans-serif fallbacks. Supported routine weights are 400, 500, and 600. Weight 700 should be exceptional rather than routine.

| Role | Size | Weight | Guidance |
| --- | ---: | ---: | --- |
| Page title | 32px | 600 | Primary page identity |
| Section title | 20px | 600 | Major workflow sections |
| Recommendation title | 24px | 600 | Dominant task within the signature component |
| Component title | 15–16px | 600 | Task and component headings |
| Body | 15px | 400 | Default reading text |
| Body small | 14px | 400 | Supporting explanation |
| Label | 13px | 500 | Form and control labels |
| Metadata | 13px | 400–500 | Quiet task facts |
| Eyebrow | 11px | 600 | Sparse status or hierarchy cue |

Use uppercase, letter-spaced eyebrow treatments sparingly.

Non-binding implementation guidance: use a comfortable line height and readable measure, especially for recommendation explanations.

### 3.4 Spacing

**Status: Locked v1.**

Use a 4px base system. The values in the core scale are locked v1; the token names shown below are implementation naming candidates.

| Candidate token name | Locked v1 value |
| --- | ---: |
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |

Prefer spacing and typographic hierarchy before introducing another border or container.

### 3.5 Radius

**Status: Locked v1.**

| Token | Value | Typical use |
| --- | ---: | --- |
| `radius-small` | 6px | Compact elements |
| `radius-medium` | 10px | Buttons, inputs, selects |
| `radius-large` | 14px | Task items, cards, recommendations |
| `radius-full` | 9999px | Badges |

Avoid excessive or bubbly rounding.

### 3.6 Elevation

**Status: Locked v1.**

| Level | Treatment | Use |
| --- | --- | --- |
| Level 0 | Flat, no shadow | Default for most surfaces |
| Level 1 | Very subtle shadow | Select important surfaces, especially the recommendation |
| Level 2 | Clear floating elevation | Dropdowns and popovers |
| Level 3 | Highest interface elevation | Dialogs and modals |

Borders establish structure. Shadows establish elevation. Do not add shadows merely because an element is a card.

### 3.7 Iconography

**Status: Locked v1.**

Use `lucide-react` as the Lucide implementation when an icon improves comprehension or interaction. Import icons individually and allow them to inherit semantic color through `currentColor`. Do not add icons decoratively, make meaning icon-only, or use overly literal/futuristic AI iconography.

Typical sizes:

- 16px: compact
- 20px: standard
- 24px: prominent

Potential icons include `Clock`, `MapPin`, `Plus`, `Pencil`, `Trash2`, `RotateCcw`, `Check`, `CircleAlert`, `Info`, `ChevronDown`, and `LoaderCircle`.

Interactive icon buttons require accessible names.

Metadata icons are decorative when adjacent text communicates the complete meaning and should use `aria-hidden="true"`. Action text remains visible; icons supplement rather than replace labels.

### 3.8 Motion

**Status: Locked v1.**

| Motion token | Duration |
| --- | ---: |
| Fast | 100–150ms |
| Standard | 150–200ms |
| Deliberate | 200–250ms |

Avoid bounce, gratuitous card animation, animated gradients, or motion that slows task completion. Respect reduced-motion preferences.

### 3.9 Interaction foundations

**Status: Locked v1.**

| Token | Value | Purpose |
| --- | ---: | --- |
| `control-height` | 44px | Default minimum height for buttons, inputs, and selects |
| `icon-size-compact` | 16px | Compact icon and loading-indicator size |
| `icon-size-standard` | 20px | Standard contextual icon size |
| `opacity-disabled` | 60% | Disabled treatment where opacity is appropriate |
| `focus-ring-width` | 2px | Default focus-visible ring width |
| `focus-ring-offset` | 2px | Default focus-visible separation from the component |

The default focus color is Evergreen 600. Interactive primitives should consume this centralized focus treatment rather than define component-specific widths or offsets without a demonstrated need.

## 4. Primitive components

Primitive components should own visual states, accessibility behavior, and semantic-token consumption. Product components should compose primitives rather than duplicate their styling.

### 4.1 Buttons

**Status: Defined.**

Implement variants only when required by the current product UI.

Default button height is approximately 40–44px. Every variant must support default, hover, pressed, focus-visible, disabled, and loading states. Loading must preserve the button's dimensions.

#### Primary

- `action-primary` background and white text
- `action-primary-hover` on hover
- `action-primary-pressed` while pressed
- Visible, restrained Evergreen focus treatment
- Usage guidance: use for the clearest primary action in a context

#### Secondary

- White or subtle surface
- Neutral or restrained brand border
- Primary text
- Subtle brand surface on hover
- Usage guidance: use for meaningful alternatives without competing with Primary

#### Tertiary

- No permanent container
- Low visual emphasis
- Suitable for Edit, Cancel, and similar supporting actions

#### Destructive

- Semantic Danger treatment
- Destructive is a semantic variant, not necessarily a hierarchy level
- Routine Delete actions should usually be low-emphasis destructive rather than permanently filled red

#### Icon Button

- May use Tertiary, Secondary, or Destructive treatment
- Requires an accessible name
- Must not depend on hover to reveal its meaning or availability
- Maintain an adequate interaction target even when the icon itself is compact

### 4.2 Forms

**Status: Defined.**

Implement only the primitives required by the current product UI. Segmented Control is not currently required.

Core form primitives:

- Text Input
- Textarea
- Select
- Checkbox
- Radio/Choice
- Field Label
- Helper Text
- Validation/Error Message

Potential future primitive:

- Segmented Control

Standard anatomy:

**Label → Control → optional helper or error text**

Inputs and selects should generally be approximately 42–44px high. Required states are default, hover, focus, filled, disabled, and error.

Focus uses an Evergreen border and restrained Evergreen focus ring. Errors must communicate through text in addition to color. Current form semantics and behavior must not change merely to use a different control presentation.

### 4.3 Badges

**Status: Defined.**

Variants:

- Neutral
- Brand
- Success
- Warning
- Danger
- Info

Product mappings:

- Ready → Success
- Blocked → Danger

Badges should be small and quiet. High importance must not automatically use Warning or Danger because importance is not an error. Do not turn every piece of task information into a pill.

### 4.4 Metadata

**Status: Locked v1.**

Metadata is distinct from badges. Duration, location, focus, and importance should normally appear as quiet text, for example:

> 15 min · At home · Medium focus

Metadata should be visually subordinate to the task title. Use badges only when the value represents a meaningful semantic status or needs specific emphasis.

Use compact inline icon-and-text metadata when an icon improves scanning. Icons inherit semantic color through `currentColor`, remain subordinate to their text, and are decorative when the adjacent text communicates the complete meaning.

### 4.5 Surfaces and cards

**Status: Defined.**

Surface variants:

- Default
- Subtle
- Brand subtle
- Elevated

Cards are composed from the Surface concept; they are not a reason to invent independent styling. Do not turn every group into a card. Prefer spacing and hierarchy before adding a container or border, and avoid “box inside box inside box” structures.

### 4.6 Feedback

**Status: Defined.**

Do not implement until required by the current product UI.

Define these primitives so future feedback remains consistent:

- Inline Alert
- Toast
- Spinner
- Skeleton

Inline Alert variants are Info, Success, Warning, and Danger. Use feedback components only when the application has a real need; this definition is not a requirement to implement all of them now.

### 4.7 Overlays

**Status: Defined.**

Do not implement until required by the current product UI.

- Dialog
- Confirmation Dialog
- Popover
- Dropdown Menu

Future overlays must support keyboard navigation, focus management, and Escape behavior where appropriate.

## 5. Product components

Product components express WhatNext-specific hierarchy and meaning while consuming primitives and semantic tokens.

During the upcoming UI work, the current product is expected to require the App Header, Task Item, Context Field, Recommendation, Suggested Plan, relevant Empty States, and only the primitives needed to support that interface. Other Defined components are not implementation requirements until the current product UI needs them.

### 5.1 App Header

**Status: Defined.**

Expected for the current UI.

Contains:

- Typographic WhatNext identity
- Supporting product statement where appropriate

Reset sample tasks belongs with the Your Tasks management controls. Treat it as a low-emphasis task-management and demo utility, not as a global product action.

Use a typographic WhatNext wordmark for v1. Do not invent a permanent logo, leaf mark, sidebar navigation, tabs, account menu, or mobile navigation.

### 5.2 Task Item

**Status: Defined.**

Expected for the current UI. Behavior is locked v1.

Hierarchy:

1. Task title
2. Meaningful semantic status
3. Metadata
4. Supporting dependency or progress information
5. Low-emphasis actions such as Edit and Delete

Blocked tasks must remain readable and clearly blocked without appearing visually broken. Edit and Delete must remain discoverable without relying on hover. Visual-system work must not redesign task-management functionality.

### 5.3 Context Field

**Status: Defined.**

Expected for the current UI. Semantics are locked v1.

Used for:

- Time available
- Location
- Focus
- Interruption risk

The design system may later support touch-oriented choice controls, but v1 must not invent new behavior or alter the meaning of the existing controls.

Context controls may use standard-size outline icons inside the control boundary when they clarify the dimension. Keep labels visible and preserve the default control target size. Present the selected context as a quiet, compact confirmation rather than a second form, while retaining every context value.

### 5.4 Recommendation

**Status: Defined.**

Expected for the current UI. Signature-component behavior is locked v1.

The Recommendation carries the strongest visual hierarchy on the page.

Suggested treatment:

- Evergreen 50–100 surface territory
- Subtle Evergreen border
- Optional Level 1 elevation
- Restrained rather than loud presentation

The recommendation treatment may be applied to the component's outer section shell so the primary result, explanation, and Suggested Plan read as one hierarchy without nesting an additional recommendation card.

Hierarchy:

1. Recommended-next eyebrow or status
2. Task title
3. Key metadata
4. Concise reasoning or explanation

The task title should dominate. The explanation should feel reassuring and understandable rather than algorithmic. The component should establish trust by making the recommendation rationale clear.

Do not add a “Start this task” button unless a real corresponding product interaction exists. Visual prominence must not imply nonexistent functionality.

### 5.5 Suggested Plan

**Status: Defined.**

Expected for the current UI. Behavior is locked v1.

The Suggested Plan is subordinate to the primary recommendation and must not visually compete with it.

- Use mostly neutral surfaces
- A restrained brand treatment may indicate option or order

Locked behavior:

- The result contains one primary recommendation
- The Suggested Plan contains up to two follow-up tasks
- Follow-up tasks remain in deterministic rule-based rank order
- Existing explanation behavior is preserved

The intended feeling is:

> When I finish this, WhatNext has already thought about what could follow.

### 5.6 Empty State

**Status: Defined.**

Relevant states are expected for the current UI.

Support at least:

- No tasks
- No suitable task

An Empty State uses:

- A clear title
- One concise explanatory sentence
- An optional restrained icon
- An action when appropriate and when a real action exists

Empty states should feel recovery-oriented rather than like errors. They should help the user understand what can be adjusted without implying failure.

## 6. Product patterns

### 6.1 Workflow hierarchy

WhatNext uses a persistent-workspace hierarchy rather than a numbered wizard. Compose the page in this order:

1. Current Context
2. Recommendation, including Why This Task and Suggested Plan
3. Tasks

Section numbering is not required. Use headings, spacing, surfaces, and proportion to make each region easy to scan, with the Recommendation receiving the strongest emphasis. On desktop, use a moderately wide centered workspace with compact vertical rhythm. Preserve the same semantic and DOM order at narrower widths rather than introducing new navigation or CSS-only visual reordering.

### 6.2 Task information hierarchy

Use title, semantic status, and quiet metadata to support quick scanning. Reserve pills for true status. Avoid equal visual weight across every task attribute.

### 6.3 Recommendation explanation

Present reasoning in plain language and connect it to facts the user supplied, such as time, location, focus, readiness, and interruption risk. Avoid technical scoring language when it would make the explanation feel algorithmic or reduce clarity. Do not imply that AI made the underlying selection when it did not.

### 6.4 Recovery

When there is no recommendation, explain the situation calmly and suggest an available adjustment when appropriate. Do not use alarm styling for a normal no-match state.

## 7. Accessibility

**Status: Locked v1.**

Target WCAG AA.

Requirements:

- Visible focus-visible states
- Keyboard-accessible interactions
- Semantic HTML where practical
- State and meaning communicated through more than color alone
- Textual validation and error communication
- Accessible names for icon-only controls
- Adequate text/background contrast
- Approximately 44px interaction targets where practical
- Reduced-motion preference support

Accessibility requirements take precedence over exact candidate token values. Any necessary token adjustment should be as small as possible and should preserve the intended Evergreen and warm-neutral direction.

## 8. Responsive and future mobile principles

**Status: Locked v1.**

Desktop web is the current scope. The future-readiness principles below are also locked.

The current implementation scope is desktop web. Do not redesign the application for mobile now.

The Accessibility section is authoritative for interaction targets, focus, keyboard access, and other accessibility requirements. In addition, foundational components must avoid future mobile and touch debt:

- Do not make essential interactions hover-only
- Avoid tiny interaction targets
- Avoid dense, desktop-only tables
- Avoid excessive tooltip dependence
- Prefer components that translate naturally to touch interfaces

Responsive work should preserve content priority and behavior rather than introducing new navigation or interaction models.

## 9. Product copy and tone

**Status: Locked v1.**

Copy should be:

- Short
- Calm
- Direct
- Reassuring without being sentimental

Avoid:

- “Optimize your productivity”
- “AI-powered recommendation”
- “Crush your goals”
- “Supercharge your day”

Prefer:

- “Here's what fits right now.”
- “Nothing fits your current situation.”
- “Try adjusting the time you have available.”

Explain recommendations with ordinary, concrete language. Avoid hype, guilt, pressure, or language that treats a busy day as a personal failure.

## 10. Implementation rules

**Status: Locked v1.**

1. Preserve the complete set of behaviors in [Behavior preservation](#behavior-preservation) unless a separate product decision explicitly authorizes a change.
2. Centralize color, spacing, typography, radius, motion, and elevation/shadow values in the token system. Raw visual values belong only in foundation/token definitions; product/domain components consume semantic/component tokens and primitives.
3. Build reusable primitive components before duplicating visual state logic in product components.
4. Compose product components from primitives and semantic tokens.
5. Use the Recommendation as the strongest visual surface; keep the Suggested Plan subordinate.
6. Use warm neutrals and restrained Evergreen brand emphasis.
7. Keep brand and semantic-status colors conceptually separate.
8. Prefer spacing and typography over additional nested containers.
9. Use badges for meaningful status and metadata for ordinary task facts.
10. Do not imply interactions or capabilities that the application does not have.
11. Do not introduce decorative icons, nature branding, or futuristic AI treatments.
12. Implement complete interaction states, including focus-visible, disabled, error, and loading where relevant.
13. Verify contrast and keyboard behavior as part of implementation, not as a later polish pass.
14. Only the Evergreen scale is classified as Candidate token values. Tune it only when accessibility or contrast testing requires a minor adjustment, and preserve the Evergreen visual direction.
15. The neutral palette is Locked v1. Minor tuning is permitted only when accessibility or contrast requirements demand it, and the warm-neutral direction must remain intact.
16. Do not implement Defined components merely because they are documented; implement them when required by the current product UI.

## 11. Explicitly deferred and out of scope

**Status: Deferred.**

Do not define or implement detailed systems for:

- Sidebar
- Bottom navigation
- Tabs
- Breadcrumbs
- Calendar
- Date picker
- Kanban
- Data table
- Charts
- Avatar
- Account menu
- Search
- Command palette
- Drag and drop
- Progress or gamification
- Intention or backlog functionality

This deferred list prevents speculative UI infrastructure from expanding the product or creating visual noise before a real requirement exists.
