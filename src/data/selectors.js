import {
  addDays,
  dateOf,
  daysInMonth,
  isActiveJob,
  isCompletedJob,
  monthOf,
  monthsBack,
  sumBy,
} from './utils'

export const activeLoad = (jobs, technicianId) =>
  jobs.filter((job) => job.technicianId === technicianId && isActiveJob(job)).length

export const findAvailableTechnician = (
  technicians = [],
  jobs = [],
  requiredSkills = [],
) => {
  const needed = new Set(
    (requiredSkills || []).map((skill) => String(skill || '').toLowerCase()),
  )
  const candidates = technicians
    .filter((tech) => tech.status === 'Online')
    .filter((tech) => {
      const skills = tech.skills || []
      return skills.some((skill) => needed.has(String(skill || '').toLowerCase()))
    })
    .sort(
      (a, b) =>
        activeLoad(jobs, a.id) - activeLoad(jobs, b.id) ||
        (a.completedJobs || 0) - (b.completedJobs || 0),
    )
  return candidates[0] || null
}

export const paidJobs = (jobs = []) =>
  jobs.filter((job) => job.paymentStatus === 'Paid')

export const totalRevenue = (jobs = []) =>
  sumBy(paidJobs(jobs), (job) => job.amount)

export const revenueBetween = (jobs = [], from, to) =>
  sumBy(
    jobs.filter((job) => {
      if (job.paymentStatus !== 'Paid') return false
      const day = dateOf(job.paidAt)
      return day && day >= from && day <= to
    }),
    (job) => job.amount,
  )

export const revenueOn = (jobs = [], date) =>
  sumBy(
    jobs.filter(
      (job) => job.paymentStatus === 'Paid' && dateOf(job.paidAt) === date,
    ),
    (job) => job.amount,
  )

export const jobsCreatedOn = (jobs = [], date) =>
  jobs.filter((job) => dateOf(job.createdAt) === date)

export const jobsCompletedOn = (jobs = [], date) =>
  jobs.filter((job) => dateOf(job.completedAt) === date)

export const paymentsOn = (jobs = [], date) =>
  jobs.filter(
    (job) => job.paymentStatus === 'Paid' && dateOf(job.paidAt) === date,
  )

export const outstandingAmount = (jobs = []) =>
  sumBy(
    jobs.filter((job) => isCompletedJob(job) && job.paymentStatus !== 'Paid'),
    (job) => job.amount,
  )

export const paymentSplit = (jobs = []) => {
  const invoiced = jobs.filter(isCompletedJob)
  const paid = sumBy(
    invoiced.filter((job) => job.paymentStatus === 'Paid'),
    (job) => job.amount,
  )
  const unpaid = sumBy(
    invoiced.filter((job) => job.paymentStatus !== 'Paid'),
    (job) => job.amount,
  )
  const total = paid + unpaid
  return { paid, unpaid, total, paidPct: total ? Math.round((paid / total) * 100) : 0 }
}

export const dailyRevenueSeries = (jobs = [], days = 7) =>
  Array.from({ length: days }, (_, index) => {
    const date = addDays(index - (days - 1))
    const dateObj = new Date(`${date}T00:00:00`)
    return {
      key: date,
      label: dateObj.toLocaleDateString('en-IN', { weekday: 'short' }),
      fullLabel: dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      }),
      revenue: revenueOn(jobs, date),
      count: paymentsOn(jobs, date).length,
    }
  })

export const monthlyRevenueSeries = (jobs = [], months = 6) =>
  Array.from({ length: months }, (_, index) => {
    const key = monthsBack(months - 1 - index)
    const monthJobs = paidJobs(jobs).filter(
      (job) => dateOf(job.paidAt).slice(0, 7) === key,
    )
    return {
      key,
      label: new Date(`${key}-01T00:00:00`).toLocaleDateString('en-IN', {
        month: 'short',
      }),
      fullLabel: new Date(`${key}-01T00:00:00`).toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric',
      }),
      revenue: sumBy(monthJobs, (job) => job.amount),
      count: monthJobs.length,
    }
  })

export const monthDaySeries = (jobs = [], monthKey) => {
  const total = daysInMonth(monthKey)
  return Array.from({ length: total }, (_, index) => {
    const day = `${monthKey}-${String(index + 1).padStart(2, '0')}`
    const payments = paymentsOn(jobs, day)
    return {
      key: day,
      label: String(index + 1),
      revenue: sumBy(payments, (job) => job.amount),
      count: payments.length,
    }
  })
}

export const serviceStats = (jobs = []) => {
  const map = new Map()
  jobs.forEach((job) => {
    ;(job.services || []).forEach((service) => {
      const entry = map.get(service.id) || {
        id: service.id,
        name: service.name,
        count: 0,
        revenue: 0,
      }
      entry.count += 1
      entry.revenue += service.price
      map.set(service.id, entry)
    })
  })
  return [...map.values()].sort((a, b) => b.revenue - a.revenue)
}

export const technicianStats = (jobs = [], technicians = []) =>
  technicians
    .map((tech) => {
      const assigned = jobs.filter((job) => job.technicianId === tech.id)
      const completed = assigned.filter(isCompletedJob)
      const paid = completed.filter((job) => job.paymentStatus === 'Paid')
      return {
        ...tech,
        active: assigned.filter(isActiveJob).length,
        completed: completed.length,
        revenue: sumBy(paid, (job) => job.amount),
      }
    })
    .sort((a, b) => b.revenue - a.revenue)

export const lowStockParts = (parts = []) =>
  parts.filter((part) => Number(part.stock) <= Number(part.minStock))

export const inventoryValue = (parts = []) =>
  sumBy(parts, (part) => Number(part.stock) * Number(part.price))

export const stockStatus = (part) => {
  if (Number(part.stock) <= 0) return 'Out of Stock'
  if (Number(part.stock) <= Number(part.minStock)) return 'Low Stock'
  return 'In Stock'
}

export const monthBounds = (monthKey) => ({
  from: `${monthKey}-01`,
  to: `${monthKey}-${String(daysInMonth(monthKey)).padStart(2, '0')}`,
})

export const currentMonth = () => monthOf(new Date())

export const previousMonth = (monthKey) => {
  const date = new Date(`${monthKey}-01T00:00:00`)
  date.setMonth(date.getMonth() - 1)
  return monthOf(date)
}

export const changePct = (current, previous) => {
  if (!previous) return current ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export const customerPaidSpend = (jobs = [], customerId) =>
  sumBy(
    jobs.filter(
      (job) => job.customerId === customerId && job.paymentStatus === 'Paid',
    ),
    (job) => job.amount,
  )

export const customerJobs = (jobs = [], customerId) =>
  jobs.filter((job) => job.customerId === customerId)
