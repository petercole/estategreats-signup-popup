import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SignupInline } from '../src/SignupInline'

afterEach(() => vi.restoreAllMocks())

function renderInline(props: Partial<React.ComponentProps<typeof SignupInline>> = {}) {
  return render(
    <SignupInline formAction="/api/offers/sale-alerts" source="offers-footer" sourcePath="/" {...props} />,
  )
}

const ok = (body: unknown) => ({ ok: true, json: async () => body }) as Response

describe('SignupInline — matches the homepage form', () => {
  it('requires email and mobile, and asks for nothing else', () => {
    renderInline()
    expect(screen.getByLabelText('Email address')).toBeRequired()
    expect(screen.getByLabelText(/mobile phone/i)).toBeRequired()
    // The homepage form has no first-name field; adding one here would make
    // the two sites differ, which is the whole thing this package prevents.
    expect(screen.queryByLabelText(/first name/i)).toBeNull()
  })

  it('uses the homepage call to action', () => {
    renderInline()
    expect(screen.getByRole('button', { name: 'Get sale alerts' })).toBeVisible()
    expect(screen.getByText('Email and text sale alerts. Unsubscribe anytime.')).toBeVisible()
  })

  it('shows the SMS consent tick unchecked, with the terms link', () => {
    renderInline()
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(screen.getByRole('checkbox')).toBeRequired()
    expect(screen.getByRole('link', { name: /Privacy & SMS terms/i })).toBeVisible()
  })

  it('requires consent for a phone number and never calls the server', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const user = userEvent.setup()
    renderInline()
    await user.type(screen.getByLabelText('Email address'), 'dana@example.com')
    await user.type(screen.getByLabelText(/mobile phone/i), '6155550134')
    await user.click(screen.getByRole('button', { name: 'Get sale alerts' }))
    expect(screen.getByRole('checkbox')).toBeInvalid()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('posts the same field names the popup posts', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ success: true }))
    const user = userEvent.setup()
    renderInline({ audienceFields: { audienceId: 'c75733484a' } })
    await user.type(screen.getByLabelText('Email address'), 'dana@example.com')
    await user.type(screen.getByLabelText(/mobile phone/i), '6155550134')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Get sale alerts' }))
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    const body = fetchSpy.mock.calls[0]?.[1]?.body as FormData
    expect(body.get('formType')).toBe('sale-alert')
    expect(body.get('email')).toBe('dana@example.com')
    expect(body.get('smsDisclosureVersion')).toBe('sale-alert-v1')
    expect(body.get('audienceId')).toBe('c75733484a')
    expect(body.get('website')).toBe('')
  })

  it('reports success from the server', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(ok({ message: "You're on the list.", success: true }))
    const user = userEvent.setup()
    renderInline()
    await user.type(screen.getByLabelText('Email address'), 'dana@example.com')
    await user.type(screen.getByLabelText(/mobile phone/i), '6155550134')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Get sale alerts' }))
    expect(await screen.findByText("You're on the list.")).toBeVisible()
  })
})
