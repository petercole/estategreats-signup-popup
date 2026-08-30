/**
 * SMS consent copy, version, and validation.
 *
 * This is the one place the disclosure text and its validation live.
 * estategreats.net's server route (`/forms/submit`) and the offers site's
 * route both import from here, so the string a visitor agrees to, the string
 * we record against their submission, and the rule that decides whether the
 * pair is even valid can never drift apart. That matters: the stored version
 * is the audit trail for what someone actually consented to.
 *
 * Copy, version, and messages are ported VERBATIM from
 * estate-greats-website `src/forms/saleAlertSmsConsent.ts` +
 * `src/forms/websiteSubmissionValidation.ts`. Bump SMS_DISCLOSURE_VERSION
 * whenever SMS_DISCLOSURE_COPY changes.
 */
export declare const SMS_DISCLOSURE_VERSION = "sale-alert-v1";
export declare const SMS_DISCLOSURE_COPY = "Yes, text me about upcoming Estate Greats sales. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase.";
/**
 * Default target for the "Privacy & SMS terms" link. Absolute, because the
 * offers subdomain has no privacy page of its own and must link back to the
 * canonical policy. estategreats.net overrides this with its relative path so
 * its own link stays a same-site navigation.
 */
export declare const SMS_TERMS_URL = "https://estategreats.net/privacy#sms-alerts";
export type SmsConsentInput = {
    phone: string;
    smsConsent: boolean;
};
/**
 * Every sale-alert signup requires both a mobile number and affirmative SMS
 * consent. A number that cannot be a real mobile is also rejected.
 *
 * Returns an error message for display, or undefined when the pair is valid.
 */
export declare function smsConsentError({ phone, smsConsent }: SmsConsentInput): string | undefined;
