/**
 * SMS consent copy, version, and validation.
 *
 * This is the one place the disclosure text and its validation live.
 * estategreats.net's server route (`/forms/submit`) and the offers site's
 * route both import from here, so the string a visitor agrees to, the string
 * we record against their submission, and the rule that decides whether the
 * pair is even valid can never drift apart. That matters: the stored version
 * is the audit trail for what someone actually consented to.
 *
 * Copy, version, and messages are ported VERBATIM from
 * estate-greats-website `src/forms/saleAlertSmsConsent.ts` +
 * `src/forms/websiteSubmissionValidation.ts`. Bump SMS_DISCLOSURE_VERSION
 * whenever SMS_DISCLOSURE_COPY changes.
 */

export const SMS_DISCLOSURE_VERSION = 'sale-alert-v1'

export const SMS_DISCLOSURE_COPY =
  'Yes, text me about upcoming Estate Greats sales. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase.'

/**
 * Default target for the "Privacy & SMS terms" link. Absolute, because the
 * offers subdomain has no privacy page of its own and must link back to the
 * canonical policy. estategreats.net overrides this with its relative path so
 * its own link stays a same-site navigation.
 */
export const SMS_TERMS_URL = 'https://estategreats.net/privacy#sms-alerts'

export type SmsConsentInput = {
  phone: string
  smsConsent: boolean
}

/**
 * The states that are never allowed:
 *   - a phone number with no consent (we may not text it)
 *   - consent with no phone number (nothing to text)
 *   - consent with a number that cannot be a real mobile
 *
 * Returns an error message for display, or undefined when the pair is valid.
 */
export function smsConsentError({ phone, smsConsent }: SmsConsentInput): string | undefined {
  if (phone && !smsConsent) {
    return 'Please check the text-alert permission box, or remove your mobile number.'
  }
  if (smsConsent && !phone) {
    return 'Please enter the mobile number where you want to receive text alerts.'
  }

  const digits = phone.replace(/\D/g, '')
  if (smsConsent && (digits.length < 10 || digits.length > 15)) {
    return 'Please enter a valid mobile number for text alerts.'
  }

  return undefined
}
