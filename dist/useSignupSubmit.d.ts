import type { SignupPopupAnalyticsHandler } from './analytics.js';
export type SignupStatus = 'idle' | 'submitting' | 'success' | 'error';
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
};
export {};
