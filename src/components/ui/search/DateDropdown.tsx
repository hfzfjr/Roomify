'use client'

import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, getMonth, getYear, isSameDay, isSameMonth, setMonth, setYear, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import './DateDropdown.css'

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_OPTIONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export type DateDropdownProps = {
  selectedDate: Date | null
  calendarMonth: Date
  onDateSelect: (date: Date) => void
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
  onPreviousMonth: () => void
  onNextMonth: () => void
  onActiveDateMenuChange: (menu: 'month' | 'year' | null) => void
  activeDateMenu: 'month' | 'year' | null
}

export default function DateDropdown({
  selectedDate,
  calendarMonth,
  onDateSelect,
  onMonthChange,
  onYearChange,
  onPreviousMonth,
  onNextMonth,
  onActiveDateMenuChange,
  activeDateMenu
}: DateDropdownProps) {
  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 0 })
  })

  const yearOptions = Array.from({ length: 11 }, (_, index) => getYear(new Date()) - 5 + index)

  return (
    <div className="sf-date-dropdown">
      <div className="sf-date-toolbar">
        <button type="button" className="sf-date-nav" onClick={onPreviousMonth} aria-label="Previous month">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <div className="sf-date-selects">
          <div className="sf-date-menu-wrap">
            <button
              type="button"
              className={`sf-date-select-button${activeDateMenu === 'month' ? ' open' : ''}`}
              onClick={() => onActiveDateMenuChange(activeDateMenu === 'month' ? null : 'month')}
            >
              <span>{MONTH_OPTIONS[getMonth(calendarMonth)]}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {activeDateMenu === 'month' && (
              <div className="sf-date-menu">
                {MONTH_OPTIONS.map((monthLabel, index) => (
                  <button
                    key={monthLabel}
                    type="button"
                    className={`sf-date-menu-option${getMonth(calendarMonth) === index ? ' selected' : ''}`}
                    onClick={() => {
                      onMonthChange(index)
                      onActiveDateMenuChange(null)
                    }}
                  >
                    {monthLabel}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="sf-date-menu-wrap">
            <button
              type="button"
              className={`sf-date-select-button${activeDateMenu === 'year' ? ' open' : ''}`}
              onClick={() => onActiveDateMenuChange(activeDateMenu === 'year' ? null : 'year')}
            >
              <span>{getYear(calendarMonth)}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {activeDateMenu === 'year' && (
              <div className="sf-date-menu sf-date-menu-years">
                {yearOptions.map(year => (
                  <button
                    key={year}
                    type="button"
                    className={`sf-date-menu-option${getYear(calendarMonth) === year ? ' selected' : ''}`}
                    onClick={() => {
                      onYearChange(year)
                      onActiveDateMenuChange(null)
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="button" className="sf-date-nav" onClick={onNextMonth} aria-label="Next month">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="sf-date-weekdays">
        {WEEK_DAYS.map(day => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="sf-date-grid">
        {calendarDays.map(day => {
          const isCurrentMonth = isSameMonth(day, calendarMonth)
          const isSelectedDay = selectedDate ? isSameDay(day, selectedDate) : false

          return (
            <button
              key={day.toISOString()}
              type="button"
              className={`sf-date-cell${isSelectedDay ? ' selected' : ''}${isCurrentMonth ? '' : ' muted'}`}
              onClick={() => onDateSelect(day)}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
