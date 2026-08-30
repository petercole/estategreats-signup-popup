'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * The inline sale-alert signup — the one on the estategreats.net homepage.
 *
 * Email and mobile side by side with icons in the fields, a full-width rounded
 * outline button, and the SMS consent tick underneath, all sitting on the navy
 * → teal gradient. Ported from that page's `.eg-home-sale-alert__*` rules,
 * which on the main site are produced by rewriting legacy WordPress markup and
 * are therefore impossible to reuse directly — this is the same design as a
 * real component, so the offers site can render it too.
 *
 * Deliberately NO first-name field: the homepage form does not ask for one, and
 * the point of this component is that the two sites look the same.
 *
 * Submission is shared with the popup (useSignupSubmit), so validation, the
 * consent rules, and the success/error copy cannot drift between them.
 */
import { useId } from 'react';
import { SMS_DISCLOSURE_COPY, SMS_DISCLOSURE_VERSION, SMS_TERMS_URL } from './consent.js';
import { useSignupSubmit } from './useSignupSubmit.js';
const MailIcon = () => (_jsxs("svg", { "aria-hidden": "true", className: "eg-signup-inline__icon", fill: "none", height: "16", viewBox: "0 0 24 24", width: "16", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("path", { d: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2" }), _jsx("path", { d: "m22 6-10 7L2 6", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2" })] }));
const PhoneIcon = () => (_jsx("svg", { "aria-hidden": "true", className: "eg-signup-inline__icon", fill: "none", height: "16", viewBox: "0 0 24 24", width: "16", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2" }) }));
export function SignupInline({ audienceFields, buttonLabel = 'Get sale alerts', className, footnote = 'Email and text choices are separate. Unsubscribe anytime.', formAction, heading, intro, onAnalyticsEvent, onSuccess, privacyUrl = SMS_TERMS_URL, source, sourcePath, }) {
    const idPrefix = useId();
    const disclosureID = `${idPrefix}-sms`;
    const footnoteID = `${idPrefix}-footnote`;
    const { message, onSubmit, startedAt, status } = useSignupSubmit({
        formAction,
        onAnalyticsEvent,
        onSuccess,
        source,
    });
    const submitting = status === 'submitting';
    return (_jsxs("div", { className: className ? `eg-signup-inline ${className}` : 'eg-signup-inline', children: [heading ? _jsx("p", { className: "eg-signup-inline__heading", children: heading }) : null, intro ? _jsx("p", { className: "eg-signup-inline__intro", children: intro }) : null, _jsxs("form", { className: "eg-signup-inline__form", method: "post", onSubmit: onSubmit, children: [_jsx("input", { name: "formType", type: "hidden", value: "sale-alert", readOnly: true }), _jsx("input", { name: "source", type: "hidden", value: source, readOnly: true }), _jsx("input", { name: "sourcePath", type: "hidden", value: sourcePath, readOnly: true }), _jsx("input", { name: "smsDisclosureVersion", type: "hidden", value: SMS_DISCLOSURE_VERSION, readOnly: true }), _jsx("input", { defaultValue: startedAt, name: "startedAt", type: "hidden" }), Object.entries(audienceFields ?? {}).map(([name, value]) => (_jsx("input", { name: name, type: "hidden", value: value, readOnly: true }, name))), _jsxs("div", { "aria-hidden": "true", className: "eg-signup-inline__honeypot", children: [_jsx("label", { htmlFor: `${idPrefix}-website`, children: "Website" }), _jsx("input", { autoComplete: "off", id: `${idPrefix}-website`, name: "website", tabIndex: -1, type: "text" })] }), _jsxs("div", { className: "eg-signup-inline__field", children: [_jsx(MailIcon, {}), _jsx("input", { "aria-describedby": footnoteID, "aria-label": "Email address", autoComplete: "email", className: "eg-signup-inline__input", disabled: submitting, name: "email", placeholder: "Your email address", required: true, type: "email" })] }), _jsxs("div", { className: "eg-signup-inline__field", children: [_jsx(PhoneIcon, {}), _jsx("input", { "aria-describedby": disclosureID, "aria-label": "Mobile phone", autoComplete: "tel", className: "eg-signup-inline__input", disabled: submitting, inputMode: "tel", name: "phone", placeholder: "Mobile phone", required: true, type: "tel" })] }), _jsx("button", { className: "eg-signup-inline__button", disabled: submitting, type: "submit", children: submitting ? 'Sending…' : buttonLabel }), _jsxs("label", { className: "eg-signup-inline__consent", children: [_jsx("input", { "aria-describedby": disclosureID, disabled: submitting, name: "smsConsent", required: true, type: "checkbox", value: "yes" }), _jsxs("span", { id: disclosureID, children: [SMS_DISCLOSURE_COPY, " ", _jsx("a", { href: privacyUrl, children: "Privacy & SMS terms" }), "."] })] }), _jsx("p", { "aria-live": "polite", className: "eg-signup-inline__status", "data-state": status === 'success' ? 'success' : status === 'error' ? 'error' : '', children: message }), _jsx("p", { className: "eg-signup-inline__footnote", id: footnoteID, children: footnote })] })] }));
}
