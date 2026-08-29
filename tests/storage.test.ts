import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  isSuppressed,
  markShownThisSession,
  readSuppression,
  recordDismissal,
  recordSignup,
  wasShownThisSession,
} from '../src/storage'

const NS = 'estate-greats-test-signup'
const DAY = 86_400_000

describe('suppression storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('shows the popup to someone with no history', () => {
    expect(isSuppressed(readSuppression(NS), 14)).toBe(false)
  })

  it('stays quiet for 14 days after a dismissal, then speaks again', () => {
    const now = Date.UTC(2026, 7, 29)
    recordDismissal(NS, now)
    const state = readSuppression(NS)
    expect(isSuppressed(state, 14, now + 13 * DAY)).toBe(true)
    expect(isSuppressed(state, 14, now + 14 * DAY + 1)).toBe(false)
  })

  it('never asks again after a successful signup', () => {
    const now = Date.UTC(2026, 7, 29)
    recordSignup(NS, now)
    const state = readSuppression(NS)
    expect(state.signedUp).toBe(true)
    expect(isSuppressed(state, 14, now + 400 * DAY)).toBe(true)
  })

  it('keeps each site namespaced', () => {
    recordSignup('estate-greats-signup', 1)
    expect(readSuppression('estate-greats-offers-signup').signedUp).toBe(false)
  })

  it('treats a backwards clock as recent, not as permission to reappear', () => {
    const now = Date.UTC(2026, 7, 29)
    recordDismissal(NS, now)
    expect(isSuppressed(readSuppression(NS), 14, now - 5 * DAY)).toBe(true)
  })

  it('survives corrupt stored values', () => {
    window.localStorage.setItem(NS, 'not json')
    expect(readSuppression(NS)).toEqual({ dismissedAt: null, signedUp: false })
  })

  it('never throws when storage is blocked', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError: storage disabled')
    })
    expect(() => recordDismissal(NS)).not.toThrow()
    expect(readSuppression(NS)).toEqual({ dismissedAt: null, signedUp: false })
    spy.mockRestore()
  })
})

describe('once per session', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('remembers within the session that the visitor was already asked', () => {
    expect(wasShownThisSession(NS)).toBe(false)
    markShownThisSession(NS)
    expect(wasShownThisSession(NS)).toBe(true)
  })

  it('keeps each site separate here too', () => {
    markShownThisSession('estate-greats-signup')
    expect(wasShownThisSession('estate-greats-offers-signup')).toBe(false)
  })

  it('does not leak into the durable suppression', () => {
    // "Already asked in this tab" must not read as "dismissed" — otherwise
    // closing the tab and coming back tomorrow would still be suppressed for
    // 14 days without the visitor ever having said no.
    markShownThisSession(NS)
    expect(readSuppression(NS)).toEqual({ dismissedAt: null, signedUp: false })
  })

  it('forgets when the session storage is cleared, as a new session would', () => {
    markShownThisSession(NS)
    window.sessionStorage.clear()
    expect(wasShownThisSession(NS)).toBe(false)
  })

  it('never throws when session storage is blocked', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError: storage disabled')
    })
    expect(() => markShownThisSession(NS)).not.toThrow()
    expect(wasShownThisSession(NS)).toBe(false)
    spy.mockRestore()
  })
})
