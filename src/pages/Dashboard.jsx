import { useMemo, useState } from 'react'
import { useStore } from '../data/storeContext'
import {
  dailyRevenueSeries,
  lowStockParts,
  paymentsOn,
  revenueOn,
} from '../data/selectors'
import {
  isActiveJob,
  money,
  timeAgo,
  todayISO,
} from '../data/utils'
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  StatCard,
} from '../components/UI'
import { Icon } from '../components/Icons'
import JobDetails from '../components/JobDetails'

const HOUR = new Date().getHours()
const GREETING =
  HOUR < 12 ? 'Good morning' : HOUR < 17 ? 'Good afternoon' : 'Good evening'
const LONG_DATE = new Date().toLocaleDateString('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const activityIcon = {
  job: 'clipboard-plus',
  payment: 'rupee',
  stock: 'package',
  customer: 'users',
  tech: 'user-check',
}

export default function Dashboard({ navigate }) {
  const { data } = useStore()
  const [selectedJob, setSelectedJob] = useState(null)
  const today = todayISO()

  const metrics = useMemo(() => {
    const active = data.jobs.filter(isActiveJob)
    const pending = active.filter((job) => job.status === 'Pending')
    const online = data.technicians.filter((tech) => tech.status === 'Online')
    const busy = data.technicians.filter((tech) => tech.status === 'Busy')
    const paidToday = paymentsOn(data.jobs, today)
    const unassigned = active.filter((job) => !job.technicianId)
    return {
      active,
      pending,
      online,
      busy,
      paidToday,
      unassigned,
      revenueToday: revenueOn(data.jobs, today),
      lowStock: lowStockParts(data.parts),
    }
  }, [data, today])

  const week = useMemo(() => dailyRevenueSeries(data.jobs, 7), [data.jobs])
  const weekTotal = week.reduce((total, day) => total + day.revenue, 0)
  const weekMax = Math.max(...week.map((day) => day.revenue), 1)
  const recentJobs = useMemo(
    () =>
      [...data.jobs]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6),
    [data.jobs],
  )
  const recentActivity = useMemo(
    () => [...(data.activity || [])].slice(0, 5),
    [data.activity],
  )
  const greeting = GREETING
  const longDate = LONG_DATE

  return (
    <div className="stack-lg">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-eyebrow">
            <span className="live-dot" />
            {longDate} · Workshop open
          </span>
          <h2>{greeting}, Admin.</h2>
          <p>
            {metrics.active.length} jobs are on the floor and{' '}
            {metrics.online.length} technicians are ready to take work.
            {metrics.unassigned.length
              ? ` ${metrics.unassigned.length} job is waiting for an available technician.`
              : ' Every active job has an owner.'}
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-light"
              onClick={() => navigate('new-job')}
            >
              <Icon name="plus" size={16} />
              Create job card
            </button>
            <button
              type="button"
              className="btn btn-ghost-light"
              onClick={() => navigate('daily-report')}
            >
              <Icon name="calendar" size={16} />
              Today&apos;s report
            </button>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-metric">
            <span>Collected today</span>
            <strong>{money(metrics.revenueToday)}</strong>
            <small>{metrics.paidToday.length} invoices settled</small>
          </div>
          <div className="hero-divider" />
          <div className="hero-metric">
            <span>On the floor</span>
            <strong>{metrics.active.length}</strong>
            <small>{metrics.busy.length} technicians busy</small>
          </div>
          <span className="hero-glow" />
        </div>
      </section>

      <div className="stat-grid">
        <StatCard
          label="Active jobs"
          value={metrics.active.length}
          hint={`${metrics.pending.length} waiting to start`}
          icon="clipboard-plus"
          tone="brand"
        />
        <StatCard
          label="Technicians online"
          value={`${metrics.online.length} / ${data.technicians.length}`}
          hint={`${metrics.busy.length} busy on jobs`}
          icon="users"
          tone="info"
        />
        <StatCard
          label="Collected today"
          value={money(metrics.revenueToday)}
          hint={`${metrics.paidToday.length} payments received`}
          icon="rupee"
          tone="success"
        />
        <StatCard
          label="Low stock parts"
          value={metrics.lowStock.length}
          hint={
            metrics.lowStock.length
              ? 'Reorder before they run out'
              : 'Inventory levels are healthy'
          }
          icon="package"
          tone={metrics.lowStock.length ? 'warning' : 'success'}
        />
      </div>

      <div className="two-col">
        <Card className="card-pad">
          <CardHeader
            title="Revenue pulse"
            subtitle="Payments collected over the last 7 days"
            action={
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('reports')}
              >
                Monthly report
                <Icon name="arrow-right" size={14} />
              </button>
            }
          />
          <div className="chart-bars">
            {week.map((day) => (
              <div className="bar-col" key={day.key} title={`${day.fullLabel}: ${money(day.revenue)}`}>
                <span className="bar-value">
                  {day.revenue ? money(day.revenue) : ''}
                </span>
                <div className="bar-track">
                  <div
                    className="bar"
                    style={{
                      height: `${day.revenue ? Math.max(8, (day.revenue / weekMax) * 100) : 3}%`,
                    }}
                  />
                </div>
                <span className="bar-label">{day.label}</span>
              </div>
            ))}
          </div>
          <div className="chart-footer">
            <div>
              <span>7-day total</span>
              <strong>{money(weekTotal)}</strong>
            </div>
            <Badge tone="success" dot>
              Live collections
            </Badge>
          </div>
        </Card>

        <Card className="card-pad">
          <CardHeader
            title="Technician status"
            subtitle={`${metrics.online.length} online · ${metrics.busy.length} busy`}
            action={
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('technicians')}
              >
                Manage
                <Icon name="arrow-right" size={14} />
              </button>
            }
          />
          <div className="tech-status-list">
            {data.technicians.map((tech) => {
              const currentJob = metrics.active.find(
                (job) => job.technicianId === tech.id,
              )
              const customer = currentJob
                ? data.customers.find(
                    (item) => item.id === currentJob.customerId,
                  )
                : null
              return (
                <button
                  type="button"
                  className="tech-status-row"
                  key={tech.id}
                  onClick={() => navigate('technicians')}
                >
                  <Avatar name={tech.name} size="sm" />
                  <div className="tech-status-copy">
                    <strong>{tech.name}</strong>
                    <span>
                      {currentJob
                        ? `${currentJob.jobNo} · ${customer?.name || 'Customer'}`
                        : tech.skills?.[0] || 'No active job'}
                    </span>
                  </div>
                  <Badge tone={tech.status === 'Online' ? 'success' : tech.status === 'Busy' ? 'warning' : 'neutral'} dot>
                    {tech.status}
                  </Badge>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="two-col two-col-wide">
        <Card className="card-pad">
          <CardHeader
            title="Recent job cards"
            subtitle="Newest work from the front desk"
            action={
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('pending')}
              >
                View all
                <Icon name="arrow-right" size={14} />
              </button>
            }
          />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Customer</th>
                  <th>Technician</th>
                  <th>Status</th>
                  <th className="align-right">Amount</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => {
                  const customer = data.customers.find(
                    (item) => item.id === job.customerId,
                  )
                  const bike = data.bikes.find(
                    (item) => item.id === job.bikeId,
                  )
                  const tech = data.technicians.find(
                    (item) => item.id === job.technicianId,
                  )
                  return (
                    <tr key={job.id} onClick={() => setSelectedJob(job.id)}>
                      <td>
                        <span className="job-code">{job.jobNo}</span>
                      </td>
                      <td>
                        <div className="cell-main">
                          <strong>{customer?.name || '—'}</strong>
                          <span>
                            {bike ? `${bike.brand} ${bike.model}` : '—'}
                          </span>
                        </div>
                      </td>
                      <td>{tech?.name || <span className="muted">Unassigned</span>}</td>
                      <td>
                        <Badge dot>{job.status}</Badge>
                      </td>
                      <td className="align-right">
                        <strong>{money(job.amount)}</strong>
                      </td>
                      <td>
                        <span className="row-icon">
                          <Icon name="eye" size={15} />
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!recentJobs.length && (
            <EmptyState
              icon="clipboard-plus"
              title="No job cards yet"
              message="Create your first job card to get the workshop moving."
            />
          )}
        </Card>

        <div className="stack-md">
          <Card className="card-pad">
            <CardHeader
              title="Needs attention"
              subtitle="Items that need a decision today"
              icon="alert"
            />
            <div className="attention-list">
              {metrics.unassigned.map((job) => {
                const customer = data.customers.find(
                  (item) => item.id === job.customerId,
                )
                return (
                  <button
                    type="button"
                    className="attention-item"
                    key={job.id}
                    onClick={() => navigate('assignment')}
                  >
                    <span className="attention-icon tone-warning">
                      <Icon name="user-check" size={16} />
                    </span>
                    <div>
                      <strong>{job.jobNo} needs a technician</strong>
                      <span>{customer?.name || 'Customer'} is waiting</span>
                    </div>
                    <Icon name="chevron-right" size={16} />
                  </button>
                )
              })}
              {metrics.lowStock.slice(0, 3).map((part) => (
                <button
                  type="button"
                  className="attention-item"
                  key={part.id}
                  onClick={() => navigate('admin')}
                >
                  <span className="attention-icon tone-danger">
                    <Icon name="package" size={16} />
                  </span>
                  <div>
                    <strong>{part.name} is low</strong>
                    <span>
                      {part.stock} left · reorder at {part.minStock}
                    </span>
                  </div>
                  <Icon name="chevron-right" size={16} />
                </button>
              ))}
              {!metrics.unassigned.length && !metrics.lowStock.length && (
                <p className="muted small">
                  Nothing needs attention. The floor is running clean.
                </p>
              )}
            </div>
          </Card>

          <Card className="card-pad">
            <CardHeader title="Recent activity" subtitle="Live workshop log" />
            <div className="activity-list">
              {recentActivity.map((entry) => (
                <div className="activity-item" key={entry.id}>
                  <span className={`activity-icon type-${entry.type}`}>
                    <Icon name={activityIcon[entry.type] || 'activity'} size={14} />
                  </span>
                  <div>
                    <p>{entry.message}</p>
                    <small>{timeAgo(entry.at)}</small>
                  </div>
                </div>
              ))}
              {!recentActivity.length && (
                <p className="muted small">Activity will appear here.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {selectedJob && (
        <JobDetails
          key={selectedJob}
          jobId={selectedJob}
          onClose={() => setSelectedJob(null)}
          onNavigate={navigate}
        />
      )}
    </div>
  )
}
