# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

District "Super Admin" staff at Edison360, a K-12 education platform. Single role — every user
sees all ten sections, no persona gating. Home is typically the first screen opened each morning,
on a desktop/laptop browser, for a quick scan of district status before moving into deeper work
(reporting, triage, configuration).

## Product Purpose

A unified admin console that consolidates district operations otherwise scattered across Salesforce
reports, the Genesis SIS, Google Classroom, and Calendar into one place. It exists so a Super Admin
can see enrollment, staffing, attendance, goals, and cross-system problems without checking four
separate systems, and can triage what needs attention today.

## Positioning

Salesforce is the unified source of truth: Genesis, Classroom, and Calendar remain the real upstream
feeds, but Admin reads everything through Salesforce reports rather than integrating each system
independently. Every figure traces to a named report with its own last-refreshed stamp, so a lagging
report reads as stale rather than being silently presented as current.

## Operating Context

- Morning check-in ritual on desktop; needs to orient fast, not reward long reading.
- All ten sections: Home, Needs Attention, Reporting & Analytics, Student & Faculty 360, Portal
  Configuration, Academic Goals, Alerts & Notifications, Resources & Content, System Settings,
  Integrations.
- Needs Attention is the one cross-system triage queue: at-risk students, overdue alerts, sync
  failures, and pending configuration, worst-first.
- Student & Faculty 360 profiles are read-only except internal notes/flags — do not widen this
  without asking.

## Capabilities and Constraints

- **Nothing is live yet.** No Salesforce connection, no Genesis/Classroom/Calendar client, no Admin
  DB, no auth. All data is mocked in `src/lib/data/*` and nothing persists across a refresh.
- **Several blocking product questions are open** (tracked in `OPEN-ITEMS.md`): the real Salesforce
  API pattern, whether refresh is on-demand or display-only, at-risk threshold rules, the 360
  editable-field list, and real academic term dates. Placeholder logic is explicitly labeled as
  invented on-screen (e.g. the Needs Attention callout) — that honesty must survive a redesign.
- Status/severity colors are a fixed three-way scale app-wide; a color must keep meaning the same
  thing on every screen.

## Brand Commitments

Product name: **Edison360 Admin**. The existing theme (`src/styles/theme.css`) is a deliberate,
documented choice: a light theme keeping Salesforce Lightning Analytics card anatomy, with a
restrained purplish-blue accent reserved for CTAs, links, active nav, and focus — chosen "on
request" per `OPEN-ITEMS.md`. This is incumbent evidence, not yet re-confirmed with the user for
this redesign; the decision to preserve or replace it belongs to the redesign's visual-direction
step, not here.

## Evidence on Hand

- `README.md` and `OPEN-ITEMS.md` are the authoritative, current product/scope record.
- Full section list, IA, and mock data modules exist in-repo (`src/lib/data/*`).
- No real screenshots, testimonials, customer names, or Salesforce org access exist. Do not
  fabricate any.

## Product Principles

1. Salesforce is the single source of truth — every number traces to a named report with its own
   freshness stamp.
2. Data honesty over polish — mock/placeholder logic is disclosed on-screen, not hidden behind
   confident-looking numbers.
3. Single role, no gating — design for one Super Admin persona, not a permission matrix.
4. Morning-scan first — Home must orient a desktop user fast, first thing in the day.
5. Read-mostly, triage-actionable — most of the product is reporting; Needs Attention is the one
   surface built for action.

## Accessibility & Inclusion

No project-specific requirement beyond standard web accessibility (WCAG AA) has been established.
