/**
 * Analytics hooks.
 *
 * The package never talks to an analytics vendor — estategreats.net runs GA4 +
 * Meta CAPI through its own tracking module, the offers site runs a
 * consent-gated GA4 wrapper, and neither should be linked into a shared UI
 * package. We emit named events and let each site decide what, if anything,
 * to do with them.
 */
export {};
