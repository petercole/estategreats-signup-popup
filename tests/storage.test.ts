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
    expect(isSuppressed(readSuppression(NS), 1)).toBe(false)
  })

  it('stays quiet for a day after a dismissal, then asks again', () => {
    // A day is long enough that closing it clears your path through the site,
    // short enough that someone back next weekend for a different sale sees it.
    const now = Date.UTC(2026, 7, 29)
    recordDismissal(NS, now)
    const state = readSuppression(NS)
    expect(isSuppressed(state, 1, now + 20 * 3_600_000)).toBe(true)
    expect(isSuppressed(state, 1, now + DAY + 1)).toBe(false)
  })

  it('never asks again after a successful signup', () => {
    // Signing up is the permanent answer — the one-day dismissal window must
    // not resurrect the popup for someone who is already on the list.
    const now = Date.UTC(2026, 7, 29)
    recordSignup(NS, now)
    const state = readSuppression(NS)
    expect(state.signedUp).toBe(true)
    expect(isSuppressed(state, 1, now + 400 * DAY)).toBe(true)
  })

  it('keeps each site namespaced', () => {
    recordSignup('estate-greats-signup', 1)
    expect(readSuppression('estate-greats-offers-signup').signedUp).toBe(false)
  })

  it('treats a backwards clock as recent, not as permission to reappear', () => {
    const now = Date.UTC(2026, 7, 29)
    recordDismissal(NS, now)
    expect(isSuppressed(readSuppression(NS), 1, now - 5 * DAY)).toBe(true)
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

describe('the answer a visitor gave', () => {
  beforeEach(() => window.localStorage.clear())

  it('a dismissal expires after a day; a signup never does', () => {
    const now = Date.UTC(2026, 7, 29)
    const week = 7 * DAY

    recordDismissal(NS, now)
    expect(isSuppressed(readSuppression(NS), 1, now + week)).toBe(false)

    window.localStorage.clear()
    recordSignup(NS, now)
    expect(isSuppressed(readSuppression(NS), 1, now + week)).toBe(true)
  })

  it('a signup after a dismissal makes it permanent', () => {
    const now = Date.UTC(2026, 7, 29)
    recordDismissal(NS, now)
    recordSignup(NS, now + 60_000)
    expect(isSuppressed(readSuppression(NS), 1, now + 365 * DAY)).toBe(true)
  })
})
