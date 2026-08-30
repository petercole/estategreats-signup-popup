'use client'

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

import { useId, useRef, useState } from 'react'

import type { SignupPopupAnalyticsHandler } from './analytics.js'
import { SMS_DISCLOSURE_COPY, SMS_DISCLOSURE_VERSION, SMS_TERMS_URL, smsConsentError } from './consent.js'

export type SignupFormStatus = 'idle' | 'submitting' | 'success' | 'error'

export type SignupFormProps = {
  /** Where the form POSTs. Each site supplies its own server route. */
  formAction: string
  /** Hidden fields the receiving route needs — form type, audience ids,
   *  merge-tag mapping, anything site-specific. Values are rendered as hidden
   *  inputs, so never put a secret here. */
  audienceFields?: Record<string, string>
  /** Identifies the surface in analytics and in the stored submission. */
  source: string
  /** Path the signup came from, recorded with the submission. */
  sourcePath: string
  /** Overrides the "Privacy & SMS terms" link target. */
  privacyUrl?: string
  /** Overrides the submit button label. */
  buttonLabel?: string
  onAnalyticsEvent?: SignupPopupAnalyticsHandler
  /** Called after a successful signup, so the popup can close and record
   *  permanent suppression. */
  onSuccess?: () => void
}

export function SignupForm({
  audienceFields,
  buttonLabel = 'Send me sale alerts',
  formAction,
  onAnalyticsEvent,
  onSuccess,
  privacyUrl = SMS_TERMS_URL,
  source,
  sourcePath,
}: SignupFormProps) {
  const idPrefix = useId()
  const privacyID = `${idPrefix}-privacy`
  const smsDisclosureID = `${idPrefix}-sms-disclosure`
  const formRef = useRef<HTMLFormElement>(null)
  // Set once, on mount, and refreshed after a successful send. Both servers
  // read it to reject submissions that arrive impossibly fast.
  const startedAtRef = useRef<string>(String(Date.now()))
  const [status, setStatus] = useState<SignupFormStatus>('idle')
  const [message, setMessage] = useState('')

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const smsConsent = formData.get('smsConsent') === 'yes'
    const phone = String(formData.get('phone') || '').trim()

    const consentError = smsConsentError({ phone, smsConsent })
    if (consentError) {
      setStatus('error')
      setMessage(consentError)
      onAnalyticsEvent?.({ name: 'signup_popup_submit_error', reason: 'sms_consent', source })
      form.querySelector<HTMLElement>(`[name="${smsConsent ? 'phone' : 'smsConsent'}"]`)?.focus()
      return
    }

    onAnalyticsEvent?.({ name: 'signup_popup_submit_attempt', source })
    setStatus('submitting')
    setMessage('Sending…')

    try {
      const response = await fetch(formAction, {
        body: formData,
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        method: 'POST',
      })
      const result = (await response.json().catch(() => null)) as {
        eventId?: string
        message?: string
        redirectTo?: string
        success?: boolean
      } | null

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'We could not send this form. Please try again.')
      }

      onAnalyticsEvent?.({
        name: 'signup_popup_signup',
        eventId: result.eventId,
        smsConsent,
        source,
      })

      if (result.redirectTo) {
        window.location.assign(result.redirectTo)
        return
      }

      form.reset()
      startedAtRef.current = String(Date.now())
      setStatus('success')
      setMessage(result.message || 'Thank you. Your message was received.')
      onSuccess?.()
    } catch (error) {
      const text =
        error instanceof Error ? error.message : 'We could not send this form. Please try again.'
      onAnalyticsEvent?.({ name: 'signup_popup_submit_error', reason: 'submission_failed', source })
      setStatus('error')
      setMessage(text)
    }
  }

  const submitting = status === 'submitting'

  return (
    <form
      action={formAction}
      className="sale-alert-signup-form"
      method="post"
      onSubmit={onSubmit}
      ref={formRef}
    >
      <input name="formType" type="hidden" value="sale-alert" readOnly />
      <input name="source" type="hidden" value={source} readOnly />
      <input name="sourcePath" type="hidden" value={sourcePath} readOnly />
      <input name="smsDisclosureVersion" type="hidden" value={SMS_DISCLOSURE_VERSION} readOnly />
      <input defaultValue={startedAtRef.current} name="startedAt" type="hidden" />
      {Object.entries(audienceFields ?? {}).map(([name, value]) => (
        <input key={name} name={name} type="hidden" value={value} readOnly />
      ))}
      <div aria-hidden="true" className="sale-alert-signup-form__honeypot">
        <label htmlFor={`${idPrefix}-website`}>Website</label>
        <input
          autoComplete="off"
          id={`${idPrefix}-website`}
          name="website"
          tabIndex={-1}
          type="text"
        />
      </div>

      <label className="sale-alert-signup-form__field" htmlFor={`${idPrefix}-first-name`}>
        <span>First name</span>
        <input
          autoComplete="given-name"
          data-sale-alert-modal-field=""
          disabled={submitting}
          id={`${idPrefix}-first-name`}
          name="firstName"
          required
          type="text"
        />
      </label>

      <label className="sale-alert-signup-form__field" htmlFor={`${idPrefix}-email`}>
        <span>Email address</span>
        <input
          aria-describedby={privacyID}
          autoComplete="email"
          disabled={submitting}
          id={`${idPrefix}-email`}
          name="email"
          required
          type="email"
        />
      </label>

      <label className="sale-alert-signup-form__field" htmlFor={`${idPrefix}-phone`}>
        <span>Mobile phone</span>
        <input
          aria-describedby={smsDisclosureID}
          autoComplete="tel"
          disabled={submitting}
          id={`${idPrefix}-phone`}
          inputMode="tel"
          name="phone"
          required
          type="tel"
        />
      </label>

      <label className="sale-alert-signup-form__sms-consent">
        <input
          aria-describedby={smsDisclosureID}
          disabled={submitting}
          name="smsConsent"
          required
          type="checkbox"
          value="yes"
        />
        <span id={smsDisclosureID}>
          {SMS_DISCLOSURE_COPY} <a href={privacyUrl}>Privacy &amp; SMS terms</a>.
        </span>
      </label>

      <button className="sale-alert-signup-form__submit" disabled={submitting} type="submit">
        {buttonLabel}
      </button>
      <p
        aria-live="polite"
        className="sale-alert-signup-form__status"
        data-eg-form-status=""
        data-state={status === 'success' ? 'success' : status === 'error' ? 'error' : ''}
      >
        {message}
      </p>
      <p className="sale-alert-signup-form__privacy" id={privacyID}>
        Useful sale news only. Unsubscribe anytime.
      </p>
    </form>
  )
}
