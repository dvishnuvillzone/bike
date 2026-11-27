import { useMemo, useState } from 'react'
import { useStore } from '../data/storeContext'
import {
  changePct,
  monthDaySeries,
  paidJobs,
  previousMonth,
  serviceStats,
  technicianStats,
} from '../data/selectors'
import {
  dateOf,
  displayDate,
  downloadCSV,
  money,
  monthLabel,
  monthOf,
  sumBy,
} from '../data/utils'
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  ProgressBar,
  StatCard,
} from '../components/UI'
import { Icon } from '../components/Icons'

const shiftMonth = (monthKey, delta) => {
  const date = new Date(`${monthKey}-01T00:00:00`)
  date.setMonth(date.getMonth() + delta)
  return monthOf(date)
}

export default function Reports() {
  const { data } = useStore()
  const [month, setMonth] = useState(() => monthOf(new Date()))

  const report = useMemo(() => {
    const paid = paidJobs(data.jobs).filter(
      (job) => dateOf(job.paidAt).slice(0, 7) === month,
    )
    const completed = data.jobs.filter(
      (job) =>
        job.completedAt && dateOf(job.completedAt).slice(0, 7) === month,
    )
    const created = data.jobs.filter(
      (job) => dateOf(job.createdAt).slice(0, 7) === month,
    )
    const revenue = sumBy(paid, (job) => job.amount)
    const partsRevenue = sumBy(paid, (job) => job.partsTotal)
    const prevKey = previousMonth(month)
    const prevRevenue = sumBy(
      paidJobs(data.jobs).filter(
        (job) => dateOf(job.paidAt).slice(0, 7) === prevKey,
      ),
      (job) => job.amount,
    )
    const customerIds = new Set(paid.map((job) => job.customerId))
    const methods = ['UPI', 'Cash', 'Card'].map((method) => {
      const methodJobs = paid.filter((job) => job.paymentMethod === method)
      return {
        method,
        amount: sumBy(methodJobs, (job) => job.amount),
        count: methodJobs.length,
      }
    })
    return {
      paid,
      completed,
      created,
      revenue,
      partsRevenue,
      laborRevenue: revenue - partsRevenue,
      avgTicket: paid.length ? Math.round(revenue / paid.length) : 0,
      growth: changePct(revenue, prevRevenue),
      prevRevenue,
      customersServed: customerIds.size,
      services: serviceStats(paid),
      techStats: technicianStats(paid, data.technicians),
      methods,
      days: monthDaySeries(data.jobs, month),
    }
  }, [data.jobs, data.technicians, month])

  const topCustomers = useMemo(() => {
    const map = new Map()
    report.paid.forEach((job) => {
      const entry = map.get(job.customerId) || { amount: 0, jobs: 0 }
      entry.amount += job.amount
      entry.jobs += 1
      map.set(job.customerId, entry)
    })
    return [...map.entries()]
      .map(([customerId, value]) => ({
        customer: data.customers.find((item) => item.id === customerId),
        ...value,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [data.customers, report.paid])

  const maxDay = Math.max(...report.days.map((day) => day.revenue), 1)
  const maxService = Math.max(
    ...report.services.map((service) => service.revenue),
    1,
  )
  const totalMethod = sumBy(report.methods, (method) => method.amount) || 1

  const exportReport = () => {
    const rows = [
      ['Villzone monthly report', monthLabel(month)],
      [],
      ['Revenue', report.revenue],
      ['Labour revenue', report.laborRevenue],
      ['Parts revenue', report.partsRevenue],
      ['Jobs completed', report.completed.length],
      ['Jobs created', report.created.length],
      ['Average ticket', report.avgTicket],
      ['Customers served', report.customersServed],
      [],
      ['Technician', 'Completed', 'Revenue', 'Status'],
      ...report.techStats.map((tech) => [
        tech.name,
        tech.completed,
        tech.revenue,
        tech.status,
      ]),
      [],
      ['Service', 'Bookings', 'Revenue'],
      ...report.services.map((service) => [
        service.name,
        service.count,
        service.revenue,
      ]),
    ]
    downloadCSV(`villzone-monthly-${month}.csv`, rows)
  }

  return (
    <div className="stack-lg">
      <Card className="card-pad report-toolbar">
        <div className="report-date">
          <span className="report-date-icon">
            <Icon name="chart" size={19} />
          </span>
          <div>
            <span>Reporting month</span>
            <strong>{monthLabel(month)}</strong>
            <small>
              {report.paid.length} paid invoices · {report.completed.length} jobs
              completed
            </small>
          </div>
        </div>
        <div className="report-controls">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label="Previous month"
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <input
            type="month"
            className="input date-input"
            value={month}
            onChange={(event) => event.target.value && setMonth(event.target.value)}
          />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setMonth(shiftMonth(month, 1))}
            aria-label="Next month"
          >
            <Icon name="chevron-right" size={18} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setMonth(monthOf(new Date()))}
          >
            This month
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={exportReport}
          >
            <Icon name="download" size={14} />
            Export
          </button>
        </div>
      </Card>

      <div className="stat-grid stat-grid-5">
        <StatCard
          label="Revenue collected"
          value={money(report.revenue)}
          hint={`vs ${money(report.prevRevenue)} last month`}
          icon="rupee"
          tone="success"
          trend={report.growth}
        />
        <StatCard
          label="Jobs completed"
          value={report.completed.length}
          hint={`${report.created.length} new job cards`}
          icon="check-circle"
          tone="brand"
        />
        <StatCard
          label="Average ticket"
          value={money(report.avgTicket)}
          hint="Per paid invoice"
          icon="chart"
          tone="info"
        />
        <StatCard
          label="Customers served"
          value={report.customersServed}
          hint="Unique riders this month"
          icon="users"
          tone="warning"
        />
        <StatCard
          label="Parts revenue"
          value={money(report.partsRevenue)}
          hint={`${money(report.laborRevenue)} labour`}
          icon="package"
          tone="neutral"
        />
      </div>

      <Card className="card-pad">
        <CardHeader
          title="Daily collections"
          subtitle={`Payments received across ${monthLabel(month)}`}
          icon="chart"
          action={<span className="pill">{money(report.revenue)} total</span>}
        />
        <div className="chart-bars chart-bars-dense">
          {report.days.map((day) => {
            const dayNumber = Number(day.label)
            const showLabel =
              dayNumber === 1 ||
              dayNumber % 5 === 0 ||
              dayNumber === report.days.length
            return (
              <div
                className="bar-col"
                key={day.key}
                title={`${displayDate(day.key)}: ${money(day.revenue)}`}
              >
                <span className="bar-value">
                  {day.revenue >= maxDay * 0.6 ? money(day.revenue) : ''}
                </span>
                <div className="bar-track">
                  <div
                    className="bar"
                    style={{
                      height: `${day.revenue ? Math.max(6, (day.revenue / maxDay) * 100) : 2}%`,
                    }}
                  />
                </div>
                <span className="bar-label">{showLabel ? day.label : ''}</span>
              </div>
            )
          })}
        </div>
        <div className="chart-footer">
          <div>
            <span>Best day</span>
            <strong>
              {money(Math.max(...report.days.map((day) => day.revenue), 0))}
            </strong>
          </div>
          <div>
            <span>Active days</span>
            <strong>
              {report.days.filter((day) => day.revenue > 0).length}
            </strong>
          </div>
          <Badge tone={report.growth >= 0 ? 'success' : 'danger'}>
            {report.growth >= 0 ? '+' : ''}
            {report.growth}% vs last month
          </Badge>
        </div>
      </Card>

      <div className="two-col">
        <Card className="card-pad">
          <CardHeader
            title="Revenue by service"
            subtitle="Where this month's money came from"
            icon="layers"
          />
          <div className="mix-list">
            {report.services.slice(0, 7).map((service) => (
              <div className="mix-row" key={service.id}>
                <div className="mix-label">
                  <strong>{service.name}</strong>
                  <span>{service.count} bookings</span>
                </div>
                <div className="mix-bar">
                  <ProgressBar value={(service.revenue / maxService) * 100} />
                </div>
                <strong className="mix-value">{money(service.revenue)}</strong>
              </div>
            ))}
            {!report.services.length && (
              <EmptyState
                icon="chart"
                title="No revenue this month"
                message="Payments collected will break down by service here."
              />
            )}
          </div>
        </Card>

        <Card className="card-pad">
          <CardHeader
            title="Collections & customers"
            subtitle="Payment mix and the month's best riders"
            icon="credit-card"
          />
          <div className="method-split">
            {report.methods.map((method) => (
              <div className="method-row" key={method.method}>
                <div className="method-label">
                  <span>{method.method}</span>
                  <strong>{money(method.amount)}</strong>
                </div>
                <ProgressBar value={(method.amount / totalMethod) * 100} />
                <span className="muted small">{method.count} payments</span>
              </div>
            ))}
          </div>
          <div className="summary-divider" />
          <div className="top-customers">
            {topCustomers.map((entry) => (
              <div className="top-customer" key={entry.customer?.id || entry.amount}>
                <Avatar name={entry.customer?.name} size="sm" />
                <div>
                  <strong>{entry.customer?.name || 'Customer'}</strong>
                  <span>{entry.jobs} paid visits</span>
                </div>
                <strong>{money(entry.amount)}</strong>
              </div>
            ))}
            {!topCustomers.length && (
              <p className="muted small">No customer activity this month.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="card-pad">
        <CardHeader
          title="Technician performance"
          subtitle="Completed jobs and revenue attributed this month"
          icon="users"
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Technician</th>
                <th>Completed jobs</th>
                <th>Revenue</th>
                <th>Share of month</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.techStats.map((tech) => (
                <tr key={tech.id}>
                  <td>
                    <div className="person-cell">
                      <Avatar name={tech.name} size="xs" />
                      <div className="cell-main">
                        <strong>{tech.name}</strong>
                        <span>{tech.skills?.[0] || 'General service'}</span>
                      </div>
                    </div>
                  </td>
                  <td>{tech.completed}</td>
                  <td>
                    <strong>{money(tech.revenue)}</strong>
                  </td>
                  <td>
                    <div className="inline-progress">
                      <ProgressBar
                        value={
                          report.revenue
                            ? (tech.revenue / report.revenue) * 100
                            : 0
                        }
                      />
                      <span>
                        {report.revenue
                          ? Math.round((tech.revenue / report.revenue) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </td>
                  <td>
                    <Badge
                      tone={
                        tech.status === 'Online'
                          ? 'success'
                          : tech.status === 'Busy'
                            ? 'warning'
                            : 'neutral'
                      }
                      dot
                    >
                      {tech.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
