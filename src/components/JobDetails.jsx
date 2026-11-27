import { useState } from 'react'
import { useStore } from '../data/storeContext'
import {
  displayDate,
  displayDateTime,
  isActiveJob,
  isCompletedJob,
  money,
  sumBy,
} from '../data/utils'
import { Avatar, Badge, Modal, ProgressBar, Select } from './UI'
import { Icon } from './Icons'
import PaymentModal from './PaymentModal'

export default function JobDetails({ jobId, onClose, onNavigate }) {
  const {
    data,
    startJob,
    completeJob,
    markDelivered,
    reassignJob,
    setJobNotes,
  } = useStore()
  const [notes, setNotes] = useState(
    () => data.jobs.find((item) => item.id === jobId)?.notes || '',
  )
  const [selectedTech, setSelectedTech] = useState('')
  const [payOpen, setPayOpen] = useState(false)

  const job = data.jobs.find((item) => item.id === jobId)
  if (!job) return null

  const customer = data.customers.find((item) => item.id === job.customerId)
  const bike = data.bikes.find((item) => item.id === job.bikeId)
  const technician = data.technicians.find(
    (item) => item.id === job.technicianId,
  )
  const onlineTechs = data.technicians.filter((tech) => tech.status === 'Online')
  const duration = sumBy(job.services || [], (service) => service.duration)
  const completed = isCompletedJob(job)
  const unpaid = job.paymentStatus !== 'Paid'

  const timeline = [
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

  const footer = (
    <>
      <button type="button" className="btn btn-secondary" onClick={onClose}>
        Close
      </button>
      {!job.technicianId && isActiveJob(job) && onNavigate && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            onClose()
            onNavigate('assignment')
          }}
        >
          <Icon name="user-check" size={15} />
          Assignment board
        </button>
      )}
      {job.status === 'Pending' && job.technicianId && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => startJob(job.id)}
        >
          <Icon name="play" size={15} />
          Start work
        </button>
      )}
      {job.status === 'In Progress' && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => completeJob(job.id)}
        >
          <Icon name="check" size={16} />
          Mark completed
        </button>
      )}
      {job.status === 'Completed' && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => markDelivered(job.id)}
        >
          <Icon name="bike" size={16} />
          Mark delivered
        </button>
      )}
      {completed && unpaid && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setPayOpen(true)}
        >
          <Icon name="rupee" size={15} />
          Collect payment
        </button>
      )}
    </>
  )

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={`Job ${job.jobNo}`}
        subtitle={`${customer?.name || 'Customer'} · ${bike ? `${bike.brand} ${bike.model}` : 'Vehicle'}`}
        icon="clipboard-plus"
        size="lg"
        footer={footer}
      >
        <div className="job-status-strip">
          <Badge tone={job.status === 'In Progress' ? 'info' : undefined} dot>
            {job.status}
          </Badge>
          <Badge tone={job.priority === 'High' ? 'danger' : 'neutral'}>
            {job.priority} priority
          </Badge>
          <Badge tone={job.paymentStatus === 'Paid' ? 'success' : 'danger'}>
            {job.paymentStatus}
          </Badge>
          <span className="strip-spacer" />
          <span className="muted small">Created {displayDateTime(job.createdAt)}</span>
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
              {bike?.regNo || '—'} · {Number(bike?.odometer || 0).toLocaleString('en-IN')} km
            </small>
            {(bike?.engineNo || bike?.chassisNo) && (
              <small>
                {bike?.engineNo ? `Engine ${bike.engineNo}` : 'Engine —'}
                {' · '}
                {bike?.chassisNo ? `Chassis ${bike.chassisNo}` : 'Chassis —'}
              </small>
            )}
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
            <small>{job.services?.length || 0} service items</small>
          </div>
        </div>

        {!job.technicianId && isActiveJob(job) && (
          <div className="assign-inline">
            <div>
              <strong>Waiting for a technician</strong>
              <span>
                {onlineTechs.length
                  ? 'Pick an online technician to put this job on the floor.'
                  : 'No technician is online right now. Bring someone online first.'}
              </span>
            </div>
            <div className="assign-controls">
              <Select
                value={selectedTech}
                onChange={(event) => setSelectedTech(event.target.value)}
                disabled={!onlineTechs.length}
              >
                <option value="">Select technician</option>
                {onlineTechs.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={!selectedTech}
                onClick={() => {
                  if (reassignJob(job.id, selectedTech)) setSelectedTech('')
                }}
              >
                Assign
              </button>
            </div>
          </div>
        )}

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
          <div className="line-list">
            {(job.services || []).map((service) => (
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
        </div>

        <div className="detail-section">
          <div className="detail-section-head">
            <h4>Spare parts used</h4>
            <span>{money(job.partsTotal)}</span>
          </div>
          {job.partsUsed?.length ? (
            <div className="line-list">
              {job.partsUsed.map((part) => (
                <div className="line-item" key={part.id}>
                  <span className="line-dot" />
                  <div>
                    <strong>{part.name}</strong>
                    <small>
                      {part.qty} × {money(part.unitPrice)}
                    </small>
                  </div>
                  <span>{money(part.qty * part.unitPrice)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted small">No spare parts have been added to this job.</p>
          )}
        </div>

        <div className="totals-box">
          <div className="summary-row">
            <span>Labour &amp; services</span>
            <strong>{money(job.laborTotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Spare parts</span>
            <strong>{money(job.partsTotal)}</strong>
          </div>
          <div className="summary-row summary-total">
            <span>Invoice total</span>
            <strong>{money(job.amount)}</strong>
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-head">
            <h4>Complaint description</h4>
            <span className="muted small">
              {job.complaint ? 'Rider reported issue' : 'Not captured'}
            </span>
          </div>
          {job.complaint ? (
            <p className="job-complaint">{job.complaint}</p>
          ) : (
            <p className="muted small">No rider complaint captured for this job.</p>
          )}
        </div>

        <div className="detail-section">
          <div className="detail-section-head">
            <h4>Work notes</h4>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setJobNotes(job.id, notes)}
            >
              Save notes
            </button>
          </div>
          <textarea
            className="textarea"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add diagnosis, parts or handover notes…"
            rows={3}
          />
        </div>

        <div className="detail-section">
          <div className="detail-section-head">
            <h4>Timeline</h4>
            <span className="muted small">{displayDate(job.createdAt)}</span>
          </div>
          <div className="timeline">
            {timeline.map((item) => (
              <div className="timeline-item" key={item.label}>
                <span className="timeline-dot">
                  <Icon name={item.icon} size={12} />
                </span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{displayDateTime(item.at)}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {payOpen && (
        <PaymentModal jobId={job.id} onClose={() => setPayOpen(false)} />
      )}
    </>
  )
}
