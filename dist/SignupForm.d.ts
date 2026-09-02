import type { SignupPopupAnalyticsHandler } from './analytics.js';
import { type SignupStatus } from './useSignupSubmit.js';
export type SignupFormStatus = SignupStatus;
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
    /** Called after a successful signup, so the popup can record permanent
     *  suppression and swap its own heading for the next steps. */
    onSuccess?: () => void;
    /** Renders a closing button on the success panel (the popup passes its
     *  close handler); inline surfaces leave it out. */
    onDone?: () => void;
    doneLabel?: string;
};
export declare function SignupForm({ audienceFields, buttonLabel, doneLabel, formAction, onAnalyticsEvent, onDone, onSuccess, privacyUrl, source, sourcePath, }: SignupFormProps): import("react").JSX.Element;
