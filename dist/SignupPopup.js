'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The signup popup: overlay, dialog, focus trap, scroll lock, and (optionally)
 * the rules that decide when it shows itself.
 *
 * Ported from estate-greats-website `src/components/SaleAlertSignup/Modal.tsx`.
 * The focus trap, Escape handling, scroll lock, focus restoration, portal, and
 * every class name are unchanged, so estategreats.net renders exactly what it
 * rendered before. What is new:
 *
 *   - `schedule`: when provided, the popup opens itself on time / scroll /
 *     exit intent and remembers dismissals. When omitted, the popup is purely
 *     controlled by `open` — which is how estategreats.net's banner button has
 *     always driven it, so that site's behavior does not change.
 *   - entrance/exit animation, with `prefers-reduced-motion` respected in CSS.
 *
 * Closing is immediate in every path: the overlay stops accepting pointer
 * events the instant a close is requested and the state flips before the
 * animation runs.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { SignupForm } from './SignupForm.js';
import { DEFAULT_SCHEDULE, useSignupPopupSchedule, } from './schedule.js';
import { isSuppressed, markShownThisSession, readSuppression, recordDismissal, recordSignup, wasShownThisSession, } from './storage.js';
const CLOSE_ANIMATION_MS = 160;
const subscribeToClient = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;
function resolveSchedule(schedule) {
    if (!schedule)
        return null;
    if (schedule === true)
        return DEFAULT_SCHEDULE;
    return { ...DEFAULT_SCHEDULE, ...schedule };
}
export function SignupPopup({ audienceFields, buttonLabel, className, eyebrow = 'Estate Greats Sale Alerts', footerLink, formAction, heading = 'Be First Through the Door', intro = 'Get an email when a new Nashville-area estate sale goes live.', onAnalyticsEvent, onClose, open: controlledOpen, privacyUrl, schedule, source, sourcePath, storageNamespace, style, }) {
    const modalRef = useRef(null);
    const [autoOpen, setAutoOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const closeTimerRef = useRef(null);
    const canUsePortal = useSyncExternalStore(subscribeToClient, getClientSnapshot, getServerSnapshot);
    const resolvedSchedule = resolveSchedule(schedule);
    const open = (controlledOpen ?? false) || autoOpen;
    // Suppression is read on the client only — reading storage during render
    // would desync hydration. Two separate reasons to stay quiet:
    //   suppressed — dismissed recently, or signed up (survives the session)
    //   shownThisSession — already asked once in this tab (dies with it)
    const [suppressed, setSuppressed] = useState(true);
    useEffect(() => {
        if (!resolvedSchedule)
            return;
        setSuppressed(isSuppressed(readSuppression(storageNamespace), resolvedSchedule.dismissDays) ||
            wasShownThisSession(storageNamespace));
    }, [resolvedSchedule, storageNamespace]);
    const requestClose = useCallback((reason) => {
        if (reason === 'dismissed' && resolvedSchedule)
            recordDismissal(storageNamespace);
        if (reason === 'dismissed')
            onAnalyticsEvent?.({ name: 'signup_popup_dismissed', source });
        // Stop the schedule for the rest of this page's life. `suppressed` is
        // only read from storage on mount, so without this the scroll and timer
        // listeners re-arm the moment the popup closes and the visitor gets it
        // again on their next scroll. Asking once and taking no for an answer is
        // the entire point of the suppression rules.
        setSuppressed(true);
        setClosing(true);
        setAutoOpen(false);
        onClose?.();
        if (closeTimerRef.current !== null)
            window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = window.setTimeout(() => {
            setClosing(false);
            closeTimerRef.current = null;
        }, CLOSE_ANIMATION_MS);
    }, [onAnalyticsEvent, onClose, resolvedSchedule, source, storageNamespace]);
    useEffect(() => () => {
        if (closeTimerRef.current !== null)
            window.clearTimeout(closeTimerRef.current);
    }, []);
    const onScheduleTrigger = useCallback((trigger) => {
        // Mark BEFORE opening: if the visitor reloads the page while the popup is
        // on screen, they have already been asked and should not be asked again.
        markShownThisSession(storageNamespace);
        // And stop the schedule immediately, so nothing can queue a second open.
        setSuppressed(true);
        setAutoOpen(true);
        onAnalyticsEvent?.({ name: 'signup_popup_shown', source, trigger });
    }, [onAnalyticsEvent, source, storageNamespace]);
    useSignupPopupSchedule({
        enabled: Boolean(resolvedSchedule) && !suppressed && !open,
        onTrigger: onScheduleTrigger,
        pathname: sourcePath,
        schedule: resolvedSchedule ?? DEFAULT_SCHEDULE,
    });
    const onSignupSuccess = useCallback(() => {
        recordSignup(storageNamespace);
        setSuppressed(true);
    }, [storageNamespace]);
    useEffect(() => {
        if (!open)
            return;
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        modalRef.current?.querySelector('[data-sale-alert-modal-field]')?.focus();
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                requestClose('dismissed');
                return;
            }
            if (event.key !== 'Tab')
                return;
            const focusable = Array.from(modalRef.current?.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])') || []).filter((element) => !element.hidden);
            if (focusable.length === 0)
                return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            }
            else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.documentElement.style.overflow = previousOverflow;
            previousFocus?.focus();
        };
    }, [open, requestClose]);
    const visible = open || closing;
    const modal = (_jsx("div", { className: className ? `sale-alert-signup-modal ${className}` : 'sale-alert-signup-modal', style: style, "data-state": closing ? 'closing' : open ? 'open' : undefined, hidden: !visible, onMouseDown: (event) => {
            if (event.target === event.currentTarget)
                requestClose('dismissed');
        }, ref: modalRef, children: _jsxs("section", { "aria-labelledby": "sale-alert-signup-modal-title", "aria-modal": "true", className: "sale-alert-signup-modal__dialog", id: "sale-alert-signup-modal", role: "dialog", children: [_jsx("button", { "aria-label": "Close sale alerts signup", className: "sale-alert-signup-modal__close", onClick: () => requestClose('dismissed'), type: "button", children: _jsx("span", { "aria-hidden": "true", children: "\u00D7" }) }), _jsx("p", { className: "sale-alert-signup-modal__eyebrow", children: eyebrow }), _jsx("h2", { id: "sale-alert-signup-modal-title", children: heading }), _jsx("p", { className: "sale-alert-signup-modal__intro", children: intro }), _jsx(SignupForm, { audienceFields: audienceFields, buttonLabel: buttonLabel, formAction: formAction, onAnalyticsEvent: onAnalyticsEvent, onSuccess: onSignupSuccess, privacyUrl: privacyUrl, source: source, sourcePath: sourcePath }), footerLink ? (_jsx("a", { className: "sale-alert-signup-modal__page-link", href: footerLink.href, onClick: () => requestClose('dismissed'), children: footerLink.label })) : null] }) }));
    return canUsePortal ? createPortal(modal, document.body) : null;
}
