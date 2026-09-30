# EegEnu — Capture → Intent V1

## Product Hypothesis & Experiment Contract

### Status

Pre-implementation product contract.

This document defines what Capture → Intent V1 is intended to learn. It is not yet an engineering implementation specification or final UI design.

## 1. Evidence / What We Learned

Research into how people manage everyday responsibilities showed that intentions are frequently externalized into whatever system is convenient when they occur.

Across interviews, participants described using combinations of WhatsApp, Notes, planners, calendars, whiteboards, shopping carts, reminders, paper, and other tools.

Different systems often serve different purposes. The research does not establish that users want to replace these systems with one universal capture application.

The research did identify a potential problem for EegEnu: the current product expects users to maintain a structured set of tasks before contextual recommendations can become useful.

Participants questioned the effort involved in putting all of their tasks into another application, while low-friction systems such as WhatsApp and Notes were already commonly used to capture things as they occurred.

There was also evidence that fragmentation can create retrieval problems: an intention may be captured successfully but later forgotten because it exists in a system the person is not using when the intention becomes relevant.

Subsequent competitive research showed that multiple productivity products already use natural-language, brain-dump, or voice-based capture to reduce structured task-entry friction.

Natural-language capture should therefore not be treated as a unique EegEnu concept.

What remains unknown is whether reducing capture friction materially improves activation and repeated use of EegEnu specifically, and whether EegEnu can transform loosely expressed intentions into useful structure without creating additional work or making unsupported assumptions.

## 2. Problem

EegEnu currently asks users to do substantial organizational work before it can provide value.

When an intention occurs naturally — for example, “renew car insurance,” “buy clothes for my child,” or “research universities for next year” — the user currently has to translate that thought into EegEnu's structured task model.

The current model may require information such as duration, importance, urgency, focus requirement, location, readiness, and whether partial progress is possible.

This creates a mismatch between how intentions naturally occur and how EegEnu expects them to be entered.

If that effort discourages users from putting real intentions into EegEnu, the contextual recommendation system cannot provide enough value regardless of the quality of its recommendation logic.

Capture is therefore being investigated primarily as a possible activation bottleneck to the existing EegEnu thesis, rather than as a new standalone product thesis.

## 3. Hypotheses

### Primary hypothesis — Capture

If users can capture an intention in natural language without structuring it upfront, they will be more willing to put real intentions into EegEnu and return to capture additional intentions over time.

### Secondary hypothesis — Interpretation

If EegEnu can convert naturally expressed intentions into useful task structure while inferring only what the user's language reasonably supports, users will accept that structure with limited correction and trust EegEnu enough to continue using capture.

V1 is not testing whether EegEnu should automatically create calendar events, reminders, alarms, calendar blocks, or other external actions.

EegEnu may recognize signals that suggest those mechanisms would be useful, but actual external execution is outside this experiment.

## 4. Desired Behavior Change

Capture → Intent V1 reverses the current interaction:

**Express first. Structure second.**

The user should be able to write an intention approximately as it occurs in their head without first deciding how EegEnu's task model should represent it.

EegEnu should:

- extract what the user explicitly provided;
- infer information only when reasonably supported;
- tolerate unresolved information;
- avoid requiring structured completeness before capture;
- provide lightweight opportunities to add genuinely useful missing information rather than forcing the user through the full task form.

Missing metadata should not prevent capture unless EegEnu genuinely cannot determine what the user intends.

**Before:** Thought → mentally structure it → complete fields → save task

**After:** Thought → express naturally → EegEnu structures what it can → optionally resolve meaningful gaps → captured

Capture should feel successful even when interpretation is incomplete.

## 5. EegEnu's Responsibilities

### Preserve intent before enriching it

EegEnu's first responsibility is to preserve what the user meant, not to make the task appear more complete.

It must not invent commitments, deadlines, priorities, locations, or other user facts merely to populate the task model. For V1, required Task metadata may use reasonable system estimates under the decision in Section 11; estimates must not be treated as user facts.

### Extract before inferring

Information explicitly supplied by the user takes precedence.

Reasonable inference may follow extraction. Where information is unsupported, it remains unknown unless a system estimate is applied for V1 recommendation compatibility; that estimate is not an inference from the capture.

Unknown is better than confidently wrong.

### Completeness is not the goal

EegEnu should request or surface missing information only when that information materially improves its ability to help the user later.

A field being empty is not itself a reason to question the user.

### Minimize questions

EegEnu may ask a follow-up question when clarification is genuinely necessary to preserve the user's intended action.

It should not ask questions merely to obtain duration, urgency, importance, focus, location, readiness, or partial-progress metadata, even when the existing Task model requires it.

Clarify intent, not metadata.

### Handle multiple intentions intelligently

EegEnu should distinguish between:

- multiple independent intentions; and
- multiple steps belonging to one outcome.

Independent intentions may be split automatically.

Multiple actions that form one workflow should remain one intention.

Example:

- “Buy milk and call Mom” → two intentions.
- “Take photos and email them to the insurance company” → one multi-step intention.

### Preserve useful non-task intentions

EegEnu should not reject useful input merely because another mechanism might eventually represent it better.

For example, an event-like intention may still be captured if EegEnu can preserve it usefully.

However:

**Preserve when possible. Never pretend to execute something EegEnu cannot execute.**

If the user explicitly asks EegEnu to perform an unsupported external action such as blocking a calendar, EegEnu must make the limitation clear rather than implying that the action occurred.

## 6. Interpretation Provenance

Structured information derived from a capture should conceptually distinguish:

- **Explicit** — directly stated by the user.
- **Inferred** — supplied by EegEnu because the language reasonably supports it.
- **Estimated** — supplied by the system as a pragmatic value needed to make the intention usable by the existing recommendation system.
- **Unknown** — insufficient basis and no operational estimate applied.

This distinction exists to prevent implementation defaults or AI guesses from being treated as user-provided facts.

The original capture remains the source of truth. An estimate is not a user fact and must not replace explicit information. The exact technical representation remains an implementation detail; V1 does not require a comprehensive uncertainty architecture.

## 7. Boundaries / Non-Goals

Capture → Intent V1 does not attempt to turn EegEnu into a general-purpose personal assistant.

Outside V1:

- calendar integration or calendar-event creation;
- reminder infrastructure;
- alarm creation;
- WhatsApp, Notes, email, Siri, or other external capture integrations;
- voice capture;
- automatic execution of external actions;
- autonomous multi-step agents;
- changes to the existing contextual recommendation algorithm solely to make it “more AI”;
- replacing all of the user's existing capture systems;
- requiring every captured intention to become a conventional task;
- understanding every possible human intention;
- production architecture intended for large-scale usage.

V1 should remain appropriate for a bounded real-user experiment.

## 8. Evidence We Want

### Capture behavior

Observe whether users:

- use natural-language capture;
- return to capture again after the first attempt;
- use capture outside initial onboarding;
- prefer it over structured task creation;
- submit individual intentions or brain dumps containing multiple intentions.

### Interpretation behavior

Observe:

- whether interpreted captures are accepted;
- how frequently users correct interpretations;
- whether EegEnu makes unsupported assumptions;
- whether incomplete captures remain useful;
- whether captured intentions subsequently participate meaningfully in contextual recommendations.

### Intent-type learning

Where privacy permits, record non-content classifications such as whether a capture appears task-like, reminder-like, calendar-like, planning-like, research-like, ambiguous, or another useful category.

Do not put private capture text into analytics.

The purpose is to learn what users naturally expect EegEnu to handle rather than asking speculative feature-preference questions.

### Possible outcomes

The experiment should allow evidence that:

- capture improves activation and supports contextual recommendation;
- users value capture but not contextual recommendation;
- users value contextual recommendation but do not want another capture destination;
- interpretation creates too much correction or mistrust;
- partially structured intentions are insufficient for useful recommendation;
- another action mechanism such as reminders or calendars deserves investigation.

No single positive outcome is assumed in advance.

## 9. Initial Evaluation Set

These examples are intentionally written in realistic shorthand rather than polished natural language.

Personal names and sensitive details from the original research inputs have been anonymized for repository documentation.

The expectations below describe what the capture supports as user information. Instructions not to invent metadata, or statements that it remains unknown, do not prohibit separately distinguished system estimates for required Task fields under Section 11. Such estimates must preserve the intended action and must not be presented as facts supplied by the user.

### Eval 01

**Input:** check in studies, school reports

**Expected:** Ambiguous. Do not confidently invent the relationship between “studies” and “school reports.” Clarification may be appropriate.

### Eval 02

**Input:** Check insurance for repair visit

**Expected:** Preserve as an administrative/research task. Do not invent coverage, deadline, duration, or urgency.

### Eval 03

**Input:** Shop, clothes for child

**Expected:** Shopping intention. Do not assume physical-store location because shopping may happen online.

### Eval 04

**Input:** Talk to provider regarding bill

**Expected:** Contact provider about bill. Do not assume communication channel, deadline, or urgency.

### Eval 05

**Input:** Parent A report, detail analysis

**Expected:** Review/analyze the report in detail. Do not invent duration or deadline.

### Eval 06

**Input:** Parent B report detail analysis

**Expected:** Same interpretation pattern as Eval 05.

### Eval 07

**Input:** Debug and figure out what's wrong with robot vacuum

**Expected:** One troubleshooting intention, not two tasks. Access to the device may reasonably be relevant; exact issue and duration remain unknown.

### Eval 08

**Input:** Remind partner to schedule dentist appointment

**Expected:** Preserve as reminder-like/delegated intention. EegEnu does not need reminder infrastructure to capture it. Timing remains unknown.

### Eval 09

**Input:** Remind partner to call internet provider

**Expected:** Preserve as reminder-like/delegated intention. Do not invent timing or reason for the call.

### Eval 10

**Input:** Renew car insurance

**Expected:** Administrative renewal task. Provider, due date, duration, and urgency remain unknown.

### Eval 11

**Input:** Renew both driver license

**Expected:** Preserve the fact that two licenses are involved. Do not require identities merely to capture the intention.

### Eval 12

**Input:** Go change the address to book subscription

**Expected:** Subscription/account-maintenance task. Do not invent old/new address or deadline.

### Eval 13

**Input:** Clean and audit all shoes

**Expected:** One broader household intention containing related steps. Do not mechanically split because there are two verbs.

### Eval 14

**Input:** Take photos and send email for the car stain

**Expected:** One multi-step workflow: document the issue and send the related email. Do not split into unrelated intentions.

### Eval 15

**Input:** research universities for fall 2027 PhD programme

**Expected:** Research/planning task. Fall 2027 and PhD are explicit. Field, geography, duration, and selection criteria remain unknown.

### Eval 16

**Input:** Email invoice to client

**Expected:** Communication/administrative task. Email channel is explicit. Do not invent which invoice or deadline.

### Eval 17

**Input:** plan for the second birthday

**Expected:** Planning/project intention. Do not require identity, date, budget, or scope merely to capture it.

### Eval 18

**Input:** Make blueberry jam

**Expected:** Cooking/household task. Home/kitchen context may be a reasonable inference, but timing, quantity, duration, and ingredients remain unknown.

### Eval 19

**Input:** Complete the car registration details

**Expected:** Administrative task. Do not invent system, deadline, or duration.

## 10. Eval Dimensions Identified So Far

The initial cases suggest that future evaluation should test:

- shorthand and sentence fragments;
- incomplete metadata;
- explicit versus inferred information;
- unsupported inference;
- ambiguous intent;
- reminder-like intentions;
- event-like intentions;
- administrative tasks;
- research/planning tasks;
- independent intentions versus multi-step workflows;
- multiple intentions in one capture;
- reasonable versus unsafe context inference;
- when clarification is actually necessary.

This initial set is not considered complete. Additional adversarial and boundary cases should be added after the current EegEnu task model is audited.

## 11. V1 Decision — Pragmatic Interpretation Bridge

The architecture question comparing existing defaults, genuine unknowns, and separate capture is resolved for this bounded V1 experiment. EegEnu will use a pragmatic interpretation bridge:

**Natural-language capture → understand the intended action → derive enough of the existing Task structure to use the current recommendation engine.**

Preserve the original capture as the source of truth. Use explicit information relevant to the Task model rather than replacing it with defaults or estimates, and infer only when reasonably supported by the language. Where required Task metadata is unsupported, V1 may supply reasonable system estimates instead of requiring the user to complete the structured task form. Explicit, inferred, estimated, and unknown information remain conceptually distinct as defined in Section 6.

If EegEnu cannot determine what the person is trying to make happen, it may ask a lightweight clarification. It should clarify intent, not ask questions merely to obtain Task metadata.

The existing complete `Task` shape remains the compatibility boundary for recommendation. Capture/interpretation may derive the values required to cross that boundary; the recommendation engine will not be redesigned for this experiment.

V1 does not require every existing Task consumer to understand null/unknown values, sophisticated confidence scoring, versioned estimation policies, or a generalized sparse-task recommendation system.

The trade-off is deliberate: estimates may produce imperfect recommendations. The purpose is not perfect task interpretation, but learning whether lower-friction capture helps people put real intentions into EegEnu and receive sufficiently useful recommendations to continue using it. Estimation error is accepted for V1; presenting estimates as user facts is not.

Keep the implementation reversible. This is an experiment bridge, not a claim that estimated metadata is the long-term EegEnu task model. Real-user behavior should determine whether the recommendation model needs to evolve later.

## 12. Working Product Principles

1. Express first. Structure second.
2. Preserve intent before enriching it.
3. Extract before inferring.
4. Unknown is better than confidently wrong.
5. Completeness is not the goal.
6. Minimize questions.
7. Clarify intent, not metadata.
8. Split independent intentions, not verbs.
9. Preserve useful input when possible.
10. Never imply an unsupported external action occurred.
11. Track behavioral evidence without logging private capture text.
12. Keep V1 bounded enough to test rather than speculate.
