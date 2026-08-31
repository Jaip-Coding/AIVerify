# AIVerify EU — AI Act Readiness MVP

A runnable first version of an evidence-based EU AI Act readiness website. It deliberately **does not** claim to certify legal compliance.

## What is included

- Professional responsive landing page
- Server-side public webpage scanner
- SSRF protection: localhost/private-network targets are blocked
- Public HTML evidence detection for chat/interactive technology, AI disclosure-like text and AI-generated-content labels
- Explicit scanner limitations so “not detected” is never presented as “does not exist”
- Company confirmation questionnaire for facts a website cannot know
- Deterministic rules engine — no LLM makes the legal/readiness decision
- Article 50-focused findings with status, confidence, rule basis and attached evidence
- Versioned ruleset (`2026.08.31-v1`)
- Assessment coverage and readiness indicator (not a legal probability)
- Downloadable JSON audit record
- Print / Save-as-PDF report view
- Official EU primary-source links
- No external packages required

## Run it

Requires Node.js 20+.

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## Test it

```bash
npm test
```

## Important MVP limitations

This first version scans **one fetched public HTML page**. It does not run a headless browser, click chat widgets, crawl an entire domain, inspect authenticated areas, verify machine-readable provenance marks, or inspect internal company systems.

That is intentional: when the product cannot verify something, it reports `REQUIRES CONFIRMATION` rather than inventing certainty.

## Recommended next production upgrades

1. Headless-browser scanner (Playwright) with safe scripted interactions and screenshots.
2. Domain crawler with robots/rate-limit controls and per-page evidence capture.
3. Screenshot + DOM evidence snapshots hashed and timestamped for auditability.
4. Separate provider/deployer decision tree and broader AI Act module coverage.
5. Expert-reviewed rule authoring workflow with tests for every rule change.
6. Accounts, organizations, recurring scans, AI-system inventory and audit history.
7. Human-review queue for ambiguous/high-impact findings.
8. Professional legal review of methodology, terms, disclaimers and rule logic before commercial reliance.

## Legal / product positioning

Use language such as “readiness assessment”, “potential gap”, “not verified” and “requires confirmation”. Avoid marketing the output as a definitive legal opinion, legal certification, or guarantee of compliance.

## Primary sources used for this MVP

- Regulation (EU) 2024/1689, Article 50: https://eur-lex.europa.eu/eli/reg/2024/1689/oj
- European Commission, Guidelines on transparency obligations (20 July 2026): https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems
- European Commission, Article 50 transparency overview: https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-transparency-obligations

This prototype is not legal advice.
