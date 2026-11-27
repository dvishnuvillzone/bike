import { useMemo, useState } from 'react'
import { useStore } from '../data/storeContext'
import { customerPaidSpend } from '../data/selectors'
import { displayDate, money, statusTone } from '../data/utils'
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  SearchBox,
  Select,
} from '../components/UI'
import { Icon } from '../components/Icons'

const CURRENT_YEAR = new Date().getFullYear()

const emptyVehicle = {
  customerId: '',
  brand: '',
  model: '',
  regNo: '',
  engineNo: '',
  chassisNo: '',
  year: '',
  color: '',
  odometer: '',
}

export default function Bikes() {
  const { data, addBike, notify } = useStore()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyVehicle)
  const [errors, setErrors] = useState({})
  const [selectedBike, setSelectedBike] = useState(null)

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const rows = useMemo(
    () =>
      data.bikes.map((bike) => {
        const customer = data.customers.find(
          (item) => item.id === bike.customerId,
        )
        const jobs = data.jobs
          .filter((job) => job.bikeId === bike.id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        return {
          ...bike,
          customer,
          jobs,
          lastJob: jobs[0],
          spend: customerPaidSpend(data.jobs, bike.customerId),
        }
      }),
    [data.bikes, data.customers, data.jobs],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return rows
    return rows.filter(
      (bike) =>
        `${bike.brand} ${bike.model}`.toLowerCase().includes(term) ||
        bike.regNo.toLowerCase().includes(term) ||
        bike.customer?.name.toLowerCase().includes(term),
    )
  }, [rows, search])

  const brands = new Set(data.bikes.map((bike) => bike.brand)).size
  const selected = rows.find((bike) => bike.id === selectedBike)

  const submit = (event) => {
    event.preventDefault()
    const next = {}
    if (!form.customerId) next.customerId = 'Choose the bike owner.'
    if (!form.brand.trim()) next.brand = 'Enter the bike brand.'
    if (!form.model.trim()) next.model = 'Enter the bike model.'
    if (!form.regNo.trim()) next.regNo = 'Enter the registration number.'
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }
    const bike = addBike(form.customerId, form)
    notify(`${bike.brand} ${bike.model} added to the workshop.`)
    setForm(emptyVehicle)
    setErrors({})
    setAddOpen(false)
  }

  return (
    <div className="stack-lg">
      <div className="stat-grid stat-grid-3">
        <div className="mini-stat">
          <span className="mini-stat-icon tone-brand">
            <Icon name="bike" size={18} />
          </span>
          <div>
            <span>Vehicles on file</span>
            <strong>{data.bikes.length}</strong>
          </div>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-icon tone-info">
            <Icon name="layers" size={18} />
          </span>
          <div>
            <span>Brands serviced</span>
            <strong>{brands}</strong>
          </div>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-icon tone-success">
            <Icon name="wrench" size={18} />
          </span>
          <div>
            <span>Jobs on vehicles</span>
            <strong>{data.jobs.length}</strong>
          </div>
        </div>
      </div>

      <Card className="card-pad">
        <CardHeader
          title="Bike management"
          subtitle={`${filtered.length} of ${rows.length} vehicles`}
          action={
            <div className="toolbar">
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="Search bike, reg no or owner…"
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setAddOpen(true)}
              >
                <Icon name="plus" size={15} />
                Add vehicle
              </button>
            </div>
          }
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Registration</th>
                <th>Owner</th>
                <th>Odometer</th>
                <th>Services</th>
                <th>Last visit</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((bike) => (
                <tr key={bike.id} onClick={() => setSelectedBike(bike.id)}>
                  <td>
                    <div className="vehicle-cell">
                      <span className="vehicle-icon sm">
                        <Icon name="bike" size={16} />
                      </span>
                      <div className="cell-main">
                        <strong>
                          {bike.brand} {bike.model}
                        </strong>
                        <span>
                          {bike.year || '—'} · {bike.color || 'Colour not set'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="reg-plate">{bike.regNo}</span>
                  </td>
                  <td>
                    <div className="person-cell">
                      <Avatar name={bike.customer?.name} size="xs" />
                      <span>{bike.customer?.name || '—'}</span>
                    </div>
                  </td>
                  <td>
                    {Number(bike.odometer || 0).toLocaleString('en-IN')} km
                  </td>
                  <td>{bike.jobs.length}</td>
                  <td>
                    {bike.lastJob ? displayDate(bike.lastJob.createdAt) : '—'}
                  </td>
                  <td>
                    <span className="row-icon">
                      <Icon name="eye" size={15} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <EmptyState
            icon="bike"
            title="No vehicles found"
            message="Try another registration number or owner name."
          />
        )}
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a vehicle"
        subtitle="Link a new bike to an existing customer."
        icon="bike"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" form="add-bike-form" className="btn btn-primary">
              <Icon name="plus" size={16} />
              Add vehicle
            </button>
          </>
        }
      >
        <form id="add-bike-form" onSubmit={submit} noValidate className="form-grid">
          <Field
            label="Owner"
            htmlFor="vehicle-owner"
            required
            error={errors.customerId}
            className="span-2"
          >
            <Select
              id="vehicle-owner"
              value={form.customerId}
              onChange={(event) => setField('customerId', event.target.value)}
              error={errors.customerId}
            >
              <option value="">Select a customer</option>
              {data.customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} · {customer.phone}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Brand" htmlFor="vehicle-brand" required error={errors.brand}>
            <Input
              id="vehicle-brand"
              value={form.brand}
              onChange={(event) => setField('brand', event.target.value)}
              placeholder="Honda"
              error={errors.brand}
            />
          </Field>
          <Field label="Model" htmlFor="vehicle-model" required error={errors.model}>
            <Input
              id="vehicle-model"
              value={form.model}
              onChange={(event) => setField('model', event.target.value)}
              placeholder="Activa 6G"
              error={errors.model}
            />
          </Field>
          <Field
            label="Registration no."
            htmlFor="vehicle-reg"
            required
            error={errors.regNo}
          >
            <Input
              id="vehicle-reg"
              value={form.regNo}
              onChange={(event) => setField('regNo', event.target.value.toUpperCase())}
              placeholder="KA 05 HR 7712"
              error={errors.regNo}
            />
          </Field>
          <Field label="Engine no." htmlFor="vehicle-engine">
            <Input
              id="vehicle-engine"
              value={form.engineNo}
              onChange={(event) =>
                setField('engineNo', event.target.value.toUpperCase())
              }
              placeholder="JF77E1234567"
            />
          </Field>
          <Field label="Chassis no." htmlFor="vehicle-chassis">
            <Input
              id="vehicle-chassis"
              value={form.chassisNo}
              onChange={(event) =>
                setField('chassisNo', event.target.value.toUpperCase())
              }
              placeholder="ME4JF77123456789"
            />
          </Field>
          <Field label="Model year" htmlFor="vehicle-year">
            <Input
              id="vehicle-year"
              type="number"
              value={form.year}
              onChange={(event) => setField('year', event.target.value)}
              placeholder={String(CURRENT_YEAR)}
            />
          </Field>
          <Field label="Colour" htmlFor="vehicle-color">
            <Input
              id="vehicle-color"
              value={form.color}
              onChange={(event) => setField('color', event.target.value)}
              placeholder="Matte Grey"
            />
          </Field>
          <Field label="Odometer (km)" htmlFor="vehicle-odometer">
            <Input
              id="vehicle-odometer"
              type="number"
              value={form.odometer}
              onChange={(event) => setField('odometer', event.target.value)}
              placeholder="12000"
            />
          </Field>
        </form>
      </Modal>

      {selected && (
        <Modal
          open
          onClose={() => setSelectedBike(null)}
          title={`${selected.brand} ${selected.model}`}
          subtitle={`${selected.regNo} · ${selected.customer?.name || 'Owner not set'}`}
          icon="bike"
          size="lg"
          footer={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedBike(null)}
            >
              Close
            </button>
          }
        >
          <div className="vehicle-hero">
            <span className="vehicle-hero-icon">
              <Icon name="bike" size={28} />
            </span>
            <div>
              <h3>
                {selected.brand} {selected.model}
              </h3>
              <span className="reg-plate">{selected.regNo}</span>
            </div>
            <div className="vehicle-hero-spend">
              <span>Owner spend</span>
              <strong>{money(selected.spend)}</strong>
            </div>
          </div>

          <div className="spec-grid">
            <div>
              <span>Model year</span>
              <strong>{selected.year || '—'}</strong>
            </div>
            <div>
              <span>Colour</span>
              <strong>{selected.color || '—'}</strong>
            </div>
            <div>
              <span>Odometer</span>
              <strong>
                {Number(selected.odometer || 0).toLocaleString('en-IN')} km
              </strong>
            </div>
            <div>
              <span>Registered</span>
              <strong>{displayDate(selected.createdAt)}</strong>
            </div>
            <div>
              <span>Engine no.</span>
              <strong>{selected.engineNo || '—'}</strong>
            </div>
            <div>
              <span>Chassis no.</span>
              <strong>{selected.chassisNo || '—'}</strong>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-head">
              <h4>Owner</h4>
            </div>
            <div className="owner-card">
              <Avatar name={selected.customer?.name} size="md" />
              <div>
                <strong>{selected.customer?.name || '—'}</strong>
                <span>{selected.customer?.phone || '—'}</span>
              </div>
              <span className="muted small">
                {selected.customer?.address || 'Address not provided'}
              </span>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-section-head">
              <h4>Service history</h4>
              <span>{selected.jobs.length} jobs</span>
            </div>
            <div className="table-wrap">
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Date</th>
                    <th>Technician</th>
                    <th>Status</th>
                    <th className="align-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.jobs.slice(0, 6).map((job) => {
                    const tech = data.technicians.find(
                      (item) => item.id === job.technicianId,
                    )
                    return (
                      <tr key={job.id}>
                        <td>
                          <span className="job-code">{job.jobNo}</span>
                        </td>
                        <td>{displayDate(job.createdAt)}</td>
                        <td>{tech?.name || '—'}</td>
                        <td>
                          <Badge tone={statusTone(job.status)}>{job.status}</Badge>
                        </td>
                        <td className="align-right">{money(job.amount)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {!selected.jobs.length && (
              <p className="muted small">No service history yet.</p>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
