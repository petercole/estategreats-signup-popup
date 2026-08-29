import { describe, expect, it } from 'vitest'

import { SMS_DISCLOSURE_COPY, SMS_DISCLOSURE_VERSION, smsConsentError } from '../src/consent'

describe('sms consent', () => {
  it('keeps the disclosure copy and version in lockstep with what shipped', () => {
    // If you change the copy you MUST bump the version — the stored version is
    // the audit trail for what a person agreed to.
    expect(SMS_DISCLOSURE_VERSION).toBe('sale-alert-v1')
    expect(SMS_DISCLOSURE_COPY).toContain('Reply STOP to opt out')
    expect(SMS_DISCLOSURE_COPY).toContain('Message and data rates may apply')
    expect(SMS_DISCLOSURE_COPY).toContain('Consent is not a condition of purchase')
  })

  it('accepts the two legitimate states', () => {
    expect(smsConsentError({ phone: '', smsConsent: false })).toBeUndefined()
    expect(smsConsentError({ phone: '615-555-0134', smsConsent: true })).toBeUndefined()
  })

  it('refuses a phone number we were not given permission to text', () => {
    expect(smsConsentError({ phone: '6155550134', smsConsent: false })).toMatch(/permission box/)
  })

  it('refuses consent with nothing to text', () => {
    expect(smsConsentError({ phone: '', smsConsent: true })).toMatch(/enter the mobile number/)
  })

  // Ported verbatim from the website's validator, which tests the RAW string
  // for emptiness — so whitespace falls through to the digit check. The form
  // trims before calling, so a visitor never sees this path; the test pins the
  // behavior so the package and the server routes stay byte-identical.
  it('matches the server validator on a whitespace-only number', () => {
    expect(smsConsentError({ phone: '   ', smsConsent: true })).toMatch(/valid mobile number/)
  })

  it('refuses a number that cannot be a real mobile', () => {
    expect(smsConsentError({ phone: '12345', smsConsent: true })).toMatch(/valid mobile number/)
    expect(smsConsentError({ phone: '1'.repeat(16), smsConsent: true })).toMatch(/valid mobile/)
  })
})
