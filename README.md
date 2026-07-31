# Edison Admin

Admin portal for Edison360, sibling app to [edison_faculty](https://github.com/arnavg-7/edison_faculty). Built with Next.js (App Router) + TypeScript.

> **All data is mocked.** No Genesis, Classroom, Calendar, or Admin DB contract exists yet, and
> nothing persists across a refresh. See [OPEN-ITEMS.md](OPEN-ITEMS.md) before trusting any number
> on screen.

## Development

```bash
npm install
npm run dev
```

## Roles

Three personas from the build brief, gated by a single permission map in
`src/lib/role/roles.ts`. The sidebar, every section guard, and the permission matrix under
System Settings → User Management all read that one map.

| Persona | Sees |
|---|---|
| District & School Leadership | Home (district overview), Reporting & Analytics (read-only) |
| Portal/Program Administrator | Home, Portal Configuration, Academic Goals, Alerts, Resources, System Settings |
| IT/Systems Administrator | Home, System Settings, Integrations |

There is no authentication yet. The **role switcher in the sidebar footer** stands in for sign-in
and should be removed once SSO lands.

## Structure

```
src/
  app/                  route per section, tabs for sub-screens
  components/shared/    cross-cutting: metric tiles, filter bars, empty states, list editor
  components/shell/     sidebar, role switcher, section guard
  lib/role/             permission model
  lib/data/             mock data, one module per source
```

Every metric carries its own "Data as of" stamp rather than one page-wide timestamp — Genesis is
a daily file, Classroom is near-real-time, and the Admin DB updates on write, so a shared
timestamp would misreport at least two of the three.

## Deployment

Configured for Netlify via `netlify.toml` (Next.js runtime plugin).
