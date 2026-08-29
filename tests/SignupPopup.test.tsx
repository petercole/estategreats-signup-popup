import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SignupPopup } from '../src/SignupPopup'
import { readSuppression } from '../src/storage'

const NS = 'estate-greats-test-popup'

function renderPopup(props: Partial<React.ComponentProps<typeof SignupPopup>> = {}) {
  return render(
    <SignupPopup
      formAction="/forms/submit/"
      source="test-site"
      sourcePath="/"
      storageNamespace={NS}
      {...props}
    />,
  )
}

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  } as Response
}

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  vi.useRealTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SignupPopup — controlled mode (how estategreats.net drives it)', () => {
  it('stays shut until the site opens it, and never auto-opens without a schedule', () => {
    vi.useFakeTimers()
    renderPopup()
    expect(screen.queryByRole('dialog', { hidden: true })?.closest('[hidden]')).toBeTruthy()
    act(() => {
      vi.advanceTimersByTime(120_000)
    })
    expect(document.querySelector('.sale-alert-signup-modal')?.hasAttribute('hidden')).toBe(true)
  })

  it('renders the exact fields and copy the live popup renders', () => {
    renderPopup({ open: true })
    expect(screen.getByLabelText(/first name/i)).toBeRequired()
    expect(screen.getByLabelText(/email address/i)).toBeRequired()
    expect(screen.getByLabelText(/mobile phone/i)).not.toBeRequired()
    const consent = screen.getByRole('checkbox')
    expect(consent).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Send me sale alerts' })).toBeVisible()
    expect(screen.getByRole('link', { name: /Privacy & SMS terms/i })).toBeVisible()
    expect(screen.getByText(/Useful sale news only/i)).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Be First Through the Door' })).toBeVisible()
  })
})

describe('SignupPopup — dialog behavior', () => {
  it('moves focus into the dialog and restores it on close', async () => {
    const user = userEvent.setup()
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()

    const { rerender } = renderPopup({ open: true })
    await waitFor(() => expect(screen.getByLabelText(/first name/i)).toHaveFocus())

    await user.click(screen.getByRole('button', { name: /close sale alerts signup/i }))
    rerender(
      <SignupPopup
        formAction="/forms/submit/"
        open={false}
        source="test-site"
        sourcePath="/"
        storageNamespace={NS}
      />,
    )
    await waitFor(() => expect(trigger).toHaveFocus())
    trigger.remove()
  })

  it('locks the page behind it and unlocks on close', async () => {
    const { rerender } = renderPopup({ open: true })
    expect(document.documentElement.style.overflow).toBe('hidden')
    rerender(
      <SignupPopup
        formAction="/forms/submit/"
        open={false}
        source="test-site"
        sourcePath="/"
        storageNamespace={NS}
      />,
    )
    await waitFor(() => expect(document.documentElement.style.overflow).not.toBe('hidden'))
  })

  it('closes on Escape', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderPopup({ onClose, open: true })
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes when the overlay behind the dialog is clicked, but not the dialog', async () => {
    const onClose = vi.fn()
    renderPopup({ onClose, open: true })
    const dialog = screen.getByRole('dialog')
    dialog.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(onClose).not.toHaveBeenCalled()

    const overlay = document.querySelector('.sale-alert-signup-modal') as HTMLElement
    overlay.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    expect(onClose).toHaveBeenCalled()
  })

  it('traps Tab inside the dialog', async () => {
    const user = userEvent.setup()
    renderPopup({ open: true })
    const focusable = Array.from(
      document.querySelectorAll<HTMLElement>(
        '.sale-alert-signup-modal a[href],.sale-alert-signup-modal button:not([disabled]),.sale-alert-signup-modal input:not([disabled])',
      ),
    )
    focusable[focusable.length - 1]?.focus()
    await user.tab()
    expect(document.activeElement).toBe(focusable[0])
  })
})

describe('SignupPopup — submission states', () => {
  it('refuses a phone number without consent and never calls the server', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const user = userEvent.setup()
    renderPopup({ open: true })

    await user.type(screen.getByLabelText(/first name/i), 'Dana')
    await user.type(screen.getByLabelText(/email address/i), 'dana@example.com')
    await user.type(screen.getByLabelText(/mobile phone/i), '6155550134')
    await user.click(screen.getByRole('button', { name: 'Send me sale alerts' }))

    expect(await screen.findByText(/permission box/i)).toBeVisible()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('shows success, records permanent suppression, and reports the signup', async () => {
    const onAnalyticsEvent = vi.fn()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ eventId: 'evt_1', message: 'You are on the list.', success: true }),
    )
    const user = userEvent.setup()
    renderPopup({ onAnalyticsEvent, open: true })

    await user.type(screen.getByLabelText(/first name/i), 'Dana')
    await user.type(screen.getByLabelText(/email address/i), 'dana@example.com')
    await user.click(screen.getByRole('button', { name: 'Send me sale alerts' }))

    expect(await screen.findByText('You are on the list.')).toBeVisible()
    expect(readSuppression(NS).signedUp).toBe(true)
    expect(onAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'evt_1', name: 'signup_popup_signup', smsConsent: false }),
    )
  })

  it('surfaces the server message on failure and does not suppress', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ message: 'That email looks wrong.', success: false }, false),
    )
    const user = userEvent.setup()
    renderPopup({ open: true })

    await user.type(screen.getByLabelText(/first name/i), 'Dana')
    await user.type(screen.getByLabelText(/email address/i), 'dana@example.com')
    await user.click(screen.getByRole('button', { name: 'Send me sale alerts' }))

    expect(await screen.findByText('That email looks wrong.')).toBeVisible()
    expect(readSuppression(NS).signedUp).toBe(false)
  })

  it('sends the audience fields and consent version the route expects', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ success: true }))
    const user = userEvent.setup()
    renderPopup({
      audienceFields: { audienceId: 'c75733484a', mergePhone: 'PHONE' },
      open: true,
      source: 'offers-site',
    })

    await user.type(screen.getByLabelText(/first name/i), 'Dana')
    await user.type(screen.getByLabelText(/email address/i), 'dana@example.com')
    await user.type(screen.getByLabelText(/mobile phone/i), '615-555-0134')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Send me sale alerts' }))

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    const body = fetchSpy.mock.calls[0]?.[1]?.body as FormData
    expect(body.get('email')).toBe('dana@example.com')
    expect(body.get('phone')).toBe('615-555-0134')
    expect(body.get('smsConsent')).toBe('yes')
    expect(body.get('smsDisclosureVersion')).toBe('sale-alert-v1')
    expect(body.get('audienceId')).toBe('c75733484a')
    expect(body.get('mergePhone')).toBe('PHONE')
    expect(body.get('source')).toBe('offers-site')
    expect(body.get('website')).toBe('')
  })
})

describe('SignupPopup — scheduling', () => {
  it('opens itself after the desktop delay and reports the trigger', async () => {
    vi.useFakeTimers()
    const onAnalyticsEvent = vi.fn()
    renderPopup({ onAnalyticsEvent, schedule: true })

    act(() => {
      vi.advanceTimersByTime(29_000)
    })
    expect(document.querySelector('.sale-alert-signup-modal')?.hasAttribute('hidden')).toBe(true)

    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(document.querySelector('.sale-alert-signup-modal')?.hasAttribute('hidden')).toBe(false)
    expect(onAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'signup_popup_shown', trigger: 'time' }),
    )
  })

  it('stays shut on a checkout page no matter how long someone lingers', () => {
    vi.useFakeTimers()
    renderPopup({ schedule: true, sourcePath: '/checkout/payment' })
    act(() => {
      vi.advanceTimersByTime(600_000)
    })
    expect(document.querySelector('.sale-alert-signup-modal')?.hasAttribute('hidden')).toBe(true)
  })

  it('stays shut while an embedded signup form is on screen', () => {
    vi.useFakeTimers()
    const embedded = document.createElement('div')
    embedded.setAttribute('data-eg-embedded-signup', '')
    embedded.getBoundingClientRect = () =>
      ({ bottom: 400, height: 200, left: 0, right: 300, top: 200, width: 300 }) as DOMRect
    document.body.append(embedded)

    renderPopup({ schedule: true })
    act(() => {
      vi.advanceTimersByTime(120_000)
    })
    expect(document.querySelector('.sale-alert-signup-modal')?.hasAttribute('hidden')).toBe(true)
    embedded.remove()
  })

  it('honours a dismissal for 14 days', () => {
    vi.useFakeTimers()
    window.localStorage.setItem(
      NS,
      JSON.stringify({ dismissedAt: Date.now() - 3 * 86_400_000, signedUp: false }),
    )
    renderPopup({ schedule: true })
    act(() => {
      vi.advanceTimersByTime(120_000)
    })
    expect(document.querySelector('.sale-alert-signup-modal')?.hasAttribute('hidden')).toBe(true)
  })

  it('records the dismissal when someone closes an auto-opened popup', async () => {
    vi.useFakeTimers()
    renderPopup({ schedule: true })
    act(() => {
      vi.advanceTimersByTime(31_000)
    })
    const close = screen.getByRole('button', { name: /close sale alerts signup/i })
    act(() => {
      close.click()
    })
    expect(readSuppression(NS).dismissedAt).not.toBeNull()
  })
})

describe('SignupPopup — never pester someone twice', () => {
  it('never opens again once the visitor has signed up', () => {
    vi.useFakeTimers()
    // What recordSignup() writes after a successful submission.
    window.localStorage.setItem(NS, JSON.stringify({ dismissedAt: Date.now(), signedUp: true }))

    renderPopup({ schedule: true })
    act(() => {
      vi.advanceTimersByTime(600_000)
    })
    expect(document.querySelector('.sale-alert-signup-modal')?.hasAttribute('hidden')).toBe(true)
  })

  it('stays gone after a signup even a year later', () => {
    vi.useFakeTimers()
    window.localStorage.setItem(
      NS,
      JSON.stringify({ dismissedAt: Date.now() - 400 * 86_400_000, signedUp: true }),
    )
    renderPopup({ schedule: true })
    act(() => {
      vi.advanceTimersByTime(600_000)
    })
    expect(document.querySelector('.sale-alert-signup-modal')?.hasAttribute('hidden')).toBe(true)
  })

  it('shows once per session, not once per page view', () => {
    vi.useFakeTimers()
    // First page: the popup appears.
    const first = renderPopup({ schedule: true })
    act(() => {
      vi.advanceTimersByTime(31_000)
    })
    expect(document.querySelector('.sale-alert-signup-modal')?.hasAttribute('hidden')).toBe(false)
    first.unmount()

    // Second page in the same session — a reload, or a click through to
    // another sale. Same visitor, same tab: do not ask again.
    renderPopup({ schedule: true })
    act(() => {
      vi.advanceTimersByTime(600_000)
    })
    expect(document.querySelector('.sale-alert-signup-modal')?.hasAttribute('hidden')).toBe(true)
  })

  it('marks the session as asked the moment it opens, before any interaction', () => {
    vi.useFakeTimers()
    renderPopup({ schedule: true })
    act(() => {
      vi.advanceTimersByTime(31_000)
    })
    // Reloading while the popup is on screen must not re-arm it.
    expect(window.sessionStorage.getItem(`${NS}:shown`)).toBe('1')
  })

  it('still opens on demand when the site asks it to, session flag or not', () => {
    // The main site's banner button is a deliberate request. "Already shown"
    // must never block someone who just clicked "get sale alerts".
    window.sessionStorage.setItem(`${NS}:shown`, '1')
    renderPopup({ open: true, schedule: true })
    expect(document.querySelector('.sale-alert-signup-modal')?.hasAttribute('hidden')).toBe(false)
  })
})
