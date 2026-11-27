export const money = (value = 0) =>
  '₹' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export const hashPassword = (value = '') => {
  const str = String(value || '')
  let hash = 5381
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash * 33) + str.charCodeAt(i)) >>> 0
  }
  return `v1.${hash.toString(16)}`
}

export const moneyExact = (value = 0) =>
  '₹' +
  Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

export const isoDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`

export const todayISO = () => isoDate()

export const dateOf = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return isoDate(date)
}

export const addDays = (days, from = new Date()) => {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return isoDate(d)
}

export const monthsBack = (count) => {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - count)
  return isoDate(d).slice(0, 7)
}

export const monthOf = (value = new Date()) => isoDate(value).slice(0, 7)

export const monthLabel = (key) => {
  if (!key) return '—'
  const date = new Date(`${key}-01T00:00:00`)
  if (Number.isNaN(date.getTime())) return key
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export const shortMonth = (key) => {
  if (!key) return '—'
  const date = new Date(`${key}-01T00:00:00`)
  if (Number.isNaN(date.getTime())) return key
  return date.toLocaleDateString('en-IN', { month: 'short' })
}

export const daysInMonth = (key) => {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month, 0).getDate()
}

export const timestamp = (dateStr, time = '10:00') =>
  new Date(`${dateStr}T${time}:00`).toISOString()

export const addHours = (value, hours) =>
  new Date(new Date(value).getTime() + hours * 3600 * 1000).toISOString()

export const displayDate = (value) => {
  if (!value) return '—'
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const displayDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return displayDate(value)
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const timeAgo = (value) => {
  if (!value) return '—'
  const diff = Date.now() - new Date(value).getTime()
  if (Number.isNaN(diff)) return '—'
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return displayDate(value)
}

export const uid = (prefix = 'id') =>
  `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?'

export const classNames = (...values) => values.filter(Boolean).join(' ')

export const digitsOnly = (value = '') => String(value || '').replace(/\D/g, '')

export const sumBy = (items = [], getter = (item) => item) =>
  items.reduce((total, item) => total + Number(getter(item) || 0), 0)

export const pluralize = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural || `${singular}s`}`

export const downloadCSV = (filename, rows) => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const isActiveJob = (job) =>
  job.status === 'Pending' || job.status === 'In Progress'

export const isCompletedJob = (job) =>
  job.status === 'Completed' || job.status === 'Delivered'

export const nextJobNumber = (jobs = []) => {
  const max = jobs.reduce(
    (highest, job) =>
      Math.max(highest, Number(String(job.jobNo || '').replace(/\D/g, '')) || 0),
    1000,
  )
  return `JC-${max + 1}`
}

export const statusTone = (status) =>
  ({
    Pending: 'warning',
    'In Progress': 'info',
    Completed: 'success',
    Delivered: 'success',
    Paid: 'success',
    Unpaid: 'danger',
    Online: 'success',
    Available: 'success',
    Busy: 'warning',
    Offline: 'neutral',
    Inactive: 'neutral',
    High: 'danger',
    Normal: 'neutral',
    Low: 'info',
    'In Stock': 'success',
    'Low Stock': 'warning',
    'Out of Stock': 'danger',
  })[status] || 'neutral'
