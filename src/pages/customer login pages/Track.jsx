import { useMemo, useState } from 'react'
import { useStore } from '../../data/storeContext'
import { displayDate, displayDateTime, money, statusTone } from '../../data/utils'
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  ProgressBar,
} from '../../components/UI'
import { Icon } from '../../components/Icons'

const digitsOnly = (value = '') => String(value || '').replace(/\D/g, '')

const regKey = (value = '') =>
  String(value || '').trim().toUpperCase().replace(/\s+/g, '')

export default function Track() {
  const { data, customerSession, logoutCustomer } = useStore()
  const [phone, setPhone] = useState('')
  const [regNo, setRegNo] = useState('')
  const [submitted, setSubmitted] = useState({ phone: '', regNo: '' })

  const sessionDigits = customerSession ? digitsOnly(customerSession.phone) : ''
  const searched =
    sessionDigits.length > 0 ||
    Boolean(digitsOnly(submitted.phone) || regKey(submitted.regNo))

  const results = useMemo(() => {
    const phoneDigits = sessionDigits || digitsOnly(submitted.phone)
    const reg = sessionDigits ? '' : regKey(submitted.regNo)
    if (!searched) return []
    const customerIds = new Set()
    const bikeIds = new Set()
    if (phoneDigits) {
      data.customers
        .filter((customer) => digitsOnly(customer.phone) === phoneDigits)
        .forEach((customer) => customerIds.add(customer.id))
    }
    if (reg) {
      data.bikes
        .filter((bike) => regKey(bike.regNo) === reg)
        .forEach((bike) => bikeIds.add(bike.id))
    }
    const jobs = data.jobs
      .filter(
        (job) => customerIds.has(job.customerId) || bikeIds.has(job.bikeId),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    return jobs.map((job) => ({
      job,
      customer: data.customers.find((item) => item.id === job.customerId),
      bike: data.bikes.find((item) => item.id === job.bikeId),
    }))
  }, [data, searched, sessionDigits, submitted])

  const submit = (event) => {
    event.preventDefault()
    setSubmitted({ phone, regNo })
  }

  const timeline = (job) =>
    [
      { label: 'Job card created', at: job.createdAt, icon: 'clipboard-plus' },
      job.startedAt && { label: 'Work started', at: job.startedAt, icon: 'play' },
      job.completedAt && {
        label: 'Service completed',
        at: job.completedAt,
        icon: 'check-circle',
      },
      job.deliveredAt && {
        label: 'Vehicle delivered',
        at: job.deliveredAt,
        icon: 'bike',
      },
      job.paidAt && {
        label: `Payment received${job.paymentMethod ? ` · ${job.paymentMethod}` : ''}`,
        at: job.paidAt,
        icon: 'rupee',
      },
    ].filter(Boolean)

  return (
    <div className="stack-lg">
      <Card className="card-pad">
        <CardHeader
          title="Customer service tracking"
          subtitle="Check the live status of a bike service using the customer mobile number or the vehicle registration number."
          icon="search"
        />
        {customerSession ? (
          <form onSubmit={submit} noValidate>
          <div className="form-grid">
            <Field
              label="Customer mobile number"
              htmlFor="track-phone"
              className="span-2"
              hint="Enter the rider's mobile number, with or without spaces."
            >
              <Input
                id="track-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="98765 43210"
                inputMode="tel"
              />
            </Field>
            <Field
              label="Vehicle registration number"
              htmlFor="track-reg"
              className="span-2"
              hint="Enter the bike number, with or without spaces."
            >
              <Input
                id="track-reg"
                value={regNo}
                onChange={(event) => setRegNo(event.target.value.toUpperCase())}
                placeholder="KA 01 MJ 4821"
              />
            </Field>
            <div className="form-actions span-2">
              <span className="muted small">
                Check status by mobile number, vehicle number, or both.
              </span>
              <div className="form-action-buttons">
                <button type="submit" className="btn btn-primary">
                  <Icon name="search" size={15} />
                  Check status
                </button>
              </div>
            </div>
          </div>
        </form>
        ) : (
          <p className="muted small">
            Customer status tracking is not available in the admin workspace.
          </p>
        )}
      </Card>

      {customerSession && (
        <div className="job-status-strip">
          <Avatar name={customerSession.name} size="sm" />
          <div>
            <strong>{customerSession.name}</strong>
            <small>{customerSession.phone}</small>
          </div>
          <span className="strip-spacer" />
          <span className="muted small">Signed in to the customer portal</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={logoutCustomer}
          >
            <Icon name="log-out" size={14} />
            Sign out
          </button>
        </div>
      )}

      {searched && (
        <div className="stack-md">
          {results.map(({ job, customer, bike }) => {
            const technician = data.technicians.find(
              (item) => item.id === job.technicianId,
            )
            const duration = (job.services || []).reduce(
              (total, service) => total + Number(service.duration || 0),
              0,
            )
            const events = timeline(job)

            return (
              <Card key={job.id} className="card-pad">
                <div className="job-status-strip">
                  <Badge tone={statusTone(job.status)} dot>
                    {job.status}
                  </Badge>
                  <Badge tone={job.paymentStatus === 'Paid' ? 'success' : 'danger'}>
                    {job.paymentStatus}
                  </Badge>
                  <span className="strip-spacer" />
                  <span className="muted small">Job {job.jobNo}</span>
                </div>

                <div className="detail-grid">
                  <div className="detail-block">
                    <span className="detail-label">Customer</span>
                    <div className="detail-person">
                      <Avatar name={customer?.name} size="sm" />
                      <div>
                        <strong>{customer?.name || '—'}</strong>
                        <small>{customer?.phone || '—'}</small>
                      </div>
                    </div>
                  </div>
                  <div className="detail-block">
                    <span className="detail-label">Vehicle</span>
                    <strong>{bike ? `${bike.brand} ${bike.model}` : '—'}</strong>
                    <small>
                      {bike?.regNo || '—'} ·{' '}
                      {Number(bike?.odometer || 0).toLocaleString('en-IN')} km
                    </small>
                  </div>
                  <div className="detail-block">
                    <span className="detail-label">Technician</span>
                    {technician ? (
                      <div className="detail-person">
                        <Avatar name={technician.name} size="sm" />
                        <div>
                          <strong>{technician.name}</strong>
                          <small>{technician.phone}</small>
                        </div>
                      </div>
                    ) : (
                      <strong className="text-warning">Unassigned</strong>
                    )}
                  </div>
                  <div className="detail-block">
                    <span className="detail-label">Estimated time</span>
                    <strong>{duration} min</strong>
                    <small>{(job.services || []).length} service items</small>
                  </div>
                </div>

                <div className="progress-block">
                  <div className="progress-label">
                    <span>Work progress</span>
                    <strong>{job.progress || 0}%</strong>
                  </div>
                  <ProgressBar value={job.progress || 0} />
                </div>

                <div className="detail-section">
                  <div className="detail-section-head">
                    <h4>Service items</h4>
                    <span>{money(job.laborTotal)}</span>
                  </div>
                  {job.services?.length ? (
                    <div className="line-list">
                      {job.services.map((service) => (
                        <div className="line-item" key={service.id}>
                          <span className="line-dot" />
                          <div>
                            <strong>{service.name}</strong>
                            <small>{service.duration} min</small>
                          </div>
                          <span>{money(service.price)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted small">No service items recorded yet.</p>
                  )}
                </div>

                <div className="detail-section">
                  <div className="detail-section-head">
                    <h4>Timeline</h4>
                    <span className="muted small">{displayDate(job.createdAt)}</span>
                  </div>
                  <div className="timeline">
                    {events.map((event) => (
                      <div className="timeline-item" key={event.label}>
                        <span className="timeline-dot">
                          <Icon name={event.icon} size={12} />
                        </span>
                        <div>
                          <strong>{event.label}</strong>
                          <small>{displayDateTime(event.at)}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )
          })}

          {!results.length && (
            <Card className="card-pad">
              <EmptyState
                icon="search"
                title="No service found"
                message="No job matches this mobile number or vehicle number. Please check the details and try again."
              />
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
