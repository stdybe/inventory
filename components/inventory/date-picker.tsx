'use client'

import { useState, useEffect } from 'react'
import { format, parse, isValid } from 'date-fns'
import { ko } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerProps {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
}

export function DatePicker({ date, onDateChange, placeholder = '날짜 선택' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    if (date && isValid(date)) {
      setInputValue(format(date, 'yyyy-MM-dd'))
    } else {
      setInputValue('')
    }
  }, [date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Try to parse the date
    const parsed = parse(value, 'yyyy-MM-dd', new Date())
    if (isValid(parsed)) {
      onDateChange(parsed)
    }
  }

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate)
    setOpen(false)
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex flex-1 gap-2">
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setOpen(true)}
              placeholder="YYYY-MM-DD"
              className="bg-card flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                'shrink-0',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleCalendarSelect}
            locale={ko}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
