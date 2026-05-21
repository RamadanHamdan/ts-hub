import React from 'react'

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string
}

export default function DatePicker({
  placeholder,
  className = '',
  ...props
}: DatePickerProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type='date'
        placeholder={placeholder}
        className='w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400
                           focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500'
        {...props}
      />
      {placeholder && (
        <span className='absolute left-3 -top-2.5 bg-white px-1 text-xs font-medium text-gray-500 pointer-events-none hidden'>
          {placeholder}
        </span>
      )}
    </div>
  )
}
