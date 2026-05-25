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
  const [prevLength, setPrevLength] = useState(0)

  useEffect(() => {
    if (date && isValid(date)) {
      setInputValue(format(date, 'yyyy-MM-dd'))
      setPrevLength(10)
    } else {
      setInputValue('')
      setPrevLength(0)
    }
  }, [date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalValue = e.target.value
    let value = originalValue.replace(/[^0-9-]/g, '')
    const isDeleting = value.length < prevLength
    
    // 삭제 중이 아닐 때만 자동 하이픈 삽입
    if (!isDeleting) {
      if (value.length === 4 && !value.includes('-')) {
        value = value + '-'
      } else if (value.length === 7 && value.split('-').length === 2) {
        value = value + '-'
      }
    }
    
    if (value.length > 10) {
      value = value.slice(0, 10)
    }
    
    setInputValue(value)
    setPrevLength(value.length)
    
    if (value === '') {
      onDateChange(undefined)
      return
    }

    // 유효한 날짜가 완성되면 즉시 반영
    const parsed = parse(value, 'yyyy-MM-dd', new Date())
    if (isValid(parsed) && value.length === 10) {
      onDateChange(parsed)
    }
  }

  const handleBlur = () => {
    if (inputValue === '') {
      onDateChange(undefined)
      return
    }

    const parsed = parse(inputValue, 'yyyy-MM-dd', new Date())
    if (isValid(parsed)) {
      onDateChange(parsed)
      setInputValue(format(parsed, 'yyyy-MM-dd'))
    } else if (date && isValid(date)) {
      setInputValue(format(date, 'yyyy-MM-dd'))
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
              onBlur={handleBlur}
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
            captionLayout="dropdown"
            fromYear={new Date().getFullYear() - 10}
            toYear={new Date().getFullYear() + 20}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
