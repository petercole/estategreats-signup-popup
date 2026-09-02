'use client'

/**
 * The submit half of a signup form, shared by every variant.
 *
 * Validation, the POST, and the four visible states (idle / submitting /
 * success / error) are identical whether the form is in a popup or sitting
 * inline on a page. Only the markup differs, so only the markup is duplicated.
 */

import { useCallback, useRef, useState } from 'react'

import type { SignupPopupAnalyticsHandler } from './analytics.js'
import { smsConsentError } from './consent.js'

export type SignupStatus = 'idle' | 'submitting' | 'success' | 'error'

/** What the shopper submitted, captured before the form resets, so the
 *  success panel can name the inbox and phone it is talking about. */
export type SignupSubmission = {
  email: string
  phone: string
  smsConsent: boolean
}

type Options = {
  formAction: string
  source: string
  onAnalyticsEvent?: SignupPopupAnalyticsHandler
  onSuccess?: () => void
}

export function useSignupSubmit({ formAction, onAnalyticsEvent, onSuccess, source }: Options) {
  // Set on mount and refreshed after a successful send. Both servers read it to
  // reject submissions that arrive impossibly fast.
  const startedAtRef = useRef<string>(String(Date.now()))
  const [status, setStatus] = useState<SignupStatus>('idle')
  const [message, setMessage] = useState('')
  const [submission, setSubmission] = useState<SignupSubmission | null>(null)

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const form = event.currentTarget
      const formData = new FormData(form)
      const smsConsent = formData.get('smsConsent') === 'yes'
      const phone = String(formData.get('phone') || '').trim()
      const email = String(formData.get('email') || '').trim()

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
        setSubmission({ email, phone, smsConsent })
        setStatus('success')
        setMessage(result.message || 'Thank you. Your message was received.')
        onSuccess?.()
      } catch (error) {
        const text =
          error instanceof Error ? error.message : 'We could not send this form. Please try again.'
        onAnalyticsEvent?.({
          name: 'signup_popup_submit_error',
          reason: 'submission_failed',
          source,
        })
        setStatus('error')
        setMessage(text)
      }
    },
    [formAction, onAnalyticsEvent, onSuccess, source],
  )

  return { message, onSubmit, startedAt: startedAtRef.current, status, submission }
}
