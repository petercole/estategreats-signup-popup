import type { SignupPopupAnalyticsHandler } from './analytics.js';
export type SignupStatus = 'idle' | 'submitting' | 'success' | 'error';
/** What the shopper submitted, captured before the form resets, so the
 *  success panel can name the inbox and phone it is talking about. */
export type SignupSubmission = {
    email: string;
    phone: string;
    smsConsent: boolean;
};
type Options = {
    formAction: string;
    source: string;
    onAnalyticsEvent?: SignupPopupAnalyticsHandler;
    onSuccess?: () => void;
};
export declare function useSignupSubmit({ formAction, onAnalyticsEvent, onSuccess, source }: Options): {
    message: string;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
    startedAt: string;
    status: SignupStatus;
    submission: SignupSubmission | null;
};
export {};
