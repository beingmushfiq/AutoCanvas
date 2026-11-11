export interface CalendarDay {
  date: Date
  dateString: string // YYYY-MM-DD
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  dayOfWeek: number // 0 = Sunday, 1 = Monday...
}

export interface PeakTimeSlot {
  dayOfWeek: number // 1 = Mon ... 7 = Sun
  time: string // HH:mm
  label: string
}

export const PEAK_TIME_SLOTS: PeakTimeSlot[] = [
  { dayOfWeek: 1, time: '10:00', label: 'Morning Kickoff' },
  { dayOfWeek: 2, time: '10:00', label: 'Peak Reach' },
  { dayOfWeek: 2, time: '14:30', label: 'Afternoon Surge' },
  { dayOfWeek: 3, time: '09:15', label: 'Midweek Prime' },
  { dayOfWeek: 3, time: '15:00', label: 'Afternoon Prime' },
  { dayOfWeek: 4, time: '11:00', label: 'B2B Window' },
  { dayOfWeek: 4, time: '16:00', label: 'High Engagement' },
  { dayOfWeek: 5, time: '09:30', label: 'Morning Pulse' },
  { dayOfWeek: 5, time: '13:00', label: 'Lunch Digest' },
  { dayOfWeek: 6, time: '11:00', label: 'Weekend Leisure' },
  { dayOfWeek: 0, time: '19:00', label: 'Evening Reset' },
]

export function formatYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseYMD(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatTime12h(time24: string): string {
  if (!time24) return '12:00 PM'
  const [hStr, mStr] = time24.split(':')
  let h = parseInt(hStr, 10)
  const m = mStr ? mStr.slice(0, 2) : '00'
  if (isNaN(h)) return time24
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  h = h ? h : 12 // 0 becomes 12
  return `${h}:${m} ${ampm}`
}

export function formatMonthYear(year: number, month: number): string {
  const d = new Date(year, month, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/**
 * Returns a 35 or 42 day matrix (5 or 6 weeks) for a given month, starting on Monday.
 */
export function getMonthMatrix(year: number, month: number): CalendarDay[] {
  const todayYMD = formatYMD(new Date())
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Monday = 0, Tuesday = 1 ... Sunday = 6
  let startOffset = firstDay.getDay() - 1
  if (startOffset === -1) startOffset = 6 // Sunday becomes 6

  const days: CalendarDay[] = []

  // Preceding month overflow days
  for (let i = startOffset; i > 0; i--) {
    const d = new Date(year, month, 1 - i)
    const ymd = formatYMD(d)
    const dayOfWeek = d.getDay()
    days.push({
      date: d,
      dateString: ymd,
      dayNumber: d.getDate(),
      isCurrentMonth: false,
      isToday: ymd === todayYMD,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayOfWeek,
    })
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i)
    const ymd = formatYMD(d)
    const dayOfWeek = d.getDay()
    days.push({
      date: d,
      dateString: ymd,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: ymd === todayYMD,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayOfWeek,
    })
  }

  // Trailing overflow days to fill complete 7-day row
  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      const ymd = formatYMD(d)
      const dayOfWeek = d.getDay()
      days.push({
        date: d,
        dateString: ymd,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: ymd === todayYMD,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        dayOfWeek,
      })
    }
  }

  return days
}

/**
 * Returns 7 days for the week containing baseDate (Monday to Sunday).
 */
export function getWeekDays(baseDate: Date): CalendarDay[] {
  const todayYMD = formatYMD(new Date())
  const d = new Date(baseDate)
  let dayOffset = d.getDay() - 1
  if (dayOffset === -1) dayOffset = 6

  const monday = new Date(d)
  monday.setDate(d.getDate() - dayOffset)

  const week: CalendarDay[] = []
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday)
    current.setDate(monday.getDate() + i)
    const ymd = formatYMD(current)
    const dayOfWeek = current.getDay()
    week.push({
      date: current,
      dateString: ymd,
      dayNumber: current.getDate(),
      isCurrentMonth: true,
      isToday: ymd === todayYMD,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      dayOfWeek,
    })
  }

  return week
}

