# Webtinous Security, Reliability, and Quality Assurance Standard

> **WEBTINOUS · BY CONTINOUS GROUP**

**Documentation owner:** Webtinous · **by Continous Group**  
**Standard ID:** `CIA.MD`  
**Version:** 6.0.0 · **Updated:** 2026-11-04  
**Applies to:** Applicable security, privacy, reliability, and verification controls.

**Webtinous branding is required.** These standards and adopting work MUST carry **Webtinous · by Continous Group** attribution and follow the required identity in DESIGN.MD. Preserve accurate product/client names and all third-party rights, licenses, and notices; required Webtinous attribution does not transfer ownership of third-party work. Use appropriate co-branding rather than making false ownership claims. This brand requirement is already selected and must not be presented as an optional technology decision.

## Required starting point

**Every developer and assistant MUST read `webtinousQA/webtinousstandard.md` before starting project work.** It is the navigation and working-record guide for this collection. Then read SOFTWARE.MD and the modules relevant to the task; a standalone BUILD.MD invocation retains its essential release checks. Reuse current accepted decisions and read the project's actual instructions. If a required guide is missing, identify it and obtain the needed file before dependent work; do not claim to have read unavailable instructions. Continue useful independent inspection while waiting.

## Professional commercial acceptance

**Commercial delivery requires demonstrated readiness.** Use the core release gate in SOFTWARE.MD and this module's acceptance checks. Define the actual audience, supported environment, acceptance criteria, responsible reviewer, and material risks. Verify critical success, failure, recovery, and permission boundaries that apply. A build, attractive presentation, generated checklist, or installed technology alone does not establish readiness.

Required checks must have actual results and traceable evidence under `webtinousQA/`. Release-blocking failures remain blocked. Label prototypes, drafts, simulations, partial results, and unverified claims accurately; do not present them as production deliverables. Follow the accepted project architecture and choose new major technologies only through the core decision policy.

## Professional security verification and certificate management

### Control basis and coverage

Use a maintained security control basis appropriate to the system. For web applications/services, [OWASP ASVS](https://asvs.owasp.org/) provides verifiable technical requirements; record the adopted version, applicable scope/level, rationale, and control identifiers. [NIST SSDF](https://csrc.nist.gov/projects/ssdf) provides secure development practices. These references support the project's assessment; neither installs a stack nor grants a certification.

Maintain a control-to-evidence matrix under `webtinousQA/reports/` or a linked existing canonical register. Every applicable control needs its requirement, owner, implementation reference, verification method, actual result, environment/source identity, evidence, and remaining risk. Explain exclusions rather than omitting difficult controls. Review negative cases and authoritative enforcement, not only UI paths. Have consequential security/release findings reviewed by an appropriately responsible person rather than treating the author's self-check as independent assurance.

### TLS certificates and trust

Public production HTTPS endpoints MUST present valid certificates trusted by their intended clients, with the correct hostname, valid chain, and current validity period. Verify the actual deployed endpoint and the supported client trust path. Development/self-signed certificates are not a substitute for public production trust. Internal PKI is acceptable where deliberately selected and its trust is correctly provisioned to intended clients.

Platform-managed certificates can meet the requirement. Record the certificate owner, issuing authority or managed service, covered endpoints, renewal mechanism, expiry alert/escalation, and replacement/revocation procedure. Verify renewal configuration and monitor failures using thresholds appropriate to the actual certificate lifecycle. Protect private keys and issuance credentials; do not store them in QA reports. Do not disable certificate or hostname validation to make production checks pass.

Check name mismatch, expired/untrusted or incomplete chains, relevant revocation handling, renewal failure, and applicable service-to-service trust. An application using certificates does not thereby become a certificate authority or satisfy all requirements imposed on issuing CAs. The [CA/Browser Forum TLS baseline](https://cabforum.org/working-groups/server/baseline-requirements/) is a reference for the public certificate ecosystem; assess the adopting application's own responsibilities.

### Assurance claims

Professional quality is the baseline requested here. Formal certification, accredited assessment, or third-party assurance becomes a project requirement only when selected or required by the actual contract or applicable obligations. Identify the scheme, scope, responsible body/reviewer, validity, exclusions, and genuine evidence before making a claim. Keep a TLS certificate, an internal control assessment, an external certification, and an audit report distinct. Do not invent seals, certificate numbers, auditor approval, or “certified” wording.

## Documentation workspace

**Use `webtinousQA/` at the codebase root** for Markdown documents, decisions, mind maps, diagram sources/renders, reports, and QA evidence generated by these standards. Create only the subfolders needed. Keep an index at `webtinousQA/README.md`. Tool-required files retain their required locations and are linked from that index. Existing canonical documentation can be linked rather than duplicated or moved automatically. Never place real secrets or unnecessary private data in the workspace.

## Use with the core standard

**Apply SOFTWARE.MD with this module.** It contains the shared project-decision policy, five evidence gates, and reverse-prompt intake. Supply both files when working with an assistant. Keep established project choices; resolve missing major choices before adopting them. Apply only relevant sections and scale verification to the task.

Do not restart intake for routine work or treat a gate as automatic authorization. This module adds its own subject guidance and acceptance checks.

## 1. Meaning and purpose

**CIA means Confidentiality, Integrity, and Availability in this standard.** Accessibility and product credibility are additional quality concerns; they do not replace the conventional security meaning.

Assess risks for the actual system: a local tool, library, public service, mobile app, device, or data pipeline has different boundaries. Do not add enterprise systems or security products simply to fill a checklist.

## 2. Applicability and evidence

For material controls, record the condition that makes the control applicable, the owner, implementation, verification, and any remaining risk. Keep applicability separate from progress.

Applicability: Applicable, Not applicable with reason, or Undetermined pending investigation.

Verification: Not assessed, Planned, In progress, Implemented but unverified, Verified, Failed, or Blocked. A proposal is not an implementation, and an implementation is not verification. Verified requires the named check, actual result, environment, date, and scope. A waiver or accepted risk is not a passing result.

Maintain an appropriately sized control register in an existing project location. Small projects can use one table. Record material exceptions with owner, reason, compensating measures, scope, and review trigger. Never claim compliance by counting installed tools.

## 3. Confidentiality and privacy

**Identify sensitive data, permitted readers, access paths, retention, and deletion.** Collect only what is needed. Protect real secrets and credentials outside source, client bundles, diagnostics, exports, and examples. Define provisioning, rotation, revocation, and recovery appropriate to the system.

Use encrypted transport for sensitive information crossing untrusted networks. Select storage protection according to the threat model. Separate key access from protected data where practical. Use established cryptography and platform facilities; do not invent algorithms.

When processing personal information, document purpose, access, retention, deletion, and applicable obligations. Do not assert legal compliance without a relevant review. Use sanitized fixtures for tests and demonstrations.

## 4. Integrity and authority

**Validate untrusted inputs at the authoritative boundary.** Use safe database, command, file-path, template, and output mechanisms. Enforce authorization on each protected operation, including alternate entry points, background work, exports, and device/native bridges.

Where applicable, verify roles, ownership, tenant scope, revoked access, stale sessions, and attempts to change identifiers. Authentication establishes identity; authorization decides permitted actions. UI hiding and client-side checks alone do not enforce authority.

Protect important records with appropriate constraints, atomic changes, concurrency controls, auditability, and transition rules. For external side effects, address replay, idempotency, uncertain outcomes, reconciliation, and tampering. Audit records should capture relevant actor, action, target, time, and outcome without unnecessary sensitive content.

## 5. Conditional security controls

Apply these only where the corresponding component exists:

- Authentication: appropriate credential handling, secure password storage if passwords are stored, reset/recovery, throttling, expiration, and risk-based multifactor protection.
- Sessions and tokens: safe storage, revocation, expiration, appropriate cookie attributes, and leakage prevention.
- Web services: appropriate TLS, output encoding, browser headers, origin policy, request forgery defenses, and abuse controls.
- Uploads/imports: content and size limits, safe paths, authorization, storage separation, and processing isolation where needed.
- Datastores and multi-tenancy: least-privilege access, correct tenant/resource constraints, safe migrations, and isolated cross-tenant tests.
- Dependencies and releases: provenance, supported versions, vulnerability review, license review, reproducible artifacts, and protection of signing material where used.
- Native, embedded, and hardware systems: device/OS permissions, update authenticity, physical access assumptions, power/failure behavior, and relevant safety review.

A missing subsystem should be marked Not applicable; it should not be created to satisfy this list.

## 6. Availability and recoverability

**Identify critical functions, dependencies, acceptable interruption, and acceptable data loss.** Agree recovery time and recovery point objectives where business or data risk justifies them. A disposable experiment may not need formal objectives; an important production store usually does.

Use bounded resource consumption, timeouts, safe retries, and concurrency limits where appropriate. Evaluate partial failure, restart, network loss, corruption, storage exhaustion, and external dependency failure. High availability, replication, circuit breakers, and queues require a demonstrated need and an accepted design.

For important persistent data, document backup scope, schedule, access, retention, and restore steps. Test restoration into an isolated target. A successful backup job does not prove that recovery works. Define incident ownership, detection, containment, recovery, and communication appropriate to the project.

## 7. Verification strategy

**Prioritize critical workflows, trust boundaries, business rules, and past failures.** Choose meaningful unit, integration, workflow, security, load, recovery, accessibility, and physical-device checks according to applicability. Do not require every test category or a universal coverage number for every project.

Distinguish source review, mocked tests, isolated integration tests, live-provider checks, deployed checks, and physical tests. Each proves a different scope. Use representative data without exposing production records. A security scan alone does not establish that a system is secure.

## 8. Release assessment

**Assess unresolved findings by impact, exploitability, exposure, likelihood, and affected users.** Release blockers and risk acceptance follow the project's approved policy and applicable obligations. Do not silently lower a gate or label failed checks as passed.

For an applicable release, verify the agreed artifact, critical flows, authorization/data integrity, safe configuration, operational visibility, recovery, documentation, and known limitations. Record the actual artifact/version and environment. Production, business-critical, and regulated scopes require evidence proportionate to their consequences.

Report the concrete checks and gaps. Product badges, internal quality labels, and external certifications require their own authorized criteria and review; adopting these files does not grant a certification.

## Practical examples and reference

### Control record template

| Control | Applicability | Implementation | Verification | Remaining issue |
| --- | --- | --- | --- | --- |
| Resource authorization | State the restricted operation and trusted enforcement boundary. | Link the actual check. | Record the named test/review, environment, date, and outcome. | Record gaps or accepted limits. |
| Recovery | State which durable data matters and why. | Link the backup and restore procedure. | Record the isolated restoration and consistency checks. | Record untested failure modes. |

These are templates, not passing results. Use only applicable rows and actual evidence. Keep control applicability, implementation progress, and verification outcome distinguishable.

### Representative negative checks

Where access control exists, attempt a denied operation directly at the authoritative interface, not only through a hidden button. Consider another user's identifier, another tenant, revoked permission, expired credentials, and an alternate entry point when relevant.

For external input, check malformed, excessive, unexpected, and unauthorized values at the real boundary. For recovery, verify that the restored data can support the intended workflow rather than checking only that a file was created. In a device project, keep software simulation and physical fault tests separate.

### Gate example

A mocked identity test can verify the application branch it exercises. It cannot establish that production provider settings, revocation, transport, and tenant isolation all work. Record the narrower result and the unverified boundaries. If a required boundary remains unverified, describe the gate as Blocked or the delivered work as partial.

## Acceptance checklist

- **Risk:** Trust boundaries, sensitive data, and important misuse/failure cases are identified.
- **Authority:** Applicable permissions are enforced beyond the interface.
- **Protection:** Secrets and sensitive information are excluded from public output.
- **Recovery:** Required restoration and failure handling have corresponding evidence.
- **Truth:** No unsupported security, compliance, or production-readiness claim is present.

---

**Webtinous · by Continous Group** — Project Standards · v6.0.0
