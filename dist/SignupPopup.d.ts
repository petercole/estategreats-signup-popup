import type { SignupPopupAnalyticsHandler } from './analytics.js';
import { type SignupFormProps } from './SignupForm.js';
import { type SignupPopupSchedule } from './schedule.js';
export type SignupPopupProps = Pick<SignupFormProps, 'audienceFields' | 'buttonLabel' | 'formAction' | 'privacyUrl' | 'source'> & {
    /** Current path. Used for blocked-page rules and recorded with the signup. */
    sourcePath: string;
    /** localStorage key for dismissal + signup suppression. Give each site its
     *  own so the two can never read each other's state. */
    storageNamespace: string;
    /**
     * Auto-show rules. Omit (or pass false) for a purely controlled popup —
     * that is how estategreats.net's banner button drives it. Pass `true` for
     * the shared defaults, or an object to override individual rules.
     */
    schedule?: boolean | Partial<SignupPopupSchedule>;
    /** Controlled open state. Works alongside `schedule`: either can open it. */
    open?: boolean;
    /** Called on every close, however it was triggered. */
    onClose?: () => void;
    onAnalyticsEvent?: SignupPopupAnalyticsHandler;
    /** Eyebrow / heading / intro copy. Defaults match estategreats.net. */
    eyebrow?: string;
    heading?: string;
    intro?: string;
    /** Optional link under the form, e.g. to a full signup page. */
    footerLink?: {
        href: string;
        label: string;
    };
    /**
     * Class name and inline style for the popup's ROOT element.
     *
     * The popup portals into document.body, so it sits outside whatever wrapper
     * the host site puts its font/theme variables on and inherits nothing from
     * it. A site that scopes its fonts to a subtree (a Next.js route group with
     * next/font variable classes, say) passes them here so the popup renders in
     * the site's own typeface instead of falling through to the app default.
     */
    className?: string;
    style?: React.CSSProperties;
};
export declare function SignupPopup({ audienceFields, buttonLabel, className, eyebrow, footerLink, formAction, heading, intro, onAnalyticsEvent, onClose, open: controlledOpen, privacyUrl, schedule, source, sourcePath, storageNamespace, style, }: SignupPopupProps): import("react").ReactPortal | null;
