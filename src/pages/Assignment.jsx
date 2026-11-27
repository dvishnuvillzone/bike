import { useMemo, useState } from 'react'
import { useStore } from '../data/storeContext'
import { activeLoad } from '../data/selectors'
import {
  dateOf,
  displayDate,
  isActiveJob,
  money,
  pluralize,
  todayISO,
} from '../data/utils'
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Modal,
  ProgressBar,
  StatCard,
  Select,
} from '../components/UI'
import { Icon } from '../components/Icons'
import JobDetails from '../components/JobDetails'

const statusOrder = { Online: 0, Busy: 1, Offline: 2 }

export default function Assignment({ navigate }) {
  const { data, reassignJob, autoAssignJob } = useStore()
  const [assignJobId, setAssignJobId] = useState(null)
  const [selectedTech, setSelectedTech] = useState('')
  const [viewJob, setViewJob] = useState(null)
  const [techFilter, setTechFilter] = useState('all')
  const [techView, setTechView] = useState('table')

  const activeJobs = useMemo(
    () => data.jobs.filter(isActiveJob),
    [data.jobs],
  )
  const unassigned = activeJobs.filter((job) => !job.technicianId)
  const assigned = activeJobs.filter((job) => job.technicianId)
  const visibleAssigned =
    techFilter === 'all'
      ? assigned
      : assigned.filter((job) => job.technicianId === techFilter)

  const groupedAssigned = useMemo(() => {
    const map = new Map()
    visibleAssigned.forEach((job) => {
      const tech = data.technicians.find((item) => item.id === job.technicianId)
      const name = tech?.name || 'Unassigned'
      if (!map.has(name)) map.set(name, [])
      map.get(name).push(job)
    })
    return [...map.entries()]
  }, [visibleAssigned, data.technicians])
  const onlineTechs = data.technicians.filter((tech) => tech.status === 'Online')
  const sortedTechs = useMemo(
    () =>
      [...data.technicians].sort(
        (a, b) => statusOrder[a.status] - statusOrder[b.status],
      ),
    [data.technicians],
  )

  const assignTarget = data.jobs.find((job) => job.id === assignJobId)
  const assignCustomer = assignTarget
    ? data.customers.find((item) => item.id === assignTarget.customerId)
    : null
  const assignBike = assignTarget
    ? data.bikes.find((item) => item.id === assignTarget.bikeId)
    : null

  const openAssign = (jobId) => {
    setAssignJobId(jobId)
    setSelectedTech('')
  }

  const confirmAssign = () => {
    if (!assignJobId || !selectedTech) return
    if (reassignJob(assignJobId, selectedTech)) {
      setAssignJobId(null)
      setSelectedTech('')
    }
  }

  return (
    <div className="stack-lg">
      <div className="stat-grid stat-grid-3">
        <StatCard
          label="Waiting for assignment"
          value={unassigned.length}
          hint={
            unassigned.length
              ? 'Riders waiting at the counter'
              : 'Every active job has an owner'
          }
          icon="user-check"
          tone={unassigned.length ? 'warning' : 'success'}
        />
        <StatCard
          label="Technicians online"
          value={onlineTechs.length}
          hint={`${data.technicians.filter((tech) => tech.status === 'Busy').length} busy right now`}
          icon="users"
          tone="info"
        />
        <StatCard
          label="Jobs on the floor"
          value={activeJobs.length}
          hint={`${assigned.length} assigned · ${unassigned.length} open`}
          icon="clipboard-plus"
          tone="brand"
        />
      </div>

      <div className="two-col">
        <Card className="card-pad">
          <CardHeader
            title="Unassigned queue"
            subtitle="Jobs that need a technician before work can start."
            icon="user-check"
            action={<span className="pill">{unassigned.length} open</span>}
          />
          <div className="queue-list">
            {unassigned.map((job) => {
              const customer = data.customers.find(
                (item) => item.id === job.customerId,
              )
              const bike = data.bikes.find((item) => item.id === job.bikeId)
              return (
                <article className="queue-card" key={job.id}>
                  <div className="queue-head">
                    <span className="job-code">{job.jobNo}</span>
                    <Badge tone={job.priority === 'High' ? 'danger' : 'neutral'}>
                      {job.priority}
                    </Badge>
                    <span className="muted small">
                      {displayDate(job.createdAt)}
                    </span>
                  </div>
                  <h4>{customer?.name || 'Customer'}</h4>
                  <p className="muted small">
                    {bike
                      ? `${bike.brand} ${bike.model} · ${bike.regNo}`
                      : 'Vehicle not set'}
                  </p>
                  <div className="chip-row">
                    {(job.services || []).map((service) => (
                      <span className="chip" key={service.id}>
                        {service.name}
                      </span>
                    ))}
                  </div>
                  {job.notes && <p className="queue-note">{job.notes}</p>}
                  <div className="queue-actions">
                    <span className="queue-total">{money(job.amount)}</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => autoAssignJob(job.id)}
                    >
                      <Icon name="zap" size={14} />
                      Auto assign
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => openAssign(job.id)}
                    >
                      <Icon name="user-check" size={14} />
                      Assign
                    </button>
                  </div>
                </article>
              )
            })}
            {!unassigned.length && (
              <EmptyState
                icon="check-circle"
                title="Nothing waiting"
                message="Every active job has a technician. New job cards are auto-assigned when someone is online."
              />
            )}
          </div>
        </Card>

        <Card className="card-pad">
          <CardHeader
            title="Availability board"
            subtitle="Live technician workload and status."
            icon="users"
            action={
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate('technicians')}
              >
                Manage team
                <Icon name="arrow-right" size={14} />
              </button>
            }
          />
          <div className="availability-list">
            {sortedTechs.map((tech) => {
              const load = activeLoad(data.jobs, tech.id)
              const todayJobs = data.jobs.filter(
                (job) =>
                  job.technicianId === tech.id &&
                  dateOf(job.createdAt) === todayISO(),
              )
              const statusCounts = {
                Pending: 0,
                'In Progress': 0,
                Completed: 0,
              }
              todayJobs.forEach((job) => {
                if (statusCounts[job.status] !== undefined) {
                  statusCounts[job.status] += 1
                }
              })
              const highPriority = todayJobs.some(
                (job) => job.priority === 'High',
              )
              const workloadPct = Math.min(100, (load / 3) * 100)

              return (
                <div className="availability-card" key={tech.id}>
                  <Avatar name={tech.name} size="md" />
                  <div className="availability-copy">
                    <strong>{tech.name}</strong>
                    <span>
                      {todayJobs.length} today · {pluralize(load, 'active job')} active
                    </span>
                    <ProgressBar
                      value={workloadPct}
                      tone={load >= 3 ? 'danger' : load ? 'warning' : 'success'}
                    />
                    {highPriority && (
                      <span className="tech-high">
                        <Icon name="alert" size={12} /> High priority
                      </span>
                    )}
                    <div className="tech-status-badges">
                      <span className="tech-status-badge">
                        Pending · {statusCounts.Pending}
                      </span>
                      <span className="tech-status-badge">
                        In Progress · {statusCounts['In Progress']}
                      </span>
                      <span className="tech-status-badge">
                        Completed · {statusCounts.Completed}
                      </span>
                    </div>
                  </div>
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
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card className="card-pad">
        <CardHeader
          title="Jobs on the floor"
          subtitle="Reassign work when a technician needs support."
          action={
            <div className="row-actions">
              <button
                type="button"
                className={`btn btn-sm ${techView === 'table' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setTechView('table')}
              >
                Table
              </button>
              <button
                type="button"
                className={`btn btn-sm ${techView === 'employee' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTechView('employee')}
              >
                Employee wise
              </button>
              <span className="pill">{visibleAssigned.length} active</span>
            </div>
          }
        />
        {techView === 'employee' ? (
          <div className="queue-list">
            {groupedAssigned.map(([techName, jobs]) => (
              <section key={techName} className="assign-group">
                <h4 className="assign-group-title">{techName}</h4>
                <div className="queue-list">
                  {jobs.map((job) => {
                    const customer = data.customers.find(
                      (item) => item.id === job.customerId,
                    )
                    const bike = data.bikes.find((item) => item.id === job.bikeId)
                    return (
                      <article className="queue-card" key={job.id}>
                        <div className="queue-head">
                          <span className="job-code">{job.jobNo}</span>
                          <Badge tone={job.priority === 'High' ? 'danger' : 'neutral'}>
                            {job.priority}
                          </Badge>
                          <span className="muted small">
                            {displayDate(job.createdAt)}
                          </span>
                        </div>
                        <h4>{customer?.name || 'Customer'}</h4>
                        <p className="muted small">
                          {bike
                            ? `${bike.brand} ${bike.model} · ${bike.regNo}`
                            : 'Vehicle not set'}
                        </p>
                        <div className="chip-row">
                          {(job.services || []).map((service) => (
                            <span className="chip" key={service.id}>
                              {service.name}
                            </span>
                          ))}
                        </div>
                        {job.notes && <p className="queue-note">{job.notes}</p>}
                        <div className="queue-actions">
                          <span className="queue-total">{money(job.amount)}</span>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => openAssign(job.id)}
                          >
                            <Icon name="zap" size={14} />
                            Auto assign
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => openAssign(job.id)}
                          >
                            <Icon name="user-check" size={14} />
                            Assign
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <>
        <div className="table-toolbar">
          <Select value={techFilter} onChange={(event) => setTechFilter(event.target.value)}>
            <option value="all">All technicians</option>
            {data.technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Customer</th>
                <th>Technician</th>
                <th>Services</th>
                <th>Progress</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {visibleAssigned.map((job) => {
                const customer = data.customers.find(
                  (item) => item.id === job.customerId,
                )
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
                        <span>{job.services?.length || 0} services</span>
                      </div>
                    </td>
                    <td>
                      <div className="person-cell">
                        <Avatar name={tech?.name} size="xs" />
                        <span>{tech?.name || '—'}</span>
                      </div>
                    </td>
                    <td>
                      {job.services
                        ?.slice(0, 2)
                        .map((service) => service.name)
                        .join(', ') || '—'}
                    </td>
                    <td>
                      <div className="inline-progress">
                        <ProgressBar value={job.progress || 0} />
                        <span>{job.progress || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <Badge dot>{job.status}</Badge>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openAssign(job.id)}
                        >
                          Reassign
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setViewJob(job.id)}
                          aria-label="View job"
                        >
                          <Icon name="eye" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!visibleAssigned.length && (
          <EmptyState
            icon="clipboard-plus"
            title="No active jobs"
            message="Create a job card to start assigning work."
          />
        )}
          </>
        )}
      </Card>

      <Modal
        open={Boolean(assignJobId)}
        onClose={() => setAssignJobId(null)}
        title={`Assign ${assignTarget?.jobNo || 'job'}`}
        subtitle={
          assignCustomer
            ? `${assignCustomer.name} · ${assignBike ? `${assignBike.brand} ${assignBike.model}` : 'Vehicle'}`
            : 'Choose an online technician.'
        }
        icon="user-check"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAssignJobId(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!selectedTech}
              onClick={confirmAssign}
            >
              <Icon name="user-check" size={16} />
              Assign job
            </button>
          </>
        }
      >
        {assignTarget && (
          <div className="assign-summary">
            <div className="summary-row">
              <span>Services</span>
              <strong>{assignTarget.services?.length || 0} items</strong>
            </div>
            <div className="summary-row">
              <span>Estimated total</span>
              <strong>{money(assignTarget.amount)}</strong>
            </div>
            <div className="summary-row">
              <span>Priority</span>
              <Badge tone={assignTarget.priority === 'High' ? 'danger' : 'neutral'}>
                {assignTarget.priority}
              </Badge>
            </div>
          </div>
        )}

        <div className="assign-tech-list">
          {data.technicians.map((tech) => {
            const load = activeLoad(data.jobs, tech.id)
            const disabled = tech.status !== 'Online'
            return (
              <button
                type="button"
                key={tech.id}
                className={`assign-tech${selectedTech === tech.id ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                onClick={() => !disabled && setSelectedTech(tech.id)}
                disabled={disabled}
              >
                <Avatar name={tech.name} size="sm" />
                <div>
                  <strong>{tech.name}</strong>
                  <span>
                    {load} active · {tech.skills?.slice(0, 2).join(', ') || 'General'}
                  </span>
                </div>
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
                <span className="assign-radio" />
              </button>
            )
          })}
        </div>
        {!onlineTechs.length && (
          <div className="alert alert-warning">
            <Icon name="alert" size={16} />
            <div>
              <strong>No technicians online</strong>
              <span>Bring a technician online from Technician Management first.</span>
            </div>
          </div>
        )}
      </Modal>

      {viewJob && (
        <JobDetails
          key={viewJob}
          jobId={viewJob}
          onClose={() => setViewJob(null)}
          onNavigate={navigate}
        />
      )}
    </div>
  )
}
