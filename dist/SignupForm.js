'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The signup form itself.
 *
 * Markup is ported field-for-field from estate-greats-website
 * `src/components/SaleAlertSignup/Form.tsx`, including the honeypot, the
 * `startedAt` timestamp both servers use to reject instant bot submissions,
 * and the class names the shared stylesheet targets. `next/link` became a
 * plain anchor so the package stays framework-neutral React and the offers
 * subdomain can link to the policy on the main site.
 *
 * Submission moved INTO the component. On estategreats.net it used to be
 * handled by a site-wide DOM enhancer (`exact-theme/Enhancements.tsx`) that
 * hunted for `form[data-eg-form]`; that enhancer cannot follow the form into a
 * package, and a popup that owns its own loading/success/error states is the
 * point of this exercise. The site's other forms keep the enhancer — the
 * package form deliberately does NOT carry `data-eg-form`, so the enhancer
 * ignores it and there is no double-submit.
 *
 * The response contract matches the existing `/forms/submit` route:
 *   { success: boolean, message?: string, eventId?: string, redirectTo?: string }
 */
import { useId, useRef, useState } from 'react';
import { SMS_DISCLOSURE_COPY, SMS_DISCLOSURE_VERSION, SMS_TERMS_URL, smsConsentError } from './consent.js';
export function SignupForm({ audienceFields, buttonLabel = 'Send me sale alerts', formAction, onAnalyticsEvent, onSuccess, privacyUrl = SMS_TERMS_URL, source, sourcePath, }) {
    const idPrefix = useId();
    const privacyID = `${idPrefix}-privacy`;
    const smsDisclosureID = `${idPrefix}-sms-disclosure`;
    const formRef = useRef(null);
    // Set once, on mount, and refreshed after a successful send. Both servers
    // read it to reject submissions that arrive impossibly fast.
    const startedAtRef = useRef(String(Date.now()));
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');
    async function onSubmit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const smsConsent = formData.get('smsConsent') === 'yes';
        const phone = String(formData.get('phone') || '').trim();
        const consentError = smsConsentError({ phone, smsConsent });
        if (consentError) {
            setStatus('error');
            setMessage(consentError);
            onAnalyticsEvent?.({ name: 'signup_popup_submit_error', reason: 'sms_consent', source });
            form.querySelector(`[name="${smsConsent ? 'phone' : 'smsConsent'}"]`)?.focus();
            return;
        }
        onAnalyticsEvent?.({ name: 'signup_popup_submit_attempt', source });
        setStatus('submitting');
        setMessage('Sending…');
        try {
            const response = await fetch(formAction, {
                body: formData,
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
                method: 'POST',
            });
            const result = (await response.json().catch(() => null));
            if (!response.ok || !result?.success) {
                throw new Error(result?.message || 'We could not send this form. Please try again.');
            }
            onAnalyticsEvent?.({
                name: 'signup_popup_signup',
                eventId: result.eventId,
                smsConsent,
                source,
            });
            if (result.redirectTo) {
                window.location.assign(result.redirectTo);
                return;
            }
            form.reset();
            startedAtRef.current = String(Date.now());
            setStatus('success');
            setMessage(result.message || 'Thank you. Your message was received.');
            onSuccess?.();
        }
        catch (error) {
            const text = error instanceof Error ? error.message : 'We could not send this form. Please try again.';
            onAnalyticsEvent?.({ name: 'signup_popup_submit_error', reason: 'submission_failed', source });
            setStatus('error');
            setMessage(text);
        }
    }
    const submitting = status === 'submitting';
    return (_jsxs("form", { action: formAction, className: "sale-alert-signup-form", method: "post", onSubmit: onSubmit, ref: formRef, children: [_jsx("input", { name: "formType", type: "hidden", value: "sale-alert", readOnly: true }), _jsx("input", { name: "source", type: "hidden", value: source, readOnly: true }), _jsx("input", { name: "sourcePath", type: "hidden", value: sourcePath, readOnly: true }), _jsx("input", { name: "smsDisclosureVersion", type: "hidden", value: SMS_DISCLOSURE_VERSION, readOnly: true }), _jsx("input", { defaultValue: startedAtRef.current, name: "startedAt", type: "hidden" }), Object.entries(audienceFields ?? {}).map(([name, value]) => (_jsx("input", { name: name, type: "hidden", value: value, readOnly: true }, name))), _jsxs("div", { "aria-hidden": "true", className: "sale-alert-signup-form__honeypot", children: [_jsx("label", { htmlFor: `${idPrefix}-website`, children: "Website" }), _jsx("input", { autoComplete: "off", id: `${idPrefix}-website`, name: "website", tabIndex: -1, type: "text" })] }), _jsxs("label", { className: "sale-alert-signup-form__field", htmlFor: `${idPrefix}-first-name`, children: [_jsx("span", { children: "First name" }), _jsx("input", { autoComplete: "given-name", "data-sale-alert-modal-field": "", disabled: submitting, id: `${idPrefix}-first-name`, name: "firstName", required: true, type: "text" })] }), _jsxs("label", { className: "sale-alert-signup-form__field", htmlFor: `${idPrefix}-email`, children: [_jsx("span", { children: "Email address" }), _jsx("input", { "aria-describedby": privacyID, autoComplete: "email", disabled: submitting, id: `${idPrefix}-email`, name: "email", required: true, type: "email" })] }), _jsxs("label", { className: "sale-alert-signup-form__field", htmlFor: `${idPrefix}-phone`, children: [_jsxs("span", { children: ["Mobile phone ", _jsx("small", { children: "(optional)" })] }), _jsx("input", { "aria-describedby": smsDisclosureID, autoComplete: "tel", disabled: submitting, id: `${idPrefix}-phone`, inputMode: "tel", name: "phone", type: "tel" })] }), _jsxs("label", { className: "sale-alert-signup-form__sms-consent", children: [_jsx("input", { "aria-describedby": smsDisclosureID, disabled: submitting, name: "smsConsent", type: "checkbox", value: "yes" }), _jsxs("span", { id: smsDisclosureID, children: [SMS_DISCLOSURE_COPY, " ", _jsx("a", { href: privacyUrl, children: "Privacy & SMS terms" }), "."] })] }), _jsx("button", { className: "sale-alert-signup-form__submit", disabled: submitting, type: "submit", children: buttonLabel }), _jsx("p", { "aria-live": "polite", className: "sale-alert-signup-form__status", "data-eg-form-status": "", "data-state": status === 'success' ? 'success' : status === 'error' ? 'error' : '', children: message }), _jsx("p", { className: "sale-alert-signup-form__privacy", id: privacyID, children: "Useful sale news only. Unsubscribe anytime." })] }));
}
