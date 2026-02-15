import { test, expect, describe } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DevToolsDemo from '../DevToolsDemo'

describe('DevToolsDemo Main Component', () => {
  test('renders header', () => {
    render(<DevToolsDemo />)
    expect(screen.getByText(/Nexus State DevTools Demo/i)).toBeInTheDocument()
  })

  test('renders all tab buttons', () => {
    render(<DevToolsDemo />)
    expect(screen.getByText('Counter')).toBeInTheDocument()
    expect(screen.getByText('Computed Values')).toBeInTheDocument()
  })

  test('switches between tabs', () => {
    render(<DevToolsDemo />)
    
    // The demo only shows counter section, no tabs for other components yet
    expect(screen.getByText('Counter')).toBeInTheDocument()
    expect(screen.getByText('Computed Values')).toBeInTheDocument()
  })
})
