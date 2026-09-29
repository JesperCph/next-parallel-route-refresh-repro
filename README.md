# Next.js parallel-route refresh: flat vs grouped comparison

Two examples in one app demonstrate an unexpected document reload when refreshing
a retained background after a mutation and soft navigation. Pinned to
**Next.js 16.3.7**, **React 19.1.0**. No auth, database, external services or UI library.

## Run

Use Node.js 24 (verified locally with 24.14.0) and pnpm 11.15.1, pinned in
`package.json`. `pnpm-lock.yaml` is the dependency lockfile; use pnpm throughout.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://127.0.0.1:4199/home**. The header lets you start either example.
These two start links deliberately load a fresh document, resetting the experiment.
All Home/About navigation and dialog transitions *within* an example use Next's
client router. Development, builds and automated tests use Turbopack by default.

## The two examples

| Example | Home → About | Source location | Observed on unpatched Next |
| --- | --- | --- | --- |
| Flat control | `/home` → `/about` | `app/home`, `app/about` | Background and document survive refresh. |
| Grouped reproduction | `/grouped-home` → `/grouped-about` | Both inside `app/(site)/` | Refresh unexpectedly replaces the document and loses the background. |

Both use the **same page component, Edit/Result dialogs, Server Action and
navigation sequence**. The grouped pair has no group-specific layout or default.
There is one root layout. `grouped-` is part of each leaf's name, not an additional
URL segment. A prefix like `/flat/home` would add another shared route ancestor,
so the control deliberately stays flat.

This demonstrates that **adding a route group triggers the failure in this
controlled comparison**. It does not prove the bug can only affect route groups,
or that every application using a route group is affected.

## Reproduce manually

Run the following sequence for **each** example:

1. Click **Start flat example** or **Start grouped example** in the header.
2. Click **Edit Dialog** in the page's navigation.
3. Click **Mutate**. The dummy Server Action calls `revalidateTag('test-tag', 'max')`,
   then the client replaces the URL with the Result dialog.
4. Click **Close dialog** to return to that example's Home page.
5. Click **About Page** (soft navigation).
6. Click **Edit Dialog** again. About should still be visible behind the dialog.
7. Click **Router Refresh**, which calls only `router.refresh()`.

Expected in both: About stays visible and the **document time origin** displayed
in the header stays unchanged. The number is the browser's `performance.timeOrigin`.

Observed: flat behaves correctly; grouped performs a document navigation to
`/edit?closePath=%2Fgrouped-about`. The number changes and About disappears.
A missing background on a *deliberate* hard load of a dialog is expected; the
bug is that a router refresh unexpectedly causes that hard load.

For an additional control, skip step 5. **Both examples preserve Home** when the
background has not changed. The initial mutation matters: just opening a fresh
dialog and refreshing is not the same sequence.

Dialog URLs carry an allowlisted `closePath`, so Edit, Result and Back to Edit all
preserve the originating page. Opening from About closes to About, not Home.

## Automated checks

```sh
pnpm exec playwright install chromium
pnpm test:reproduce
```

By default Playwright starts its own server on port 4199, refuses to reuse an
existing one, and stops only the server it starts. To test an already-running,
unpatched server without restarting it:

```sh
REPRO_EXTERNAL_URL=http://127.0.0.1:4199 pnpm test:reproduce
```

| Command | Meaning |
| --- | --- |
| `pnpm test:reproduce` | Green means the flat case passes and the **grouped reload bug is reproduced**. |
| `pnpm test` | Asserts correct behavior for both. The grouped changed-background test is expected to fail unpatched. |

There are six tests: unchanged-background refresh, changed-background refresh,
and origin-aware Edit/Result closing for each example. Add `--repeat-each=3`
to repeat. `REPRO_TEST_PORT` selects another port when tests start their own server.
The scripts use POSIX environment-variable syntax.

Tests attach router snapshots and retain screenshots/traces on failure under
ignored `test-results/`. Pass/fail is based on document identity, visible
background and URL—not private Next internals. Do not run multiple framework
servers against the same build output; use a separate copy for comparisons.

## Route tree

```text
app/
  layout.jsx                        # single root: children + dialogs + example chooser
  page.tsx                          # / redirects to /home
  default.jsx                       # fallback for implicit children slot
  example-page.tsx                   # shared rendering and Next Links for all four pages
  examples.ts                       # page paths, dialog URLs and close-path allowlist
  actions.js                        # dummy revalidateTag action; no data writes
  dialog.tsx                        # shared client dialog behavior
  document-status.jsx               # displays document time origin
  home/page.jsx                     # flat control
  about/page.jsx
  (site)/                           # no layout.tsx or default.tsx here
    grouped-home/page.tsx            # grouped reproduction
    grouped-about/page.tsx
  @dialogs/
    default.jsx
    [...catchAll]/page.jsx           # clears active dialog on ordinary navigation
    edit/page.tsx                    # awaits closePath, mounts EditDialog
    edit/EditDialog.tsx              # thin wrapper around shared Dialog
    result/page.tsx
    result/ResultDialog.tsx
diagnostics/rebase-refresh-loader.cjs # optional experiment, disabled by default
tests/refresh.spec.js                # parameterized comparison
```

These are plain parallel routes, not intercepting routes. Both root slots have
defaults. `connection()` keeps pages request-bound without needing a backend.

## Diagnosis and optional experiment

After navigating to grouped About, inspect
`history.state.__PRIVATE_NEXTJS_INTERNALS_TREE.tree` in DevTools. The `(site)`
ancestor retains `/grouped-home` as its refresh URL even though its child is now
`grouped-about`. Opening Edit passes that stale URL down to the retained About
branch. Refresh requests the wrong background and reaches a hard-navigation
fallback. The flat case correctly records `/about` for its retained background.

The inspected `convertServerPatchToFullTreeImpl()` in Next's
`client/components/segment-cache/navigation.js` preserves the ancestor's old URL
when cloning refresh metadata. The relevant navigation and ppr-navigations modules
were identical in the inspected 16.3.5 and 16.3.7 installations.

For the narrow webpack-only experiment, stop the unpatched server first:

```sh
REPRO_REBASE_REFRESH_URL=1 pnpm exec next dev --webpack --hostname 127.0.0.1 --port 4199
```

To run the automated checks with this experiment (with no server already running):

```sh
REPRO_BUNDLER=webpack REPRO_REBASE_REFRESH_URL=1 pnpm test
```

Webpack is only used for this explicitly opted-in diagnostic experiment; there
are no webpack package scripts.

The loader rebases touched ancestor refresh markers to the response canonical URL
on the ordinary unknown-route patch-merging path. Untouched sibling branches
retain their own provenance. It modifies only this app's webpack compilation,
not installed dependencies. Baseline and patched output directories are separate;
source-shape guards fail if the expected framework code differs.

**This is diagnostic evidence, not a production-ready fix.** It does not establish
correctness across all callers, redirects, rewrites, independent slots, queries,
prefetching and history restoration. It does not patch Turbopack.
