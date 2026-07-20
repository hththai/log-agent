// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DashboardViewSwitcher } from './DashboardViewSwitcher'

afterEach(() => {
    cleanup()
})

describe('DashboardViewSwitcher', () => {
    it('renders both options when showDiagramOption is true', () => {
        render(<DashboardViewSwitcher activeView="table" onChange={vi.fn()} showDiagramOption={true} />)

        expect(screen.getByRole('button', { name: /Table & Chart/i })).toBeTruthy()
        expect(screen.getByRole('button', { name: /Network Diagram/i })).toBeTruthy()
    })

    it('renders only the table option when showDiagramOption is false', () => {
        render(<DashboardViewSwitcher activeView="table" onChange={vi.fn()} showDiagramOption={false} />)

        expect(screen.getByRole('button', { name: /Table & Chart/i })).toBeTruthy()
        expect(screen.queryByRole('button', { name: /Network Diagram/i })).toBeNull()
    })

    it('calls onChange with the corresponding value when each option is clicked', () => {
        const onChange = vi.fn()
        render(<DashboardViewSwitcher activeView="table" onChange={onChange} showDiagramOption={true} />)

        fireEvent.click(screen.getByRole('button', { name: /Network Diagram/i }))
        expect(onChange).toHaveBeenCalledWith('diagram')

        fireEvent.click(screen.getByRole('button', { name: /Table & Chart/i }))
        expect(onChange).toHaveBeenCalledWith('table')
    })

    it('marks aria-pressed on the option matching activeView', () => {
        const { rerender } = render(
            <DashboardViewSwitcher activeView="table" onChange={vi.fn()} showDiagramOption={true} />,
        )

        expect(screen.getByRole('button', { name: /Table & Chart/i }).getAttribute('aria-pressed')).toBe('true')
        expect(screen.getByRole('button', { name: /Network Diagram/i }).getAttribute('aria-pressed')).toBe('false')

        rerender(<DashboardViewSwitcher activeView="diagram" onChange={vi.fn()} showDiagramOption={true} />)

        expect(screen.getByRole('button', { name: /Table & Chart/i }).getAttribute('aria-pressed')).toBe('false')
        expect(screen.getByRole('button', { name: /Network Diagram/i }).getAttribute('aria-pressed')).toBe('true')
    })
})
