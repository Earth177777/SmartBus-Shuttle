# Webtinous Testing and Verification Standard

> **WEBTINOUS · BY CONTINOUS GROUP**

**Documentation owner:** Webtinous · **by Continous Group**  
**Standard ID:** `TESTING.MD`  
**Version:** 6.0.0 · **Updated:** 2026-11-04  
**Applies to:** Behavioral verification, QA evidence, user acceptance, and production release checks.

**Webtinous branding is required.** These standards and adopting work MUST carry **Webtinous · by Continous Group** attribution and follow the required identity in DESIGN.MD. Preserve accurate product/client names and all third-party rights, licenses, and notices; required Webtinous attribution does not transfer ownership of third-party work. Use appropriate co-branding rather than making false ownership claims. This brand requirement is already selected and must not be presented as an optional technology decision.

## Required starting point

**Every developer and assistant MUST read `webtinousQA/webtinousstandard.md` before starting project work.** It is the navigation and working-record guide for this collection. Then read SOFTWARE.MD and the modules relevant to the task; a standalone BUILD.MD invocation retains its essential release checks. Reuse current accepted decisions and read the project's actual instructions. If a required guide is missing, identify it and obtain the needed file before dependent work; do not claim to have read unavailable instructions. Continue useful independent inspection while waiting.

## 1. Purpose and scope

Define how to demonstrate that the agreed behavior works and important failures are controlled. Use REQUIREMENTS.MD's acceptance criteria and SOFTWARE.MD's gates. CIA.MD owns security-control requirements; this file owns the general verification method and evidence structure. BUILD.MD assembles the final release disposition.

Scale checks to the actual change and risk. Test business outcomes, public contracts, trust boundaries, integrations, and regressions rather than reproducing implementation line by line. A percentage or large test count is not a substitute for coverage of meaningful behavior.

## 2. Verification plan

Identify the artifact/source state, environments, critical journeys, affected boundaries, supported platforms, representative data, likely failure modes, required checks, and completion criteria. Reuse established tools and pipelines. Resolve a substantial new test framework or external service through the core decision process.

Use unit checks for focused logic, integration checks for component boundaries, workflow/end-to-end checks for critical outcomes, and manual/user acceptance checks where they add evidence. Add security, performance, recovery, installation, upgrade, device, accessibility, and compatibility checks when their scope exists. Do not require every category for every program.

## 3. Isolated environments and fixtures

Use disposable/local/test resources with safe defaults. Identify data ownership and cleanup. Never run destructive tests, migrations, restore operations, or uncontrolled load against production records merely to complete QA. Real-provider checks require the appropriate access, environment, and existing authorization.

Use realistic synthetic fixtures, including boundary values, permissions, tenant/resource scope, empty and large datasets, unavailable dependencies, and malformed inputs where applicable. Keep credentials, customer records, private recordings, and unnecessary personal information out of fixtures, logs, screenshots, and archives.

## 4. Critical behavior and negative cases

Verify success and material failure paths. Consider invalid input, unauthorized access, expired/revoked state, resource exhaustion, duplicate submission, concurrency, cancellation, partial success, restart, timeout, and retry where relevant. Match each check to the authoritative outcome, not merely a success toast.

A test double may isolate a boundary but must not pretend to prove the real integration it replaces. Use actual integration evidence for claims about providers, native bridges, installations, physical devices, deployment, and restoration. Keep simulation and physical/runtime evidence separate.

## 5. Regression and user acceptance

For important defects, preserve a focused regression check where practical. Verify that the correction addresses the original reproduction without silently changing unrelated behavior. Recheck affected contracts and supported environments.

User acceptance should demonstrate the agreed user outcome with realistic content and roles. Record who reviewed what, actual results, and unresolved issues. Do not invent user approval or claim that an automated screenshot proves full usability/accessibility.

## 6. Results and release gates

| Field | Record |
| --- | --- |
| Check | Requirement/risk addressed and expected outcome. |
| Scope | Actual artifact/source, configuration, environment, data, and method. |
| Result | Passed, Failed, Blocked, or Not run; reason and actual observation. |
| Evidence | Sanitized log, screenshot, report, measurement, or reproducible command. |
| Limitation | Mocked boundary, unsupported platform, missing hardware/provider access, or uncertainty. |

A required failed or blocked check blocks its release gate. Quarantining a flaky check does not erase its risk or prove the behavior passed. Investigate inconsistent results and retain the actual disposition. Do not manufacture results, relabel an unexecuted test, or hide release blockers to produce a green checklist.

Run checks appropriate to the final candidate. If a meaningful change occurs afterward, repeat the affected checks. Preserve reusable valid evidence rather than rerunning unrelated expensive suites without reason.

## 7. Artifact and documentation verification

For release candidates, check the actual packaged build, version/build identity, clean install or supported first use, upgrade with existing data/configuration, and recovery where applicable. Verify the relevant Webtinous branding and 404 requirements in DESIGN.MD.

Check changed documentation, examples, links, configuration names, known issues, and release notes against the delivered artifact. A successful source build alone does not establish that the installer or archive contains the correct executable/resources.

## 8. Workspace

Keep test plans and user acceptance criteria under webtinousQA/documentation/, check summaries and release QA under reports/, and sanitized evidence under evidence/. Keep executable product tests in the repository's established test locations and link them from the QA index. Do not move source tests or tool-required files merely to place all documentation in one folder.

## Acceptance checklist

- **Coverage:** Critical acceptance criteria, changed boundaries, and material negative cases are addressed.
- **Isolation:** Data, credentials, environments, and cleanup are controlled.
- **Accuracy:** Mocked, real integration, deployed, and physical evidence are distinguished.
- **Candidate:** The actual final package/version is checked within its claimed platforms.
- **Disposition:** Actual results, blockers, regressions, and limitations are traceable and honestly reported.

---

**Webtinous · by Continous Group** — Project Standards · v6.0.0
