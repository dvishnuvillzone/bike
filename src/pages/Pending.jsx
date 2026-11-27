import { useMemo, useState } from 'react'
import { useStore } from '../data/storeContext'
import { displayDate, isActiveJob } from '../data/utils'
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  ProgressBar,
  SearchBox,
  StatCard,
  Tabs,
} from '../components/UI'
import { Icon } from '../components/Icons'
import JobDetails from '../components/JobDetails'

export default function Pending({ navigate }) {
  const { data } = useStore()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)

  const active = useMemo(() => data.jobs.filter(isActiveJob), [data.jobs])
  const pendingCount = active.filter((job) => job.status === 'Pending').length
  const progressCount = active.filter((job) => job.status === 'In Progress').length
  const unassigned = active.filter((job) => !job.technicianId).length

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return active.filter((job) => {
      if (tab !== 'all' && job.status !== tab) return false
      if (!term) return true
      const customer = data.customers.find(
        (item) => item.id === job.customerId,
      )
      const bike = data.bikes.find((item) => item.id === job.bikeId)
      const tech = data.technicians.find(
        (item) => item.id === job.technicianId,
      )
      return (
        job.jobNo.toLowerCase().includes(term) ||
        customer?.name.toLowerCase().includes(term) ||
        bike?.regNo.toLowerCase().includes(term) ||
        tech?.name.toLowerCase().includes(term)
      )
    })
  }, [active, data, search, tab])

  return (
    <div className="stack-lg">
      <div className="stat-grid stat-grid-3">
        <StatCard
          label="Waiting to start"
          value={pendingCount}
          hint="Assigned but not begun"
          icon="clock"
          tone={pendingCount ? 'warning' : 'success'}
        />
        <StatCard
          label="In progress"
          value={progressCount}
          hint="Bikes currently on the floor"
          icon="wrench"
          tone="info"
        />
        <StatCard
          label="Unassigned"
          value={unassigned}
          hint="Need a technician"
          icon="user-check"
          tone={unassigned ? 'danger' : 'success'}
        />
      </div>

      <Card className="card-pad">
        <CardHeader
          title="Pending services"
          subtitle={`${filtered.length} job cards in this view`}
          action={
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate('new-job')}
            >
              <Icon name="plus" size={15} />
              New job card
            </button>
          }
        />
        <div className="table-toolbar">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'all', label: 'All active', count: active.length },
              { value: 'Pending', label: 'Pending', count: pendingCount },
              { value: 'In Progress', label: 'In progress', count: progressCount },
            ]}
          />
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search job, customer or reg no…"
          />
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Customer &amp; vehicle</th>
                <th>Services</th>
                <th>Technician</th>
                <th>Progress</th>
                <th>Priority</th>
                <th>Created</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => {
                const customer = data.customers.find(
                  (item) => item.id === job.customerId,
                )
                const bike = data.bikes.find((item) => item.id === job.bikeId)
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
                          {bike
                            ? `${bike.brand} ${bike.model} · ${bike.regNo}`
                            : 'Vehicle not set'}
                        </span>
                      </div>
                    </td>
                    <td>
                      {job.services
                        ?.slice(0, 2)
                        .map((service) => service.name)
                        .join(', ') || '—'}
                      {job.services?.length > 2 && (
                        <span className="muted small">
                          {' '}
                          +{job.services.length - 2}
                        </span>
                      )}
                    </td>
                    <td>
                      {tech ? (
                        <div className="person-cell">
                          <Avatar name={tech.name} size="xs" />
                          <span>{tech.name}</span>
                        </div>
                      ) : (
                        <Badge tone="warning">Unassigned</Badge>
                      )}
                    </td>
                    <td>
                      <div className="inline-progress">
                        <ProgressBar value={job.progress || 0} />
                        <span>{job.progress || 0}%</span>
                      </div>
                    </td>
                    <td>
                      <Badge
                        tone={
                          job.priority === 'High'
                            ? 'danger'
                            : job.priority === 'Low'
                              ? 'info'
                              : 'neutral'
                        }
                      >
                        {job.priority}
                      </Badge>
                    </td>
                    <td>{displayDate(job.createdAt)}</td>
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
        {!filtered.length && (
          <EmptyState
            icon="check-circle"
            title="No jobs in this view"
            message="Adjust the filters or create a new job card."
          />
        )}
      </Card>

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
