import { beforeEach, describe, expect, it, vi } from 'vitest'

import { isSuppressed, readSuppression, recordDismissal, recordSignup } from '../src/storage'

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
