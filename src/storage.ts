/**
 * Durable, per-site suppression state.
 *
 * Two states worth remembering about a visitor:
 *   - they dismissed the popup  → leave them alone for `dismissDays`
 *   - they signed up            → never show it again
 *
 * Storage is first-party localStorage under a namespace the consuming site
 * chooses. estategreats.net and offers.estategreats.net are different origins,
 * so their localStorage is already separate — the namespace exists so the two
 * can never collide if the sites are ever served from one origin, and so a
 * future audience split ("offers" vs "sale alerts") doesn't inherit the wrong
 * suppression.
 *
 * Every read and write is wrapped: Safari private mode and "block all cookies"
 * make localStorage *throw* on access, and a popup is never worth breaking a
 * page over. When storage is unavailable we behave as if nothing was stored,
 * which errs toward showing the popup rather than silently never showing it.
 */

export type SuppressionState = {
  /** Epoch ms of the last dismissal, or null. */
  dismissedAt: number | null
  /** True once the visitor successfully signed up. Permanent. */
  signedUp: boolean
}

const EMPTY: SuppressionState = { dismissedAt: null, signedUp: false }

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    const probe = window.localStorage
    // Touch it — merely reading `window.localStorage` does not throw in every
    // browser that has it disabled, but using it does.
    const key = '__eg_signup_probe__'
    probe.setItem(key, '1')
    probe.removeItem(key)
    return probe
  } catch {
    return null
  }
}

export function readSuppression(namespace: string): SuppressionState {
  const store = storage()
  if (!store) return EMPTY
  try {
    const raw = store.getItem(namespace)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<SuppressionState>
    return {
      dismissedAt:
        typeof parsed.dismissedAt === 'number' && Number.isFinite(parsed.dismissedAt)
          ? parsed.dismissedAt
          : null,
      signedUp: parsed.signedUp === true,
    }
  } catch {
    // Corrupt or foreign value in our key — treat it as nothing stored.
    return EMPTY
  }
}

function write(namespace: string, state: SuppressionState): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(namespace, JSON.stringify(state))
  } catch {
    // Quota or disabled storage. The popup just won't be suppressed.
  }
}

export function recordDismissal(namespace: string, now = Date.now()): void {
  write(namespace, { ...readSuppression(namespace), dismissedAt: now })
}

export function recordSignup(namespace: string, now = Date.now()): void {
  write(namespace, { dismissedAt: now, signedUp: true })
}

/** True when suppression says we must stay quiet right now. */
export function isSuppressed(
  state: SuppressionState,
  dismissDays: number,
  now = Date.now(),
): boolean {
  if (state.signedUp) return true
  if (state.dismissedAt === null) return false
  const elapsedDays = (now - state.dismissedAt) / 86_400_000
  // A clock that moved backwards (timezone change, manual set) would otherwise
  // produce a negative elapsed time and unsuppress early. Treat it as recent.
  if (elapsedDays < 0) return true
  return elapsedDays < dismissDays
}
