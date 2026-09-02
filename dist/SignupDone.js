'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const SENDER_ADDRESS = 'info@estategreats.net';
export function signupOutcome(message) {
    if (/already/i.test(message))
        return 'already-subscribed';
    if (/confirm|inbox/i.test(message))
        return 'confirm-email';
    return 'received';
}
export function signupDoneHeading(outcome) {
    if (outcome === 'already-subscribed')
        return 'You’re already on the list';
    if (outcome === 'confirm-email')
        return 'Almost done!';
    return 'You’re on the list!';
}
export function signupNextSteps(outcome, submission) {
    const steps = [];
    if (outcome === 'confirm-email') {
        steps.push(submission?.email
            ? `Open the email we just sent to ${submission.email} and tap the confirm link. Alerts start as soon as you do.`
            : 'Open the email we just sent you and tap the confirm link. Alerts start as soon as you do.');
    }
    if (submission?.smsConsent) {
        steps.push(submission.phone
            ? `Watch for a welcome text at ${submission.phone}. Reply STOP any time to opt out.`
            : 'Watch for a welcome text. Reply STOP any time to opt out.');
    }
    steps.push(`Add ${SENDER_ADDRESS} to your contacts so sale alerts never land in spam.`);
    if (outcome === 'already-subscribed' && !submission?.smsConsent) {
        steps.push('Nothing else to do. New sales reach you the moment they are announced.');
    }
    return steps;
}
export function SignupDone({ classPrefix, doneLabel = 'Done', message, onDone, showHeading = true, submission, }) {
    const outcome = signupOutcome(message);
    const steps = signupNextSteps(outcome, submission);
    return (_jsxs("div", { "aria-live": "polite", className: `${classPrefix}__done`, "data-outcome": outcome, "data-eg-form-status": "", "data-state": "success", role: "status", children: [_jsx("span", { "aria-hidden": "true", className: `${classPrefix}__done-mark`, children: _jsx("svg", { fill: "none", height: "28", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2.4", viewBox: "0 0 24 24", width: "28", children: _jsx("path", { d: "M20 6 9 17l-5-5" }) }) }), showHeading ? _jsx("p", { className: `${classPrefix}__done-heading`, children: signupDoneHeading(outcome) }) : null, _jsx("p", { className: `${classPrefix}__done-lead`, children: message }), _jsx("ol", { className: `${classPrefix}__done-steps`, children: steps.map((step) => (_jsx("li", { children: step }, step))) }), onDone ? (_jsx("button", { className: `${classPrefix}__done-button`, onClick: onDone, type: "button", children: doneLabel })) : null] }));
}
