# Webtinous Standards — Read This First

> **WEBTINOUS · BY CONTINOUS GROUP**

**Documentation owner:** Webtinous · **by Continous Group**  
**Standard ID:** `webtinousstandard.md`  
**Version:** 6.0.0 · **Updated:** 2026-11-04  
**Applies to:** Every developer, maintainer, reviewer, and assistant working under this standards collection, across supported project types.

**Webtinous branding is required.** Preserve Webtinous · by Continous Group attribution and the required DESIGN.MD identity, including the branded 404 where routed web products apply. Preserve accurate product/client names, third-party rights, and licenses. Attribution does not transfer ownership of third-party work or imply security certification.

## About the Webtinous by Continous Group standard

**Webtinous by Continous Group is the required identity of this reusable professional project standard.** Its purpose is to guide clear requirements, responsible implementation, usable interfaces, accurate documentation, meaningful verification, and production release work across scripts, libraries, web/desktop/mobile apps, services, hardware, and other relevant program types. Apply the modules to the actual scope; a small tool still needs correct behavior and truthful evidence, while a critical product requires deeper controls and records.

The standard rests on these commitments:

- **Required identity:** Credit **Webtinous · by Continous Group** on the standards and adopting work, following DESIGN.MD. Use approved assets and appropriate footer/About/help/package attribution for the product surface. Preserve the document ownership mark/watermark where the format supports it without reducing readability. Co-brand accurately with client/product names and third-party rights. Do not invent a logo, license, ownership claim, or certification.
- **Required design where applicable:** Routed web products use the Webtinous 404 in DESIGN.MD Part E: prominent 404, “Stuck in a loop?”, the required explanation, working home/contact recovery, blue–purple–pink visual language, readable responsive layout, and accessibility/reduced-motion behavior. Other program types use suitable branded help/error surfaces rather than an artificial webpage.
- **Project-aware decisions:** Reuse established choices within their scope. Resolve missing major choices for each new project before adoption. Docker, a cloud provider, a database, or a framework is never selected merely because it is named in a guide.
- **Professional commercial quality:** Meet applicable requirements for correctness, confidentiality, integrity, availability, privacy, recovery, accessibility, maintainability, and delivery. Required checks need observed evidence; a template, polished design, build success, or attribution is not proof of a production-ready system. Certification and trust claims require their own actual evidence under CIA.MD.
- **Traceable documentation:** Keep generated records in webtinousQA/, with clear indexes, durable decisions, useful notes, source-backed maps, accurate version/changelog/update-log records, and truthful handoffs. Prefer Chen for conceptual ER mapping and suitable declared notation for other diagrams.
- **Controlled release:** Ask for or reuse the accepted major/minor/patch decision, synchronize the actual version and release documentation, verify real packages and relevant upgrades, and distinguish preparation from actual authorized publication. MD.MD governs the records; BUILD.MD executes the release checks.

These are working requirements for adopting projects, not a claim that every project is already compliant, audited, secure, or certified. The following directory tells a developer where each requirement is defined and how to apply it without duplicating policy.

## 1. Mandatory starting order

**Every developer and assistant MUST read this file before starting project work.** This is the collection's entry point, directory, task-routing guide, and note-taking policy. Keep the canonical copy at `webtinousQA/webtinousstandard.md` in the codebase root, and link it prominently from the root README and any existing developer/agent entry instructions where appropriate. Read those actual project instructions as well; this file does not override higher-priority instructions or authorize unrelated changes.

Read SOFTWARE.MD next for shared decisions, evidence gates, and reverse-prompt intake. Then read the relevant specialist modules from the directory below, the current project index, accepted decisions, latest useful work notes, and task-specific requirements. Inspect actual code/configuration before assuming a document describes implemented behavior. Re-read changed instructions when they materially affect the task; routine continuation does not require repeating every intake or approval.

If given this file alone, locate the existing `webtinousQA/` collection and project instructions first. If needed files are absent, identify the relevant missing modules and obtain them before work that depends on their unseen requirements. State what has actually been read. Continue independent discovery that does not require the missing decisions. This navigator does not silently supply the full contents of the other modules.

## 2. Directory of every standard

Paths are relative to `webtinousQA/`. Read only the additional modules relevant to the actual task; all applicable requirements remain mandatory.

| File | Owns / purpose | Read when |
| --- | --- | --- |
| [webtinousstandard.md](webtinousstandard.md) | First-read navigation, directory, work records, and handoff. | Before all project work. |
| [SOFTWARE.MD](standards/SOFTWARE.MD) | Core engineering, project decisions, five evidence gates, and reverse-prompt intake. | Every engineering task after this navigator. |
| [MD.MD](standards/MD.MD) | Documentation quality, GitHub README identity/core functions/setup/usage, canonical records, versioning policy, CHANGELOG, UPDATELOG, and GitHub release documentation. | Writing/updating docs, version records, changes, releases, or handoffs. |
| [REQUIREMENTS.MD](standards/REQUIREMENTS.MD) | Scope, users, business rules, constraints, and acceptance criteria. | New work, feature changes, or unclear expected behavior. |
| [DESIGN.MD](standards/DESIGN.MD) | Interfaces, accessibility, devices/themes, required identity, and branded 404. | UI/design, user-facing states, branding, or interface review. |
| [CIA.MD](standards/CIA.MD) | Security, privacy, integrity, availability, trust/certificate management, and control evidence. | Relevant security/data/availability risks and production readiness. |
| [TESTING.MD](standards/TESTING.MD) | Risk-based verification, fixtures, regression, acceptance, and evidence. | Changing behavior, investigating defects, or establishing readiness. |
| [MAPPING.MD](standards/MAPPING.MD) | Source-backed system maps, Chen conceptual ER models, other suitable notations, editable sources, and validation. | Understanding/documenting data, architecture, workflows, dependencies, or system scope. |
| [MAINTENANCE.MD](standards/MAINTENANCE.MD) | Refactoring and measured optimization as distinct workflows. | Structural cleanup, performance investigation, or maintainability work. |
| [OPERATIONS.MD](standards/OPERATIONS.MD) | Installation/deployment, configuration, monitoring, recovery, incidents, and support. | Running, deploying, upgrading, supporting, or recovering a product. |
| [BUILD.MD](standards/BUILD.MD) | Standalone production release execution: version decision, readiness, docs, packaging, upgrade checks, and handoff. | Preparing a release package. Read MD.MD for its documentation policy when available. |
| [HARDWARE.MD](standards/HARDWARE.MD) | Hardware, embedded boundaries, physical validation, and update/recovery needs. | Device, firmware, physical interface, or hardware work. |
| [MOTIONVIDEO.MD](standards/MOTIONVIDEO.MD) | Product motion/video planning, assets, rights, accessibility, production, and QA. | Producing related motion or video deliverables. |
| [CONTINUOUS.MD](standards/CONTINUOUS.MD) | Contextual assistance and guided help within an actual product. | That assistance feature is in scope; it is not a requirement to add an assistant. |

## 3. Task routes and ownership

| Task | Reading route after this file | Essential records |
| --- | --- | --- |
| New project or substantial feature | SOFTWARE → REQUIREMENTS → relevant DESIGN/CIA/MAPPING → TESTING → MD. | Scope, acceptance, consequential decisions, implementation/verification notes. |
| Bug fix | SOFTWARE → relevant requirements/subject guide → TESTING → MD. | Reproduction, actual cause/change, regression results, meaningful update/changelog entry. |
| Refactor or optimize | SOFTWARE → MAINTENANCE → TESTING → MD; MAPPING when affected. | Baseline, accepted scope, behavior/performance evidence, affected maps/docs. |
| Documentation or system mapping | SOFTWARE → MD → MAPPING where maps are involved. | Canonical sources, source/version scope, diagram directory, unknowns, checked links. |
| Production release | SOFTWARE → MD → BUILD, with TESTING/CIA/OPERATIONS and relevant DESIGN/HARDWARE. | Accepted version, release gates, actual packages/checksums, logs, release report. |
| Operations or incident | SOFTWARE → OPERATIONS → CIA/TESTING/MD as relevant. | Sanitized incident/work record, observed state, decisions, recovery/verification, handoff. |

**MD.MD owns documentation/version-history policy; BUILD.MD executes release preparation.** The app's accepted version mechanism remains authoritative for its actual version. This navigator owns where to start and where records live; it does not replace specialist requirements. Resolve conflicts or missing major choices before dependent work.

Existing project choices, such as active Docker use, continue within accepted scope without another approval. A new project must resolve its own unanswered major choices; another project's decisions do not transfer automatically. Webtinous identity and the `webtinousQA/` directory are already selected. No default stack, database, cloud, container, mapping application, or assistance feature is imposed.

## 3.1 Module-by-module SOP and use cases

Use this register to select the procedure for the actual task. Several modules can apply together. Read the linked module's full requirements before dependent work; this SOP summarizes the route, expected records, and completion conditions. Scale records to the task and retain existing canonical locations through indexed links.

### webtinousstandard.md — start, navigate, and resume

**Use cases:** Onboarding a developer; giving an assistant its first instruction; starting a task in an unfamiliar codebase; resuming after a handoff; finding the right standard or existing record.

1. Read this navigator and the actual project/developer instructions. Inspect the webtinousQA index, current work notes, and accepted decisions.
2. Identify the task type and relevant modules using the directory and routes. Locate missing files before relying on their contents.
3. State the intended outcome, known state, consequential unknowns, and completion checks; begin the applicable procedure.

**Records and completion:** A concise task/intake or handoff note with reading route, actual scope, open questions, and links. A developer can find the correct guide and resume without guessing what is approved or complete.

### SOFTWARE.MD — engineering decisions and delivery

**Use cases:** Starting a script, library, app, or service; changing an established feature; fixing a defect across components; reviewing architecture; resolving whether a new project needs Docker or another major technology.

1. Inspect the active implementation and established decisions. Define the requested behavior and relevant engineering boundaries.
2. Reuse accepted choices within scope. Resolve genuinely missing major choices, then implement the agreed change using the applicable subject modules.
3. Apply the five evidence gates, verify meaningful behavior, update affected records, and hand off actual results and limits.

**Records and completion:** Relevant requirements, accepted decisions, code/configuration changes, check evidence, and documentation links. The agreed outcome works within the verified scope; unpassed required gates remain explicit.

### MD.MD — documentation, versions, and history

**Use cases:** Designing a GitHub README with a program logo/name and prominent core functions; maintaining useful installation/usage/help; writing a README or setup guide; documenting a changed API; maintaining architecture/support docs; tracking work progress; preparing CHANGELOG/UPDATELOG; reconciling app versions, GitHub tags, and release notes.

1. Locate each canonical source and identify current behavior versus proposals/history. Establish the version scope and release state where relevant.
2. For a repository README, follow MD.MD section 3.1: show the actual program name and approved logo/wordmark, explain its core functions, and provide useful quick start, installation/configuration, usage, documentation, versions, help, and rights. Keep the public README discoverable and the QA index separate. Update affected instructions and links, record meaningful work in UPDATELOG, and maintain accurate Unreleased/released changes in CHANGELOG. Preserve old release facts.
3. For an actual release, obtain or reuse the accepted major/minor/patch decision, reconcile documentation and applicable GitHub records with source/artifacts, and use BUILD.MD for release execution.

**Records and completion:** A readable, visually polished README that helps a visitor recognize and use the product; indexed current docs; truthful changelog/update log; accepted version record, and applicable draft/actual release references. Links and important instructions are checked, and local preparation is distinguishable from publication.

### REQUIREMENTS.MD — scope and acceptance

**Use cases:** Starting a product; adding a feature; changing a business rule; clarifying an ambiguous request; defining supported users/platforms; deciding what must pass before delivery.

1. Establish intended users, problem, outcome, current behavior, constraints, and scope. Reuse accepted requirements rather than restarting discovery unnecessarily.
2. Resolve consequential ambiguities and record observable acceptance criteria, meaningful failure cases, compatibility, and excluded work.
3. Trace the agreed requirements into implementation and TESTING.MD checks; reassess a material scope change before dependent work.

**Records and completion:** A proportionate requirements/acceptance record with decision links. The team can tell what must be delivered and verified without inventing behavior, owners, or deadlines.

### DESIGN.MD — interfaces and required identity

**Use cases:** Designing a page or screen; improving accessibility; implementing loading/empty/error/success states; adapting mobile/theme behavior; applying Webtinous branding; building the branded web 404.

1. Inspect accepted components, target users/devices, approved brand assets, and actual user flows. Apply required Webtinous identity and the relevant design parts.
2. Implement usable layouts and states. For routed web products, include the required 404 content, visual language, and real home/contact recovery paths.
3. Verify relevant keyboard/focus, contrast, responsive behavior, reduced motion, content clarity, and actual routing/status behavior; record gaps.

**Records and completion:** Design decisions/assets and useful UI/check evidence. Required identity is accurate and relevant flows are usable on the stated targets; missing official assets or failed required checks remain visible.

### CIA.MD — security, privacy, and reliability

**Use cases:** Adding login/permissions; handling sensitive data or uploads; reviewing tenant boundaries; configuring public HTTPS/certificate renewal; assessing data integrity; investigating security/recovery risk; checking production controls.

1. Identify actual trust/data boundaries, critical behavior, applicable controls, and material risks. Do not create an unnecessary subsystem to fill a checklist.
2. Implement or review authoritative protections, certificate trust where relevant, safe data/secret handling, and availability/recovery controls.
3. Verify meaningful denied/malformed/failure/recovery cases and map required controls to actual evidence; assess unresolved findings before release.

**Records and completion:** An appropriately sized control/evidence register, sanitized findings, and recovery/certificate ownership where applicable. Required controls have evidence or an explicit blocked disposition; branding or a TLS certificate does not imply certification.

### TESTING.MD — verification and regression

**Use cases:** Reproducing a bug; verifying a feature or business rule; checking an integration; preventing a past failure; assessing accessibility/performance/recovery; proving release acceptance.

1. Select meaningful checks from actual requirements, changed behavior, critical boundaries, and known risks. Establish isolated representative fixtures and supported environments.
2. Run the relevant unit, integration, workflow, negative, recovery, manual, or physical checks. Keep mock/source-only evidence distinguishable from real-provider or packaged-runtime evidence.
3. Record actual results, defects, environment/source scope, and unrun checks. Recheck affected behavior after meaningful fixes; use BUILD.MD to test the final release package.

**Records and completion:** Relevant tests/fixtures in their required source locations, plus indexed sanitized evidence and findings. Acceptance is supported by observed results, and failed or missing required checks are not labeled passed.

### MAPPING.MD — mind maps and system diagrams

**Use cases:** Understanding an unfamiliar system; mapping feature scope; explaining architecture/dependencies; modeling domain entities or relational tables; documenting a business process, data flow, trust boundary, or deployment.

1. State the question each map answers, actual scope/source revision, intended audience, and whether the model shows current or proposed behavior.
2. Use a mind map for scope/topics; prefer Chen for conceptual ER models and suitable declared notation for other questions. Reuse accepted renderers that can express the notation faithfully.
3. Validate relationships and boundaries against real sources, preserve editable sources/renders, update maps/README.md, and record unknowns and freshness.

**Records and completion:** Indexed source/render pairs with purpose, notation/legend, scope, revision, and verification limits. A diagram's visual completeness does not substitute for source-backed accuracy.

### MAINTENANCE.MD — refactoring and optimization

**Use cases:** Simplifying complex code; reducing duplication; separating responsibilities; cleaning up an established module; investigating slow queries, latency, memory, startup, or resource cost.

1. Choose the refactoring or optimization workflow. For refactoring, define behavior to preserve; for optimization, establish a representative measured baseline and target.
2. Make a focused change within accepted architecture and scope. Resolve consequential behavior or infrastructure changes rather than introducing them incidentally.
3. Verify preserved behavior and, for optimization, measure the relevant outcome under comparable conditions. Update affected maps/docs and record trade-offs.

**Records and completion:** Baseline/scope, actual change, regression evidence, relevant measurements, and limitations. Structural preferences alone do not prove a performance gain or justify an unrelated rewrite.

### OPERATIONS.MD — run, support, and recover

**Use cases:** Installing/running a product; preparing an authorized deployment; changing configuration; establishing monitoring/support; testing backups/restores; responding to an incident; planning rollback or migration recovery.

1. Inspect the accepted platform, environment boundaries, data/recovery needs, operational ownership, and actual authorization.
2. Prepare or follow the applicable install/deploy/configuration/monitoring/recovery procedure, with relevant preconditions, safeguards, and expected results.
3. Verify the actual supported environment and recovery path to the stated scope; record observed results, failures, and handoff information.

**Records and completion:** Indexed operational procedures, configuration templates, ownership/support links, and sanitized incident/recovery evidence. A documented plan or successful backup is not proof that restoration or deployment succeeded.

### BUILD.MD — production release package

**Use cases:** Preparing a major feature release; shipping a compatible smaller update; distributing a bug-fix patch; producing a signed installer/package where required; resuming a failed build for an already accepted target.

1. Identify the release unit, true baseline, source state, target platforms/channel, and authorization. Ask for or reuse the release class/target once; do not increment again on a retry.
2. Complete applicable readiness work, apply the confirmed version coherently, and synchronize documentation, CHANGELOG, UPDATELOG, maps, and applicable GitHub release material under MD.MD.
3. Build actual production artifacts; verify installation/first use, version/core behavior, and relevant upgrades/recovery. Record real filenames, targets, checksums, signing status, evidence, and limitations before the authorized release action.

**Records and completion:** Actual artifacts, release notes, installation/upgrade guidance, checksum manifest, and reports/releases/<version>/README.md. State Ready, Candidate with limitations, or Blocked according to evidence; preparation, publication, and deployment have distinct observed states.

### HARDWARE.MD — devices and embedded work

**Use cases:** Developing firmware; integrating sensors/actuators; changing device protocols; validating power/reset behavior; packaging a device update; checking recovery or physical safety boundaries.

1. Identify actual hardware/firmware versions, interfaces, operating limits, accepted tools, target environment, and consequential physical risks.
2. Implement the agreed change and applicable update/recovery controls. Use appropriate simulations and isolated tests before consequential physical operations within actual authorization.
3. Verify on the required real hardware where necessary, recording device identity, conditions, measurements, and recovery/failure behavior. Label missing physical checks clearly.

**Records and completion:** Relevant interface/configuration docs, firmware identity, diagrams, and actual physical/simulation evidence. A successful compile or emulator result does not prove real-device operation or safety.

### MOTIONVIDEO.MD — product video and motion

**Use cases:** Creating a product walkthrough; demonstrating a feature; producing a release clip; planning interface motion; exporting branded promotional or instructional media.

1. Establish audience, message, actual supported product behavior, format/target, approved assets, rights, and required Webtinous identity.
2. Prepare the relevant storyboard/script, captures, motion, audio/captions, and export using accepted tools and authorized resources.
3. Review content accuracy, readable pacing, accessibility where applicable, rights/credits, output quality, and target playback; do not depict unsupported functionality as shipped.

**Records and completion:** Appropriate script/storyboard/source assets, actual exports, rights/credit references, and review results. Deliverables match the agreed message/format and their claims match the product's actual state.

### CONTINUOUS.MD — contextual assistance and guided help

**Use cases:** Adding contextual product help; guiding onboarding or a workflow; explaining validation errors; improving an existing assistance feature; checking safe handoff from help to an actual product action.

1. Confirm that the assistance capability is in scope and inspect the real product context, user need, permissions, and accepted design.
2. Implement useful, accurate guidance with relevant privacy/authority boundaries, understandable failures, and a suitable fallback or human/support handoff.
3. Verify representative guidance, denied/unknown states, relevant accessibility, and any actual authorized action flow. Avoid invented knowledge or claims that guidance itself completed the user's operation.

**Records and completion:** Relevant behavior/content/design decisions, supported-context notes, and actual checks. Assistance helps the agreed users within its stated limits; unrelated projects do not need this feature merely because the guide exists.

## 4. Project documentation and record directory

Create only useful records/subfolders. Keep the standards themselves in standards/ and project-specific outputs in the appropriate folders below. Existing canonical documentation may stay in place and be linked. Tool-required root files, source tests, manifests, build scripts, and channel files retain their required locations.

| Path under webtinousQA/ | Purpose / record rule |
| --- | --- |
| `webtinousstandard.md` | This required entry point and module directory. |
| `README.md` | Project-specific index: scope, owners when known, current status, links, and important limits. |
| `standards/` | Adopted reusable modules; distinguish them from generated project evidence. |
| `documentation/` | Current setup, contracts, architecture narratives, support, and user/developer guides. |
| `documentation/CHANGELOG.md` | Release-focused changes and an accurate Unreleased section under MD.MD. |
| `documentation/UPDATELOG.md` | Dated meaningful work/documentation progress and status under MD.MD. |
| `notes/` | Working notes, discovery, questions, and session/task handoffs; label assumptions and proposals. |
| `decisions/` | Accepted consequential choices, basis/scope/rationale, and supersession history. |
| `maps/README.md` | Diagram/mind-map directory with purpose, notation, source/render links, scope, freshness, and verification limits. |
| `maps/` | Editable diagram/mind-map sources and useful renders, linked from the map directory. |
| `reports/` | Reviews, QA, benchmarks, investigations, and actual findings. |
| `reports/releases/<version>/README.md` | Release scope, accepted version, source/artifact identity, gates, evidence, and actual publication state. |
| `evidence/` | Sanitized check records, screenshots, and supporting artifacts appropriate to retain. |
| `assets/` | Documentation banners, images, and other required supporting assets. |

Do not create empty placeholder documents to make the tree look complete. A small project may combine related records into clearly indexed sections while keeping current instructions, proposals, decisions, release history, and evidence distinguishable. Avoid competing copies and broken links.

## 5. Notes, updates, and handoff

Before substantial work, briefly record the outcome, current state, intended changes, constraints, acceptance checks, and consequential unknowns. Link the task/issue when available. Inspect existing notes and decisions first; do not turn an assumption or assistant proposal into an accepted decision.

Maintain useful notes at meaningful boundaries: discovery, a material choice, implementation, verification, a blocker, and handoff. Include actual date/timezone where relevant, task/status, facts versus assumptions, changes/affected files, actual checks and results, unresolved issues, and next useful action. A short task can use one concise entry instead of several files. Do not record secrets, unnecessary private information, or a verbatim private conversation.

Promote accepted choices into decisions/, durable explanations into documentation/, and observed checks into reports/evidence. Update the meaningful progress log under MD.MD. Add actual user-facing changes to the appropriate Unreleased changelog entry; finalize release state only when publication is observed. Link canonical records rather than duplicating the same narrative everywhere.

At handoff, state what exists, what changed, which checks actually ran, what failed or remains unverified, and what should happen next. Index new records and maps. Another developer should be able to resume without mistaking a draft, mock, unrun test, or local package for verified production behavior.

## 6. Mind-map and diagram directory

Maintain `maps/README.md` when maps exist. Start with this table structure and populate only actual artifacts:

| Map / question answered | Type and notation | Scope / source revision | Editable source | Render | Verification / limits | Updated / owner |
| --- | --- | --- | --- | --- | --- | --- |

A blank table is a template, not evidence of completed mapping. Give each real map a clear purpose and legend, link source and render, record current versus proposed state, and state unknowns or validation limits. Include a parent/related map link when a useful hierarchy exists. Keep overview, architecture, domain/data, workflow, trust-boundary, and deployment maps distinct where their questions differ.

Use a mind map for scope/topics or navigation. Prefer **Chen notation for conceptual entity–relationship models** under MAPPING.MD; use suitable declared notation for other systems, such as Crow's Foot for a relational schema, UML for relevant behavior/structure, BPMN for a business process, or C4 for architecture. Do not label every mind map Chen or invent a database model for a product that has none. Verify the chosen renderer can express the notation faithfully and reuse accepted tools.

Review affected maps when behavior, schema, dependencies, trust boundaries, operations, or scope changes. Regenerate supported outputs, review their meaning, update the directory, and record the actual source/version. Automatic generation alone does not prove completeness or correctness.

## 7. Completion and limits

Before handoff, confirm that this file and relevant modules were read, actual project choices were respected, the agreed task has evidence, and affected notes/decisions/docs/maps/logs are current and indexed. Apply the core evidence gates proportionately. Required failed checks remain blocked, and missing access or files remain explicit.

Reading this collection does not authorize unrelated technology changes, purchases, remote publication, deployment, announcements, access changes, or production-data operations. Continue actions already authorized by the task without repeated permission questions; resolve genuinely missing scope or decisions before dependent actions.

---

**Webtinous · by Continous Group** — Project Standards · v6.0.0
