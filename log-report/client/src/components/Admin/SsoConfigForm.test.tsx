// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as ssoApi from '#/api/sso'
import SsoConfigForm from './SsoConfigForm'

vi.mock('#/api/sso', () => ({
    getConfig: vi.fn(),
    saveConfig: vi.fn(),
    validateConfig: vi.fn(),
}))

const mockedGetConfig = vi.mocked(ssoApi.getConfig)
const mockedSaveConfig = vi.mocked(ssoApi.saveConfig)
const mockedValidateConfig = vi.mocked(ssoApi.validateConfig)

describe('SsoConfigForm', () => {
    beforeEach(() => {
        sessionStorage.clear()
        mockedGetConfig.mockResolvedValue({
            provider: null,
            demo_mode: { enabled: false, default_email: '', allow_local_validation: true },
        })
    })

    afterEach(() => {
        cleanup()
        vi.clearAllMocks()
    })

    it('blocks submit and shows inline errors when required fields are missing', async () => {
        render(<SsoConfigForm />)
        await waitFor(() => expect(mockedGetConfig).toHaveBeenCalled())

        fireEvent.click(screen.getByRole('button', { name: /save configuration/i }))

        expect(await screen.findByText(/issuer is required/i)).toBeTruthy()
        expect(await screen.findByText(/admin token is required to save/i)).toBeTruthy()
        expect(mockedSaveConfig).not.toHaveBeenCalled()
    })

    it('shows a clear error when the admin token is missing for validate', async () => {
        render(<SsoConfigForm />)
        await waitFor(() => expect(mockedGetConfig).toHaveBeenCalled())

        fireEvent.click(screen.getByRole('button', { name: /validate configuration/i }))

        expect(await screen.findByText(/admin token is required to validate/i)).toBeTruthy()
        expect(mockedValidateConfig).not.toHaveBeenCalled()
    })

    it('surfaces the server denial message when the admin token is incorrect', async () => {
        mockedSaveConfig.mockRejectedValue(new Error('Admin token is missing or incorrect.'))

        render(<SsoConfigForm />)
        await waitFor(() => expect(mockedGetConfig).toHaveBeenCalled())

        fireEvent.change(screen.getByLabelText(/^issuer$/i), {
            target: { value: 'https://accounts.google.com' },
        })
        fireEvent.change(screen.getByLabelText(/client id/i), { target: { value: 'client-123' } })
        fireEvent.change(screen.getByLabelText(/redirect uri/i), {
            target: { value: 'https://app.example.com/callback' },
        })
        fireEvent.change(screen.getByLabelText(/admin token/i), { target: { value: 'wrong-token' } })

        fireEvent.click(screen.getByRole('button', { name: /save configuration/i }))

        expect(await screen.findByText(/admin token is missing or incorrect/i)).toBeTruthy()
        expect(mockedSaveConfig).toHaveBeenCalled()
    })
})
