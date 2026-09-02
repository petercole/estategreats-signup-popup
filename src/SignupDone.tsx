'use client'

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

import type { SignupSubmission } from './useSignupSubmit.js'

export const SENDER_ADDRESS = 'info@estategreats.net'

export type SignupDoneProps = {
  /** The server's success message; drives the heading and the first step. */
  message: string
  submission: SignupSubmission | null
  /** Class prefix of the host: `sale-alert-signup-form` or `eg-signup-inline`. */
  classPrefix: string
  /** Renders the heading inside the panel. Hosts that keep their own heading
   *  above the panel pass false. */
  showHeading?: boolean
  /** Optional closing action, used by the popup. */
  onDone?: () => void
  doneLabel?: string
}

export type SignupOutcome = 'confirm-email' | 'already-subscribed' | 'received'

export function signupOutcome(message: string): SignupOutcome {
  if (/already/i.test(message)) return 'already-subscribed'
  if (/confirm|inbox/i.test(message)) return 'confirm-email'
  return 'received'
}

export function signupDoneHeading(outcome: SignupOutcome): string {
  if (outcome === 'already-subscribed') return 'You’re already on the list'
  if (outcome === 'confirm-email') return 'Almost done!'
  return 'You’re on the list!'
}

export function signupNextSteps(outcome: SignupOutcome, submission: SignupSubmission | null): string[] {
  const steps: string[] = []
  if (outcome === 'confirm-email') {
    steps.push(
      submission?.email
        ? `Open the email we just sent to ${submission.email} and tap the confirm link. Alerts start as soon as you do.`
        : 'Open the email we just sent you and tap the confirm link. Alerts start as soon as you do.',
    )
  }
  if (submission?.smsConsent) {
    steps.push(
      submission.phone
        ? `Watch for a welcome text at ${submission.phone}. Reply STOP any time to opt out.`
        : 'Watch for a welcome text. Reply STOP any time to opt out.',
    )
  }
  steps.push(`Add ${SENDER_ADDRESS} to your contacts so sale alerts never land in spam.`)
  if (outcome === 'already-subscribed' && !submission?.smsConsent) {
    steps.push('Nothing else to do. New sales reach you the moment they are announced.')
  }
  return steps
}

export function SignupDone({
  classPrefix,
  doneLabel = 'Done',
  message,
  onDone,
  showHeading = true,
  submission,
}: SignupDoneProps) {
  const outcome = signupOutcome(message)
  const steps = signupNextSteps(outcome, submission)

  return (
    <div
      aria-live="polite"
      className={`${classPrefix}__done`}
      data-outcome={outcome}
      data-eg-form-status=""
      data-state="success"
      role="status"
    >
      <span aria-hidden="true" className={`${classPrefix}__done-mark`}>
        <svg fill="none" height="28" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width="28">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      {showHeading ? <p className={`${classPrefix}__done-heading`}>{signupDoneHeading(outcome)}</p> : null}
      <p className={`${classPrefix}__done-lead`}>{message}</p>
      <ol className={`${classPrefix}__done-steps`}>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {onDone ? (
        <button className={`${classPrefix}__done-button`} onClick={onDone} type="button">
          {doneLabel}
        </button>
      ) : null}
    </div>
  )
}
