export type SignupPopupSchedule = {
    /** Seconds on the page before a desktop visitor may see the popup. */
    desktopDelaySeconds: number;
    /** Fraction (0–1) of the page scrolled that may trigger it on desktop. */
    desktopScrollFraction: number;
    /** Seconds on the page before a mobile visitor may see the popup. */
    mobileDelaySeconds: number;
    /** Fraction (0–1) of the page scrolled that may trigger it on mobile. */
    mobileScrollFraction: number;
    /** Desktop only: pointer leaving the viewport top opens it, but never
     *  before this many seconds. Set to null to disable exit intent. */
    exitIntentAfterSeconds: number | null;
    /** Days to stay quiet after a dismissal. */
    dismissDays: number;
    /** CSS selector for an embedded signup form. While one is on screen the
     *  popup stays shut — the visitor already has the form in front of them. */
    embeddedSignupSelector: string | null;
    /** Path prefixes that must never be interrupted. Matched case-insensitively
     *  against the current pathname. */
    blockedPathPrefixes: string[];
};
export declare const DEFAULT_SCHEDULE: SignupPopupSchedule;
/** Why the popup opened. Passed straight through to analytics. */
export type SignupPopupTrigger = 'time' | 'scroll' | 'exit-intent' | 'manual';
export declare function isBlockedPath(pathname: string, prefixes: string[]): boolean;
/** Coarse mobile check. Pointer coarseness beats a user-agent sniff here: an
 *  iPad in desktop mode should still get the patient mobile timing. */
export declare function isMobileViewport(): boolean;
type UseScheduleOptions = {
    /** False when the popup must never auto-open (suppressed, already open,
     *  site opted out). All listeners stay unattached. */
    enabled: boolean;
    pathname: string;
    schedule: SignupPopupSchedule;
    onTrigger: (trigger: SignupPopupTrigger) => void;
};
/**
 * Watches time, scroll, and exit intent, and fires `onTrigger` at most once.
 * Everything unwinds on unmount — no stray timers, no listeners left behind on
 * a client-side route change.
 */
export declare function useSignupPopupSchedule({ enabled, onTrigger, pathname, schedule, }: UseScheduleOptions): void;
export {};
