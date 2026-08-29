import type { SignupPopupAnalyticsHandler } from './analytics.js';
export type SignupFormStatus = 'idle' | 'submitting' | 'success' | 'error';
export type SignupFormProps = {
    /** Where the form POSTs. Each site supplies its own server route. */
    formAction: string;
    /** Hidden fields the receiving route needs — form type, audience ids,
     *  merge-tag mapping, anything site-specific. Values are rendered as hidden
     *  inputs, so never put a secret here. */
    audienceFields?: Record<string, string>;
    /** Identifies the surface in analytics and in the stored submission. */
    source: string;
    /** Path the signup came from, recorded with the submission. */
    sourcePath: string;
    /** Overrides the "Privacy & SMS terms" link target. */
    privacyUrl?: string;
    /** Overrides the submit button label. */
    buttonLabel?: string;
    onAnalyticsEvent?: SignupPopupAnalyticsHandler;
    /** Called after a successful signup, so the popup can close and record
     *  permanent suppression. */
    onSuccess?: () => void;
};
export declare function SignupForm({ audienceFields, buttonLabel, formAction, onAnalyticsEvent, onSuccess, privacyUrl, source, sourcePath, }: SignupFormProps): import("react").JSX.Element;
