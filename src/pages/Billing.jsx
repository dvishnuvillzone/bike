import { useMemo, useState } from 'react'
import { useStore } from '../data/storeContext'
import { outstandingAmount } from '../data/selectors'
import {
  displayDate,
  downloadCSV,
  isCompletedJob,
  money,
  sumBy,
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

export default function Billing({ navigate }) {
  const { data } = useStore()
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [payJob, setPayJob] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [visible, setVisible] = useState(25)

  const invoices = useMemo(
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
  const paidInvoices = invoices.filter((job) => job.paymentStatus === 'Paid')
  const unpaidInvoices = invoices.filter((job) => job.paymentStatus !== 'Paid')
  const collected = sumBy(paidInvoices, (job) => job.amount)
  const outstanding = outstandingAmount(data.jobs)
  const totalInvoiced = collected + outstanding
  const avgInvoice = invoices.length
    ? Math.round(totalInvoiced / invoices.length)
    : 0

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return invoices.filter((job) => {
      if (tab === 'paid' && job.paymentStatus !== 'Paid') return false
      if (tab === 'unpaid' && job.paymentStatus === 'Paid') return false
      if (!term) return true
      const customer = data.customers.find(
        (item) => item.id === job.customerId,
      )
      return (
        job.jobNo.toLowerCase().includes(term) ||
        customer?.name.toLowerCase().includes(term) ||
        (job.paymentMethod || '').toLowerCase().includes(term)
      )
    })
  }, [data.customers, invoices, search, tab])

  const shown = filtered.slice(0, visible)

  const exportInvoices = () => {
    const rows = [
      ['Invoice', 'Customer', 'Vehicle', 'Completed', 'Amount', 'Status', 'Method'],
      ...filtered.map((job) => {
        const customer = data.customers.find(
          (item) => item.id === job.customerId,
        )
        const bike = data.bikes.find((item) => item.id === job.bikeId)
        return [
          job.jobNo,
          customer?.name || '',
          bike ? `${bike.brand} ${bike.model} (${bike.regNo})` : '',
          displayDate(job.completedAt || job.createdAt),
          job.amount,
          job.paymentStatus,
          job.paymentMethod || '',
        ]
      }),
    ]
    downloadCSV('villzone-invoices.csv', rows)
  }

  return (
    <div className="stack-lg">
      <div className="stat-grid">
        <StatCard
          label="Collected"
          value={money(collected)}
          hint={`${paidInvoices.length} invoices settled`}
          icon="rupee"
          tone="success"
        />
        <StatCard
          label="Outstanding"
          value={money(outstanding)}
          hint={`${unpaidInvoices.length} invoices pending`}
          icon="alert"
          tone={outstanding ? 'warning' : 'success'}
        />
        <StatCard
          label="Invoices raised"
          value={invoices.length}
          hint="Completed and delivered jobs"
          icon="receipt"
          tone="info"
        />
        <StatCard
          label="Average invoice"
          value={money(avgInvoice)}
          hint="Labour plus spare parts"
          icon="chart"
          tone="brand"
        />
      </div>

      <Card className="card-pad">
        <CardHeader
          title="Billing & payments"
          subtitle="Every finished job becomes an invoice at the counter."
          icon="credit-card"
          action={
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={exportInvoices}
            >
              <Icon name="download" size={14} />
              Export CSV
            </button>
          }
        />
        <div className="table-toolbar">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'all', label: 'All invoices', count: invoices.length },
              { value: 'unpaid', label: 'Unpaid', count: unpaidInvoices.length },
              { value: 'paid', label: 'Paid', count: paidInvoices.length },
            ]}
          />
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search invoice, customer or method…"
          />
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Completed</th>
                <th>Services</th>
                <th className="align-right">Amount</th>
                <th>Payment</th>
                <th>Method</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map((job) => {
                const customer = data.customers.find(
                  (item) => item.id === job.customerId,
                )
                return (
                  <tr key={job.id} onClick={() => setSelectedJob(job.id)}>
                    <td>
                      <span className="job-code">{job.jobNo}</span>
                    </td>
                    <td>
                      <div className="person-cell">
                        <Avatar name={customer?.name} size="xs" />
                        <div className="cell-main">
                          <strong>{customer?.name || '—'}</strong>
                          <span>{customer?.phone || '—'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{displayDate(job.completedAt || job.createdAt)}</td>
                    <td>
                      {job.services
                        ?.slice(0, 2)
                        .map((service) => service.name)
                        .join(', ') || '—'}
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
                    <td>{job.paymentMethod || <span className="muted">—</span>}</td>
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
                            {displayDate(job.paidAt)}
                          </span>
                        )}
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={(event) => {
                            event.stopPropagation()
                            setSelectedJob(job.id)
                          }}
                          aria-label="View invoice"
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
              Showing {shown.length} of {filtered.length} invoices
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
            icon="receipt"
            title="No invoices in this view"
            message="Complete a job card to raise an invoice."
          />
        )}
      </Card>

      {payJob && <PaymentModal jobId={payJob} onClose={() => setPayJob(null)} />}
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
