/**
 * Analytics hooks.
 *
 * The package never talks to an analytics vendor — estategreats.net runs GA4 +
 * Meta CAPI through its own tracking module, the offers site runs a
 * consent-gated GA4 wrapper, and neither should be linked into a shared UI
 * package. We emit named events and let each site decide what, if anything,
 * to do with them.
 */
export type SignupPopupAnalyticsEvent = {
    name: 'signup_popup_shown';
    trigger: string;
    source: string;
} | {
    name: 'signup_popup_dismissed';
    source: string;
} | {
    name: 'signup_popup_submit_attempt';
    source: string;
} | {
    name: 'signup_popup_submit_error';
    reason: string;
    source: string;
} | {
    name: 'signup_popup_signup';
    source: string;
    smsConsent: boolean;
    /** Server-supplied dedupe id, when the site's route returns one. */
    eventId?: string;
};
export type SignupPopupAnalyticsHandler = (event: SignupPopupAnalyticsEvent) => void;
