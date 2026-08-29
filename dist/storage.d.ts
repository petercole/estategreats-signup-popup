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
    dismissedAt: number | null;
    /** True once the visitor successfully signed up. Permanent. */
    signedUp: boolean;
};
/**
 * Once per session, however the visitor got here.
 *
 * The in-component "already fired" ref only survives as long as the component
 * does, so a reload or a fresh tab re-armed the timer and someone reading three
 * pages could be interrupted three times. This is the memory that outlives a
 * reload but not the browser session — the popup asks once, then leaves you
 * alone until you come back another day.
 */
export declare function wasShownThisSession(namespace: string): boolean;
export declare function markShownThisSession(namespace: string): void;
export declare function readSuppression(namespace: string): SuppressionState;
export declare function recordDismissal(namespace: string, now?: number): void;
export declare function recordSignup(namespace: string, now?: number): void;
/** True when suppression says we must stay quiet right now. */
export declare function isSuppressed(state: SuppressionState, dismissDays: number, now?: number): boolean;
