/**
 * What every signup surface shows once the server has accepted the form.
 *
 * The fields disappear and the whole space becomes the next steps: confirm
 * the email if the list needs that, watch for the welcome text if the shopper
 * opted in, and whitelist the sender. A status line under a still-visible
 * form read as "did that work?"; this reads as "done, here is what happens
 * now." Shared by the popup, the /sale-alerts page form, and the inline
 * footer form so the copy cannot drift between surfaces.
 */
import type { SignupSubmission } from './useSignupSubmit.js';
export declare const SENDER_ADDRESS = "info@estategreats.net";
export type SignupDoneProps = {
    /** The server's success message; drives the heading and the first step. */
    message: string;
    submission: SignupSubmission | null;
    /** Class prefix of the host: `sale-alert-signup-form` or `eg-signup-inline`. */
    classPrefix: string;
    /** Renders the heading inside the panel. Hosts that keep their own heading
     *  above the panel pass false. */
    showHeading?: boolean;
    /** Optional closing action, used by the popup. */
    onDone?: () => void;
    doneLabel?: string;
};
export type SignupOutcome = 'confirm-email' | 'already-subscribed' | 'received';
export declare function signupOutcome(message: string): SignupOutcome;
export declare function signupDoneHeading(outcome: SignupOutcome): string;
export declare function signupNextSteps(outcome: SignupOutcome, submission: SignupSubmission | null): string[];
export declare function SignupDone({ classPrefix, doneLabel, message, onDone, showHeading, submission, }: SignupDoneProps): import("react").JSX.Element;
