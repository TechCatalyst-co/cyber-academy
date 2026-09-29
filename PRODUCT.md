# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **TechCatalyst program staff (provider admins):** run the security awareness program for many small and medium business clients at once. They add clients, watch compliance and phishing results across the portfolio, and act inside any client's workspace.
- **Client administrators and managers:** an office manager, IT lead or practice manager at a 10–500 person company. They enroll staff, chase overdue training, record phishing results and pull evidence for insurers and auditors. Managers see only their own department.
- **Employees (learners):** non-technical staff completing a 10–15 minute module each month, a refresher every six months, and a quiz, usually between other work and sometimes on a phone.

## Product Purpose

Cyber Academy is TechCatalyst's multi-tenant security awareness LMS. It delivers a 12-month curriculum (12 monthly modules, six-month refreshers, a new-starter course, six role tracks), tracks compliance per employee and per company, records phishing simulation outcomes, and produces evidence packs. Success is fewer phishing clicks, more reports, near-complete on-time training, and evidence a client can hand an insurer.

## Positioning

A managed program, not a content library: every client runs the same calendar from its own start date, and TechCatalyst sees every client's compliance and phishing trend on one overview.

## Operating Context

- Provider staff work at a desk across many client workspaces in a session.
- Client admins check the dashboard monthly and before insurance renewals or audits; they export CSVs and print evidence packs.
- Learners open the app from a reminder, finish one short course, and leave.
- Phishing emails are sent from a separate simulation tool; outcomes are entered or imported here.

## Capabilities and Constraints

- Roles: provider admin, company admin, manager (department-scoped), employee.
- Plans: Essentials, Professional (adds role tracks), Premium.
- Compliance states: Compliant, At risk (due within 7 days), Non-compliant (overdue); assignments can be excused.
- Human-risk score 0–100 with a published formula.
- Stack: Node 22 built-in HTTP server with MongoDB Atlas as the database (official driver; SQLite only as a local development fallback), plain ES-module client with no build step; a single-file browser demo is built with esbuild.
- Not built yet: email reminders, SSO, direct phishing-platform integration.

## Brand Commitments

- Product name: **Cyber Academy**, a TechCatalyst product. TechCatalyst is the only brand shown to every user; client company names appear as context, not as co-brands (confirmed).
- TechCatalyst Brand Style Guide v1.0 (Sept 2026) is binding: tagline "Secure Software. Built Right."; colors Royal #1F4487 (logo, headlines, buttons, links, brand fields), White #FFFFFF (primary background), Mist #93A7CB (tints, dividers, cards, chart fills; never body text), Ink #101821 (body copy and dark-mode backgrounds); balance roughly White 50 / Royal 30 / Mist / Ink. Accessible pairings: White on Royal, White on Ink, Ink on Mist, Royal on White; Mist on Royal only for large text; never White on Mist.
- Brand typeface is an unnamed wide grotesque; use the closest free match (confirmed). Guide shows H1 at 64/700 and small tracked mono labels.
- Logo: stacked "tc" brand mark plus "TechCatalyst" wordmark; mark alone for avatars, favicons and tight squares; clear space equal to the mark's stem width. The user will supply the official logo as PNG; until then the artwork is taken from the style guide itself.

## Evidence on Hand

- Style guide PDF (uploaded by the user).
- All client companies, people and results in the demo are fictional seed data. No real customers, testimonials or benchmarks exist; none may be invented.

## Product Principles

1. The task comes first: every screen answers "who is behind, and what do I do about it" before anything else.
2. Status is never color alone: every state carries a label and icon.
3. Evidence is a product feature: anything shown on a dashboard can be exported or printed.
4. Learners should finish a module in one sitting on any device.

## Accessibility & Inclusion

WCAG 2.1 AA for all text and controls; the style guide's accessible pairings are the color floor.
