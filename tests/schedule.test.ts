import { describe, expect, it } from 'vitest'

import { DEFAULT_SCHEDULE, isBlockedPath } from '../src/schedule'

describe('display rules', () => {
  it('ships the agreed non-annoying defaults', () => {
    expect(DEFAULT_SCHEDULE.desktopDelaySeconds).toBe(30)
    expect(DEFAULT_SCHEDULE.desktopScrollFraction).toBe(0.5)
    expect(DEFAULT_SCHEDULE.mobileDelaySeconds).toBe(45)
    expect(DEFAULT_SCHEDULE.mobileScrollFraction).toBe(0.6)
    expect(DEFAULT_SCHEDULE.exitIntentAfterSeconds).toBe(15)
    expect(DEFAULT_SCHEDULE.dismissDays).toBe(1)
  })

  it('never interrupts a transaction or an account flow', () => {
    for (const path of ['/checkout', '/checkout/payment', '/cart', '/account/settings', '/login']) {
      expect(isBlockedPath(path, DEFAULT_SCHEDULE.blockedPathPrefixes)).toBe(true)
    }
  })

  it('does not block a page that merely starts with the same letters', () => {
    expect(isBlockedPath('/payments-explained', DEFAULT_SCHEDULE.blockedPathPrefixes)).toBe(false)
    expect(isBlockedPath('/accountants', DEFAULT_SCHEDULE.blockedPathPrefixes)).toBe(false)
  })

  it('leaves ordinary content pages alone', () => {
    for (const path of ['/', '/sales/nashville', '/about', '/offers/belle-meade']) {
      expect(isBlockedPath(path, DEFAULT_SCHEDULE.blockedPathPrefixes)).toBe(false)
    }
  })

  it('does not fight the dedicated signup page', () => {
    expect(isBlockedPath('/sale-alerts', DEFAULT_SCHEDULE.blockedPathPrefixes)).toBe(true)
  })
})
