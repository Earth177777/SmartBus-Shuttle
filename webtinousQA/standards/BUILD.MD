# Webtinous Production Release and Packaging Playbook

> **WEBTINOUS · BY CONTINOUS GROUP**

**Documentation owner:** Webtinous · **by Continous Group**  
**Standard ID:** `BUILD.MD`  
**Version:** 6.0.0 · **Updated:** 2026-11-04  
**Applies to:** A standalone instruction for preparing a production-grade app/package release from an actual codebase.

**Webtinous branding is required.** These standards and adopting work MUST carry **Webtinous · by Continous Group** attribution and follow the required identity in DESIGN.MD. Preserve accurate product/client names and all third-party rights, licenses, and notices; required Webtinous attribution does not transfer ownership of third-party work. Use appropriate co-branding rather than making false ownership claims. This brand requirement is already selected and must not be presented as an optional technology decision.

## Required starting point

**Every developer and assistant MUST read `webtinousQA/webtinousstandard.md` before starting project work.** It is the navigation and working-record guide for this collection. Then read SOFTWARE.MD and the modules relevant to the task; a standalone BUILD.MD invocation retains its essential release checks. Reuse current accepted decisions and read the project's actual instructions. If a required guide is missing, identify it and obtain the needed file before dependent work; do not claim to have read unavailable instructions. Continue useful independent inspection while waiting.

## 1. How to invoke this file

Give this file and the intended codebase to the assistant and say: **“Follow BUILD.MD and prepare the next production release package.”** The assistant must inspect the real project, resolve the release version with the user, complete the applicable readiness work, update documentation, build and verify actual artifacts, and provide a reviewable release handoff. A plan or an untested archive is not a completed release package.

This playbook is self-contained. MD.MD owns documentation policy for versioning, changelogs, update logs, and GitHub release records; follow it when supplied. This file executes that policy and retains the essential version-confirmation and release checks when used alone. Use other Webtinous modules when supplied; their absence does not permit skipping the essential checks below. Inspect the repository's instructions, setup, manifests, source, existing tests, release scripts, platform metadata, and previous release records. Preserve unrelated work. Keep established project tools and do not introduce Docker, a framework, installer system, hosting, or substantial provider merely because a release is requested.

**Webtinous · by Continous Group branding is required.** Verify approved assets, relevant footer/About/help/package credits, and the branded 404 for routed web products. Preserve accurate third-party/client ownership and licenses. Do not invent official assets or certification claims. If the required brand assets or a material decision are unavailable, finish independent work and report the actual blocked item.

## 2. Release intake and source identity

Identify the application/release unit, current authoritative app version, last actual release, intended changes, target platforms/architectures/channel, packaging format, current source state, and existing authorization. A monorepo can have several independently versioned units; resolve which ones belong to this release. The version of this standards document is separate from the application's version.

Briefly summarize the requested outcome, current state, changes, constraints, and completion checks. Ask only consequential unanswered questions. Reuse explicit choices already given in the request or accepted project decisions. Resolve an uncertain release baseline or conflicting version sources before changing versions. Do not commit, discard, or overwrite unrelated work to manufacture a clean state.

## 3. Ask the user about the version

**Before changing release-version files, ask whether this is a big/major update, small/minor update, or fix/patch release.** Show the current app version, your recommended classification and reason, and the proposed target. The user's explicit release class or exact target version already supplied for this release counts as the decision; do not ask the same question again. Continue independent preflight checks while waiting, but do not silently finalize the version.

Use MAJOR.MINOR.PATCH. From an example current version of **2.4.7**:

| User choice | Version operation | Proposed example |
| --- | --- | --- |
| Big / major update | Increase major; reset minor and patch. | 3.0.0 |
| Small / minor update | Increase minor; reset patch. | 2.5.0 |
| Fix / patch | Increase patch. | 2.4.8 |

The user's shorthand “1.0.0 / 0.1.0 / 0.0.1” describes which component changes; it does not reset every product to those literal versions. Breaking public contracts generally require major treatment; backward-compatible additions fit minor; backward-compatible fixes fit patch. Base recommendations on actual compatibility and release scope, not line count. For pre-1.0, prerelease channels, custom explicit versions, or an inconsistent requested classification, explain the consequence and confirm the intended target. Reference: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Record the accepted current version, class, target, basis, and relevant compatibility notes. Increment once per release. If resuming a failed build for an already accepted target, reuse that target instead of incrementing again. Do not replace an already published artifact with different contents under the same released version.

## 4. Production readiness before packaging

Define the applicable acceptance criteria and release gates for the actual product. Each required check needs actual evidence for the candidate and supported environment.

- **Functionality:** Critical workflows, business rules, data transformations, and material negative cases work with representative inputs and permissions.
- **Security/privacy:** Authoritative access controls, input handling, secret management, dependencies, sensitive data, and relevant upload/network/TLS controls pass appropriate checks. Public HTTPS trust must be valid for intended clients; production checks must not disable verification.
- **Reliability/data:** Relevant retries, timeouts, concurrency, restart, partial outcomes, migration, backups, restore, and rollback/forward recovery are addressed and verified to the stated scope.
- **Interface/branding:** Required Webtinous identity, correct product/version display where supported, safe errors, usable loading/empty/success states, supported devices, relevant themes, and accessibility are reviewed. Routed web products include the required branded 404.
- **Distribution/operation:** The intended install/update/run path, supported targets, configuration, permissions, diagnostics, support information, and actual operational ownership are established.
- **Commercial integrity:** Claims, licenses, asset rights, attribution, limitations, and any actual assurance commitments match the delivered scope.

A critical/high-severity defect affecting the release, exposed secret, broken critical workflow, material data-loss risk, unmet safety requirement, or failed mandatory control blocks production readiness until resolved or evidenced not to apply. Do not self-waive mandatory project, safety, legal, or contractual controls. Record eligible lesser deviations with accountable acceptance and a remediation/review trigger; exceptions are not passing tests.

Keep prototype, mock, source-only, simulated, hardware, real-provider, deployed, and complete-package evidence distinguishable. A successful build or attractive screenshot does not satisfy the full readiness gate. When a required check cannot run, record why and label the deliverable incomplete or blocked for that scope.

## 5. Apply the confirmed version consistently

Use the project's authoritative version mechanism. Update relevant manifests, package/installer metadata, native bundle/product versions, firmware/package identity, generated version sources, lockfile metadata where required by the actual tools, and displayed app version where supported. Use established tooling for generated files.

Platform build numbers and version codes can have different monotonic requirements from the user-facing version; inspect the actual platform rules and accepted project policy. Do not blindly copy SemVer text into a field that uses another required format. Update each targeted release unit coherently and preserve unrelated package versions.

Check that source metadata, built executable/package, installer/update metadata, release notes, and actual version display agree. Search for relevant stale version references, but do not rewrite historical changelog entries, old migration records, dependency versions, or every number resembling a version.

## 6. Synchronize documentation and release records

Update the documentation affected by the release: current features and limitations, setup/build/installation, configuration, APIs/contracts, architecture and maps, security or operations, migration/upgrade instructions, supported targets, and known issues. Regenerate applicable maps/inventories and review changed narratives; running a generator alone does not verify their meaning.

Maintain the canonical CHANGELOG and UPDATELOG under MD.MD policy, with links in the webtinousQA index. Keep release-focused changes distinct from dated work/documentation progress; Unreleased/candidate/draft status must remain truthful. Maintain user-facing release notes describing actual features, fixes, compatibility, migration needs, and known limitations in clear commercial language. Do not fabricate benefits, benchmarks, testimonials, certifications, or availability. Update the current version/support record without deleting historical facts.

Store new Markdown, decisions, maps, reports, and sanitized QA evidence under **webtinousQA/** at the codebase root. Maintain its README index. Use documentation/, decisions/, maps/, reports/, evidence/, and assets/ only as needed. Tool-required root files, source tests, build scripts, manifests, and distribution-channel files remain in required locations and are linked from the index. Avoid competing copies and real secrets.

Create a release record such as `webtinousQA/reports/releases/<version>/README.md` containing scope, source identity, accepted version decision, readiness disposition, actual commands/checks, evidence links, artifacts, hashes, target support, migration/recovery instructions, and remaining limitations. A release-record template is not evidence until populated with observations.

## 7. Build the actual production candidate

Inspect and use the accepted production build/packaging commands and supported configuration. Do not substitute a development server, debug-only bundle, sample project, empty package, or outdated artifact. Confirm actual target OS/architecture/runtime and production settings. Use appropriate dependency/lockfile resolution and record relevant toolchain versions.

Keep artifacts traceable to the candidate source and configuration. Use signing, notarization, provenance, or channel-specific verification when required by the actual platform, distribution channel, or accepted policy. Use authorized existing credentials; do not create accounts, purchase certificates, change subscriptions, expose keys, or invent a signature. Missing required signing capability is a concrete release blocker, not permission to label an unsigned package as signed.

Build the promised packages. Record actual filenames, formats, sizes, target architecture, version/build identity, and cryptographic checksums. Inspect archive contents and prevent accidental inclusion of credentials, private authentication state, customer data, unnecessary raw diagnostics, caches, or irrelevant work. Ship dependencies/runtime resources actually needed by the chosen format, rather than excluding them through a universal rule.

## 8. Verify the packaged product

Test the **actual final package**, not only source or an intermediate build. Verify clean installation or supported first use, launch, version identity, essential resources, core workflows, permissions, and production configuration. For applicable updates, verify upgrade from a supported previous version with representative existing data/settings, migration results, interruption/recovery, and uninstall behavior where relevant.

For websites/services, verify the actual production build and deployment-compatible behavior, routing/404, environment boundaries, and relevant readiness checks in an authorized isolated or preview environment. For libraries, test package installation/import and supported public contracts. For device firmware, distinguish emulator/build evidence from required physical update/boot/recovery evidence.

Record supported targets actually checked. Cross-compilation alone does not prove installation or runtime behavior on the target platform. If hardware, operating systems, services, or signing access are missing, provide the useful completed candidate and a precise remaining action; do not claim those targets passed.

If a meaningful change follows verification, rebuild and repeat affected checks against the new candidate. Preserve the association between final filenames/hashes and the evidence. Do not label an old tested artifact as the new build.

## 9. Release disposition and handoff

Finish a reviewable package containing the agreed artifacts, release notes, relevant installation/upgrade/recovery guidance, checksums, and the release report. Preserve Webtinous by Continous Group attribution and required third-party notices.

Use an honest status: **Ready for the agreed release action**, **Candidate with stated limitations**, or **Blocked**. Show material failed, unexecuted, or unverified gates. A version bump alone is not a completed release; a package alone is not proof of publication, installation, or deployment.

Building/preparing the package is authorized by invoking this playbook. Publishing to stores/registries, deploying, creating remote releases/tags, pushing changes, sending announcements, spending money, or changing production data requires the appropriate scope of existing user authorization. Continue already authorized actions without repeated permission questions; resolve only genuinely missing decisions before dependent final actions.

When GitHub is part of the accepted workflow, reconcile the tag convention, exact target revision, previous release, draft/prerelease/stable state, release notes, artifact identities, and checksums under MD.MD. Prepare reviewable release material before any authorized remote action. Verify and record actual remote publication separately from local preparation.

The final response should give the accepted old → new version and release class, actual artifact links and hashes (or their manifest), checks performed, readiness status, and material limitations. State whether publication/deployment occurred or remains pending only according to observed actions. Do not claim an installer, signature, successful upgrade, certification, or release exists unless it actually does.

## Final release checklist

- **Version:** Release class/target accepted once; authoritative app/package/build identities agree.
- **Readiness:** Required functional, security, reliability, accessibility, branding, and compatibility gates have actual results.
- **Documentation:** Affected Markdown, maps, changelog, known issues, support/version records, and upgrade/recovery instructions match the release.
- **Package:** Correct production artifacts exist with identifiable targets and checksums; required signing/channel conditions are satisfied or explicitly blocked.
- **Runtime:** Actual installation/first use and relevant supported upgrade paths were checked within the stated environment limits.
- **Handoff:** webtinousQA release record and evidence are indexed, credits/notices are accurate, and unfinished final actions remain visible.

---

**Webtinous · by Continous Group** — Project Standards · v6.0.0
