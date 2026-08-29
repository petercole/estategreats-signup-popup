# @petercole/signup-popup

> Scoped to `@petercole` because GitHub Packages requires the npm scope to match
> the repository owner, and Estate Greats has no GitHub org. If an
> `estategreats` org is ever created, renaming the package is a major version
> plus a dependency bump in both sites.

The Estate Greats sale-alert signup popup. One implementation, two sites:

| Site | Repo | Mounts it in |
| --- | --- | --- |
| estategreats.net | `petercole/estate-greats-website` | `src/components/ActiveSaleBanner/Client.tsx` |
| offers.estategreats.net | `petercole/eg-staff-portal` | `app/offers/layout.tsx` |

The package owns everything a visitor sees or feels: markup, styling, the navy
dialog with its teal gradient wash, typography and spacing, field layout, the
SMS disclosure and its consent rules, the rounded gold CTA and its states, the
overlay and close control, entrance and exit animation, responsive behavior,
focus trap and focus restoration, Escape handling, scroll locking,
reduced-motion behavior, popup scheduling and suppression, validation, loading,
success and error presentation, and the analytics event hooks.

Each site supplies only what legitimately differs.

## Using it

```tsx
import { SignupPopup } from '@petercole/signup-popup'
import '@petercole/signup-popup/styles.css'

<SignupPopup
  formAction="/api/offers/sale-alerts"
  audienceFields={{ audienceId: 'c75733484a' }}
  source="offers-site"
  sourcePath={pathname}
  privacyUrl="https://estategreats.net/privacy#sms-alerts"
  storageNamespace="estate-greats-offers-signup"
  schedule
  onAnalyticsEvent={trackSignupEvent}
/>
```

`schedule` is the only switch that changes *when* the popup appears:

- **omitted** — purely controlled by `open`. This is how estategreats.net has
  always driven it (a banner button), and why adopting the package changed
  nothing there.
- **`true`** — the shared defaults below.
- **an object** — the defaults with individual rules overridden.

### Shared display defaults

| Rule | Default |
| --- | --- |
| Desktop: show after | 30s **or** 50% scroll |
| Mobile: show after | 45s **or** 60% scroll |
| Desktop exit intent | only after 15s |
| Embedded signup on screen | never show |
| Checkout / cart / payment / account / login / admin | never show |
| Already shown in this browser session | never show again this session |
| After a dismissal | quiet for 14 days |
| After a signup | quiet permanently |

Three separate memories, on purpose:

- **shown this session** — `sessionStorage`, dies with the tab. Stops a reload
  or a click through to a second page from asking the same person twice.
- **dismissed** — `localStorage`, 14 days. They said no.
- **signed up** — `localStorage`, permanent. They said yes; never ask again.

A site opening the popup itself (`open`) bypasses all three — a visitor who just
clicked "get sale alerts" must always get the form.

Closing is immediate through both the close button and Escape; the fade is
decoration and never delays the close.

### Suppression storage

First-party `localStorage` under the `storageNamespace` you pass. The two sites
use `estate-greats-signup` and `estate-greats-offers-signup`, so their state can
never collide. Every read and write is wrapped — Safari private mode throws on
`localStorage` access, and a popup is not worth breaking a page over.

Suppression is deliberately **not** shared across `estategreats.net` and
`offers.estategreats.net`. Sharing it would need a `.estategreats.net`
domain-scoped cookie, which is a cross-subdomain tracking decision, not a
technical one. Bring it up before implementing it.

## Submission

The package never talks to Mailchimp. It POSTs a `FormData` to whatever
`formAction` you give it and expects JSON back:

```ts
{ success: boolean, message?: string, eventId?: string, redirectTo?: string }
```

Both sites keep Mailchimp on the server, so nothing about the audience beyond
its public embed ids ever reaches the browser. Never put a secret in
`audienceFields` — those render as hidden inputs.

Fields sent: `formType`, `source`, `sourcePath`, `smsDisclosureVersion`,
`startedAt`, `website` (honeypot), `firstName`, `email`, `phone`, `smsConsent`,
plus anything in `audienceFields`.

## Fonts

Styling asks for `--font-classic-body` and falls back to Montserrat, then Arial.
A site that wants a byte-identical render must load Montserrat.

## Why `dist/` is committed

Both sites install this from a pinned git tag, and a git dependency normally
builds itself on install via `prepare`. That build is at the mercy of each
package manager's script-trust policy — bun blocks postinstall scripts by
default and pnpm refuses the install outright unless the package is added to
`allowBuilds`. Shipping the built output in the tag removes that whole class of
failure: npm, bun, pnpm and yarn all get a package that is ready to import,
with no install-time build at all. There is deliberately no `prepare` script.

So `npm run build` before every release, and commit `dist/`.

## Releasing

1. Make the change, add a test, `npm test`.
2. **`npm run build` and commit `dist/`.**
3. Bump the version in `package.json` (semver: fixes patch, new props minor,
   changed markup or removed props major — both sites render the same markup, so
   a markup change is a visible change on two production sites).
4. `git tag vX.Y.Z && git push --tags`.
5. Bump the pinned tag in both site repos and deploy each.

Both sites pin an exact version. Never point either at a branch, a tag that can
move, or an unversioned remote script: a bad publish would otherwise change two
production sites at once with no rollback.
