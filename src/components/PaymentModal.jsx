import { useState } from 'react'
import { useStore } from '../data/storeContext'
import { money } from '../data/utils'
import { Badge, Modal } from './UI'
import { Icon } from './Icons'

const METHODS = [
  { value: 'UPI', label: 'UPI', icon: 'zap', hint: 'GPay, PhonePe, Paytm' },
  { value: 'Cash', label: 'Cash', icon: 'rupee', hint: 'Counter collection' },
  { value: 'Card', label: 'Card', icon: 'credit-card', hint: 'Debit / credit' },
]

export default function PaymentModal({ jobId, onClose }) {
  const { data, markPaid } = useStore()
  const [method, setMethod] = useState('UPI')
  const job = data.jobs.find((item) => item.id === jobId)

  if (!job) return null

  const customer = data.customers.find((item) => item.id === job.customerId)
  const bike = data.bikes.find((item) => item.id === job.bikeId)
  const partsTotal = Number(job.partsTotal) || 0
  const laborTotal = Number(job.laborTotal) || 0

  const confirm = () => {
    markPaid(job.id, method)
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Collect payment"
      subtitle={`${job.jobNo} · ${customer?.name || 'Customer'}`}
      icon="credit-card"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={confirm}>
            <Icon name="check" size={16} />
            Record {money(job.amount)} payment
          </button>
        </>
      }
    >
      <div className="invoice-summary">
        <div className="invoice-vehicle">
          <span className="invoice-icon">
            <Icon name="receipt" size={20} />
          </span>
          <div>
            <strong>{bike ? `${bike.brand} ${bike.model}` : 'Vehicle'}</strong>
            <span>{bike?.regNo || '—'} · {job.jobNo}</span>
          </div>
          <Badge tone="warning">Unpaid</Badge>
        </div>
        <div className="summary-row">
          <span>Labour &amp; services</span>
          <strong>{money(laborTotal)}</strong>
        </div>
        <div className="summary-row">
          <span>Spare parts</span>
          <strong>{money(partsTotal)}</strong>
        </div>
        <div className="summary-row summary-total">
          <span>Amount due</span>
          <strong>{money(job.amount)}</strong>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Payment method</span>
        <div className="method-grid">
          {METHODS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`method-card${method === item.value ? ' active' : ''}`}
              onClick={() => setMethod(item.value)}
            >
              <span className="method-icon">
                <Icon name={item.icon} size={18} />
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.hint}</small>
              </span>
              {method === item.value && (
                <span className="method-check">
                  <Icon name="check" size={12} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <p className="muted small">
        Recording this payment marks the invoice as paid and adds it to today&apos;s
        revenue report.
      </p>
    </Modal>
  )
}
