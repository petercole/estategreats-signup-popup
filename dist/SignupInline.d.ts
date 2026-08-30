import type { SignupPopupAnalyticsHandler } from './analytics.js';
export type SignupInlineProps = {
    formAction: string;
    source: string;
    sourcePath: string;
    audienceFields?: Record<string, string>;
    privacyUrl?: string;
    buttonLabel?: string;
    /** Small heading above the fields. Omit for just the form. */
    heading?: string;
    /** Line under the heading. */
    intro?: string;
    /** Note under the form. */
    footnote?: string;
    onAnalyticsEvent?: SignupPopupAnalyticsHandler;
    onSuccess?: () => void;
    className?: string;
};
export declare function SignupInline({ audienceFields, buttonLabel, className, footnote, formAction, heading, intro, onAnalyticsEvent, onSuccess, privacyUrl, source, sourcePath, }: SignupInlineProps): import("react").JSX.Element;
