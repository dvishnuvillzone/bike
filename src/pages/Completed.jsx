import { useMemo, useState } from 'react'
import { useStore } from '../data/storeContext'
import { outstandingAmount } from '../data/selectors'
import {
  displayDate,
  isCompletedJob,
  money,
} from '../data/utils'
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  SearchBox,
  StatCard,
  Tabs,
} from '../components/UI'
import { Icon } from '../components/Icons'
import JobDetails from '../components/JobDetails'
import PaymentModal from '../components/PaymentModal'

export default function Completed({ navigate }) {
  const { data } = useStore()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [payJob, setPayJob] = useState(null)
  const [visible, setVisible] = useState(25)

  const done = useMemo(
    () =>
      data.jobs
        .filter(isCompletedJob)
        .sort(
          (a, b) =>
            new Date(b.completedAt || b.createdAt) -
            new Date(a.completedAt || a.createdAt),
        ),
    [data.jobs],
  )
  const completedCount = done.filter((job) => job.status === 'Completed').length
  const deliveredCount = done.filter((job) => job.status === 'Delivered').length
  const unpaid = done.filter((job) => job.paymentStatus !== 'Paid')
  const outstanding = outstandingAmount(data.jobs)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return done.filter((job) => {
      if (tab === 'unpaid' && job.paymentStatus === 'Paid') return false
      if (tab !== 'all' && tab !== 'unpaid' && job.status !== tab) return false
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
  }, [data, done, search, tab])

  const shown = filtered.slice(0, visible)

  return (
    <div className="stack-lg">
      <div className="stat-grid">
        <StatCard
          label="Completed jobs"
          value={done.length}
          hint={`${completedCount} awaiting delivery`}
          icon="check-circle"
          tone="success"
        />
        <StatCard
          label="Delivered"
          value={deliveredCount}
          hint="Handed back to riders"
          icon="bike"
          tone="info"
        />
        <StatCard
          label="Unpaid invoices"
          value={unpaid.length}
          hint="Ready for collection"
          icon="receipt"
          tone={unpaid.length ? 'warning' : 'success'}
        />
        <StatCard
          label="Outstanding amount"
          value={money(outstanding)}
          hint="Completed but not paid"
          icon="rupee"
          tone={outstanding ? 'danger' : 'success'}
        />
      </div>

      <Card className="card-pad">
        <CardHeader
          title="Completed services"
          subtitle="Finished work, delivery status and payment collection."
          icon="check-circle"
          action={<span className="pill">{filtered.length} in view</span>}
        />
        <div className="table-toolbar">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'all', label: 'All finished', count: done.length },
              { value: 'Completed', label: 'Completed', count: completedCount },
              { value: 'Delivered', label: 'Delivered', count: deliveredCount },
              { value: 'unpaid', label: 'Unpaid', count: unpaid.length },
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
                <th>Customer</th>
                <th>Technician</th>
                <th>Completed</th>
                <th>Status</th>
                <th className="align-right">Amount</th>
                <th>Payment</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map((job) => {
                const customer = data.customers.find(
                  (item) => item.id === job.customerId,
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
                        <span>{job.services?.length || 0} services</span>
                      </div>
                    </td>
                    <td>
                      <div className="person-cell">
                        <Avatar name={tech?.name} size="xs" />
                        <span>{tech?.name || '—'}</span>
                      </div>
                    </td>
                    <td>{displayDate(job.completedAt || job.createdAt)}</td>
                    <td>
                      <Badge dot>{job.status}</Badge>
                    </td>
                    <td className="align-right">
                      <strong>{money(job.amount)}</strong>
                    </td>
                    <td>
                      <Badge
                        tone={job.paymentStatus === 'Paid' ? 'success' : 'danger'}
                      >
                        {job.paymentStatus}
                      </Badge>
                    </td>
                    <td>
                      <div className="row-actions">
                        {job.paymentStatus !== 'Paid' ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={(event) => {
                              event.stopPropagation()
                              setPayJob(job.id)
                            }}
                          >
                            <Icon name="rupee" size={13} />
                            Collect
                          </button>
                        ) : (
                          <span className="muted small">
                            {job.paymentMethod || 'Paid'}
                          </span>
                        )}
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedJob(job.id)
                          }}
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
        {filtered.length > shown.length && (
          <div className="table-more">
            <span>
              Showing {shown.length} of {filtered.length} finished jobs
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setVisible((count) => count + 25)}
            >
              Load 25 more
            </button>
          </div>
        )}
        {!filtered.length && (
          <EmptyState
            icon="check-circle"
            title="No finished jobs here"
            message="Completed job cards will appear in this list."
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

      {payJob && <PaymentModal jobId={payJob} onClose={() => setPayJob(null)} />}
    </div>
  )
}
