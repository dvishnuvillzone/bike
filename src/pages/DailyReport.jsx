import { useMemo, useState } from 'react'
import { useStore } from '../data/storeContext'
import {
  jobsCompletedOn,
  jobsCreatedOn,
  paymentsOn,
  serviceStats,
  technicianStats,
} from '../data/selectors'
import {
  displayDate,
  displayDateTime,
  downloadCSV,
  isActiveJob,
  money,
  sumBy,
  todayISO,
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

const shift = (dateStr, days) => {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function DailyReport() {
  const { data } = useStore()
  const [date, setDate] = useState(todayISO())

  const report = useMemo(() => {
    const created = jobsCreatedOn(data.jobs, date)
    const completed = jobsCompletedOn(data.jobs, date)
    const paid = paymentsOn(data.jobs, date)
    const revenue = sumBy(paid, (job) => job.amount)
    const partsRevenue = sumBy(paid, (job) => job.partsTotal)
    return {
      created,
      completed,
      paid,
      revenue,
      partsRevenue,
      laborRevenue: revenue - partsRevenue,
      avgTicket: paid.length ? Math.round(revenue / paid.length) : 0,
      serviceMix: serviceStats(paid),
      techStats: technicianStats(paid, data.technicians),
    }
  }, [data.jobs, data.technicians, date])

  const maxService = Math.max(
    ...report.serviceMix.map((service) => service.revenue),
    1,
  )

  const exportReport = () => {
    const rows = [
      ['Villzone daily report', displayDate(date)],
      [],
      ['Revenue collected', report.revenue],
      ['Labour revenue', report.laborRevenue],
      ['Parts revenue', report.partsRevenue],
      ['Jobs created', report.created.length],
      ['Jobs completed', report.completed.length],
      ['Average ticket', report.avgTicket],
      [],
      ['Invoice', 'Customer', 'Method', 'Amount', 'Time'],
      ...report.paid.map((job) => {
        const customer = data.customers.find(
          (item) => item.id === job.customerId,
        )
        return [
          job.jobNo,
          customer?.name || '',
          job.paymentMethod || '',
          job.amount,
          displayDateTime(job.paidAt),
        ]
      }),
    ]
    downloadCSV(`villzone-daily-${date}.csv`, rows)
  }

  return (
    <div className="stack-lg">
      <Card className="card-pad report-toolbar">
        <div className="report-date">
          <span className="report-date-icon">
            <Icon name="calendar" size={19} />
          </span>
          <div>
            <span>Report date</span>
            <strong>{displayDate(date)}</strong>
            <small>
              {new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
                weekday: 'long',
              })}
            </small>
          </div>
        </div>
        <div className="report-controls">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setDate(shift(date, -1))}
            aria-label="Previous day"
          >
            <Icon name="chevron-left" size={18} />
          </button>
          <input
            type="date"
            className="input date-input"
            value={date}
            onChange={(event) => event.target.value && setDate(event.target.value)}
            max={todayISO()}
          />
          <button
            type="button"
            className="icon-btn"
            onClick={() => setDate(shift(date, 1))}
            aria-label="Next day"
          >
            <Icon name="chevron-right" size={18} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setDate(todayISO())}
          >
            Today
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
          hint={`${report.paid.length} payments`}
          icon="rupee"
          tone="success"
        />
        <StatCard
          label="Jobs created"
          value={report.created.length}
          hint="New job cards at the counter"
          icon="clipboard-plus"
          tone="brand"
        />
        <StatCard
          label="Jobs completed"
          value={report.completed.length}
          hint="Bikes handed back or ready"
          icon="check-circle"
          tone="info"
        />
        <StatCard
          label="Average ticket"
          value={money(report.avgTicket)}
          hint="Per paid invoice"
          icon="chart"
          tone="warning"
        />
        <StatCard
          label="Parts revenue"
          value={money(report.partsRevenue)}
          hint="Spare parts used"
          icon="package"
          tone="neutral"
        />
      </div>

      <div className="two-col">
        <Card className="card-pad">
          <CardHeader
            title="Payments collected"
            subtitle={`${report.paid.length} invoices settled on ${displayDate(date)}`}
            icon="credit-card"
            action={<span className="pill">{money(report.revenue)}</span>}
          />
          <div className="payment-list">
            {report.paid.map((job) => {
              const customer = data.customers.find(
                (item) => item.id === job.customerId,
              )
              return (
                <div className="payment-row" key={job.id}>
                  <span className="payment-icon">
                    <Icon name="rupee" size={15} />
                  </span>
                  <div className="payment-copy">
                    <strong>{customer?.name || 'Customer'}</strong>
                    <span>
                      {job.jobNo} · {job.paymentMethod || 'Paid'} ·{' '}
                      {displayDateTime(job.paidAt)}
                    </span>
                  </div>
                  <strong>{money(job.amount)}</strong>
                </div>
              )
            })}
            {!report.paid.length && (
              <EmptyState
                icon="credit-card"
                title="No payments on this day"
                message="Pick another date or collect payment from Billing."
              />
            )}
          </div>
        </Card>

        <Card className="card-pad">
          <CardHeader
            title="Service mix"
            subtitle="Revenue split by service category"
            icon="layers"
          />
          <div className="mix-list">
            {report.serviceMix.slice(0, 6).map((service) => (
              <div className="mix-row" key={service.id}>
                <div className="mix-label">
                  <strong>{service.name}</strong>
                  <span>{service.count} bookings</span>
                </div>
                <div className="mix-bar">
                  <ProgressBar
                    value={(service.revenue / maxService) * 100}
                  />
                </div>
                <strong className="mix-value">{money(service.revenue)}</strong>
              </div>
            ))}
            {!report.serviceMix.length && (
              <p className="muted small">
                Service revenue will appear after the first payment.
              </p>
            )}
          </div>
          <div className="split-strip">
            <div>
              <span>Labour</span>
              <strong>{money(report.laborRevenue)}</strong>
            </div>
            <div>
              <span>Spare parts</span>
              <strong>{money(report.partsRevenue)}</strong>
            </div>
          </div>
        </Card>
      </div>

      <Card className="card-pad">
        <CardHeader
          title="Job cards created"
          subtitle={`Work booked on ${displayDate(date)}`}
          icon="clipboard-plus"
          action={<span className="pill">{report.created.length} jobs</span>}
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Customer &amp; vehicle</th>
                <th>Services</th>
                <th>Technician</th>
                <th>Status</th>
                <th className="align-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {report.created.map((job) => {
                const customer = data.customers.find(
                  (item) => item.id === job.customerId,
                )
                const bike = data.bikes.find((item) => item.id === job.bikeId)
                const tech = data.technicians.find(
                  (item) => item.id === job.technicianId,
                )
                return (
                  <tr key={job.id}>
                    <td>
                      <span className="job-code">{job.jobNo}</span>
                    </td>
                    <td>
                      <div className="cell-main">
                        <strong>{customer?.name || '—'}</strong>
                        <span>
                          {bike
                            ? `${bike.brand} ${bike.model} · ${bike.regNo}`
                            : 'Vehicle not set'}
                        </span>
                      </div>
                    </td>
                    <td>
                      {job.services
                        ?.map((service) => service.name)
                        .join(', ') || '—'}
                    </td>
                    <td>{tech?.name || <Badge tone="warning">Unassigned</Badge>}</td>
                    <td>
                      <Badge dot>{job.status}</Badge>
                    </td>
                    <td className="align-right">{money(job.amount)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!report.created.length && (
          <EmptyState
            icon="calendar"
            title="No job cards created"
            message="This day has no new work booked at the counter."
          />
        )}
      </Card>

      <Card className="card-pad">
        <CardHeader
          title="Technician activity"
          subtitle="Completed work and collections attributed to each technician"
          icon="users"
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Technician</th>
                <th>Completed today</th>
                <th>Revenue collected</th>
                <th>Current active jobs</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {report.techStats.map((tech) => (
                <tr key={tech.id}>
                  <td>
                    <div className="person-cell">
                      <Avatar name={tech.name} size="xs" />
                      <span>{tech.name}</span>
                    </div>
                  </td>
                  <td>{tech.completed}</td>
                  <td>{money(tech.revenue)}</td>
                  <td>
                    {
                      data.jobs.filter(
                        (job) =>
                          job.technicianId === tech.id && isActiveJob(job),
                      ).length
                    }
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
