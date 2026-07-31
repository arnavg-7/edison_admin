# Edison360 Admin

Super Admin portal for Edison 360, built to **Build Brief v2**. Next.js (App Router) + TypeScript.

> **All data is mocked.** There is no Salesforce connection, no Genesis/Classroom/Calendar client,
> no Admin DB, and nothing persists across a refresh. Read [OPEN-ITEMS.md](OPEN-ITEMS.md) before
> trusting any number on screen — several behaviours are deliberately stubbed pending answers.

## Development

```bash
npm install
npm run dev
```

## Architecture

**Single role.** Every user is a Super Admin and sees all ten sections. v1's three-persona gating
was removed entirely rather than left inert.

**Salesforce is the unified source.** Genesis, Classroom and Calendar remain upstream feeds, but
Admin reads reports through Salesforce. `src/lib/data/salesforce.ts` is the report registry: each
report carries its own last-refresh time, so a lagging report shows a stale stamp rather than
presenting old numbers as current. The API pattern is still unconfirmed — that module is the only
place it needs to change.

**Theme.** `src/styles/theme.css` is the token layer — a **light** theme that keeps the Salesforce
Lightning Analytics card anatomy and layout, applied app-wide (nav, forms, tables, buttons, not just
charts). Colour is deliberately restrained: a purplish blue (`--sf-accent`) carries CTAs, links,
active nav and focus, and the chart series carry data. Surfaces stay neutral so the accent reads as
"act here". Status colours are a fixed three-way scale, so a colour means the same thing on every
chart.

**Content comes from Edison's docs, not the reference screenshots.** The Salesforce Lightning
screenshots were a *style* reference — card anatomy, layout, chart shapes. They are not a content
source. Anything they showed that Edison's own briefs and inventory don't cover has been removed:
**events** (Total Events Held, Event Participants, an events tab on the 360) and **well-being**
(Well-Being Trend, the well-being at-risk rule). Neither appears in the scope docs and neither has a
known source system. Re-adding either is a scope decision, not a gap to backfill.

The 360 sections mirror what Edison's Student and Faculty portals actually cover: for students —
grades and grade history, attendance and attendance history, goals (POAG), skills profile,
development areas, classes and schedule, alert history; for faculty — assignment summary, classes
and performance, attendance submission compliance, and student alerts they raised.

## Sections

| Section | Notes |
|---|---|
| Home | Curated card grid plus the Needs Attention count |
| Needs Attention | Cross-system triage: at-risk, overdue alerts, sync failures, pending config |
| Reporting & Analytics | 12-metric catalog, drill-down reports, custom builder |
| Student & Faculty 360 | Individual profiles — read-only except internal notes and flags |
| Portal Configuration | Development areas, skills profile, faculty dashboard (HS/KG only) |
| Academic Goals | Templates, categories, progress tracking |
| Alerts & Notifications | Alert rules, notification templates |
| Resources & Content | External-link CRUD |
| System Settings | Grade levels, subjects, calendar, announcements, users, audit log |
| Integrations | Salesforce API health plus the Genesis / Classroom / Calendar feeds |

## Structure

```
src/
  app/                  one route per section, tabs for sub-screens
  components/sf/        metric card + chart primitives (bar, stacked, donut, funnel, stat)
  components/shell/     sidebar, context bar, nav icons
  components/shared/    filter bars, tabs, list editor, empty states, status badges
  components/people/    360 profile shell
  lib/nav.ts            the ten sections
  lib/data/             mock data, one module per domain
```

## Deployment

Configured for Netlify via `netlify.toml` (Next.js runtime plugin). The live site is a **v1** build
until this is redeployed.
