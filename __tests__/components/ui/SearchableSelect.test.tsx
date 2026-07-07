import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { it } from 'zod/v4/locales'

describe('SearchableSelect', () => {
  const mockOptions = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
  ]

  it('should render with default placeholder', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        onChange={jest.fn()}
      />
    )
    
    // react-select usually renders the placeholder in the DOM
    expect(screen.getByText('Pilih...')).toBeInTheDocument()
  })

  it('should render with custom placeholder', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        onChange={jest.fn()}
        placeholder="Custom Placeholder"
      />
    )
    
    expect(screen.getByText('Custom Placeholder')).toBeInTheDocument()
  })

  it('should call onChange with correct value when an option is selected', async () => {
    const mockOnChange = jest.fn()
    const user = userEvent.setup()

    render(
      <SearchableSelect
        options={mockOptions}
        onChange={mockOnChange}
      />
    )

    // Open dropdown
    const selectControl = screen.getByText('Pilih...')
    await user.click(selectControl)

    // Select 'Option 1'
    const option1 = screen.getByText('Option 1')
    await user.click(option1)

    expect(mockOnChange).toHaveBeenCalledWith('opt1')
  })

  it('should correctly select default value if provided', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        value="opt2"
        onChange={jest.fn()}
      />
    )
    
    // If value="opt2", it should display "Option 2"
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })
})
