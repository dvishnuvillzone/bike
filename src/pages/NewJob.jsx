import { useMemo, useState } from 'react'
import { useStore } from '../data/storeContext'
import { findAvailableTechnician } from '../data/selectors'
import { money } from '../data/utils'
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  Field,
  Input,
  SearchBox,
  Segmented,
  Select,
  Textarea,
} from '../components/UI'
import { Icon } from '../components/Icons'

const CURRENT_YEAR = new Date().getFullYear()

const emptyCustomer = { name: '', phone: '', email: '' }
const emptyBike = {
  brand: '',
  model: '',
  regNo: '',
  engineNo: '',
  chassisNo: '',
  year: '',
  color: '',
  odometer: '',
}

const PRIORITIES = [
  { value: 'Low', label: 'Low' },
  { value: 'Normal', label: 'Normal' },
  { value: 'High', label: 'High' },
]

export default function NewJob({ navigate }) {
  const {
    data,
    createJob,
    registerCustomerVehicle,
    notify,
  } = useStore()
  const [mode, setMode] = useState('existing')
  const [customerId, setCustomerId] = useState('')
  const [bikeId, setBikeId] = useState('')
  const [newCustomer, setNewCustomer] = useState(emptyCustomer)
  const [newBike, setNewBike] = useState(emptyBike)
  const [serviceIds, setServiceIds] = useState([])
  const [priority, setPriority] = useState('Normal')
  const [notes, setNotes] = useState('')
  const [complaint, setComplaint] = useState('')
  const [serviceQuery, setServiceQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('All')
  const [customerQuery, setCustomerQuery] = useState('')
  const [technicianId, setTechnicianId] = useState('')
  const [errors, setErrors] = useState({})
  const [lastCreated, setLastCreated] = useState(null)

  const customer = data.customers.find((item) => item.id === customerId)
  const customerBikes = useMemo(
    () => data.bikes.filter((bike) => bike.customerId === customerId),
    [data.bikes, customerId],
  )
  const bike = data.bikes.find((item) => item.id === bikeId)
  const selectedServices = useMemo(
    () =>
      data.categories.filter((category) => serviceIds.includes(category.id)),
    [data.categories, serviceIds],
  )
  const laborTotal = selectedServices.reduce(
    (total, service) => total + service.price,
    0,
  )
  const duration = selectedServices.reduce(
    (total, service) => total + service.duration,
    0,
  )
  const nextTech = findAvailableTechnician(data.technicians, data.jobs)
  const selectedTech = technicianId
    ? data.technicians.find((tech) => tech.id === technicianId) || null
    : nextTech
  const onlineTechs = data.technicians.filter((tech) => tech.status === 'Online')

  const serviceGroups = useMemo(() => {
    const map = new Map()
    data.categories.forEach((category) => {
      const group = category.group || 'General Maintenance'
      if (!map.has(group)) map.set(group, [])
      map.get(group).push(category)
    })
    return [...map.entries()]
  }, [data.categories])

  const visibleServices = useMemo(() => {
    const term = serviceQuery.trim().toLowerCase()
    const inGroup =
      groupFilter === 'All'
        ? data.categories
        : data.categories.filter((category) => category.group === groupFilter)
    const filtered = inGroup.filter(
      (category) =>
        !term ||
        `${category.name} ${category.group}`.toLowerCase().includes(term),
    )
    const grouped = new Map()
    filtered.forEach((category) => {
      const group = category.group || 'General Maintenance'
      if (!grouped.has(group)) grouped.set(group, [])
      grouped.get(group).push(category)
    })
    return [...grouped.entries()]
  }, [data.categories, groupFilter, serviceQuery])

  const visibleCustomers = useMemo(() => {
    const term = customerQuery.trim().toLowerCase()
    const filtered = data.customers.filter((item) =>
      !term
        ? true
        : `${item.name} ${item.phone} ${item.email || ''} ${item.address || ''}`
            .toLowerCase()
            .includes(term),
    )
    if (customerId && !filtered.some((item) => item.id === customerId)) {
      const selected = data.customers.find((item) => item.id === customerId)
      if (selected) return [selected, ...filtered]
    }
    return filtered
  }, [data.customers, customerId, customerQuery])

  const clearError = (key) =>
    setErrors((prev) => ({ ...prev, [key]: undefined }))

  const selectCustomer = (value) => {
    setCustomerId(value)
    const bikes = data.bikes.filter((item) => item.customerId === value)
    setBikeId(bikes[0]?.id || '')
    clearError('customerId')
    clearError('bikeId')
  }

  const toggleService = (serviceId) => {
    setServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    )
    clearError('services')
  }

  const validate = () => {
    const next = {}
    if (mode === 'existing') {
      if (!customerId) next.customerId = 'Choose a customer.'
      if (!bikeId) next.bikeId = 'Choose a vehicle for this customer.'
    } else {
      if (!newCustomer.name.trim()) next.cName = 'Enter the customer name.'
      if (newCustomer.phone.replace(/\D/g, '').length !== 10)
        next.cPhone = 'Enter a 10-digit mobile number.'
      if (!newBike.brand.trim()) next.vBrand = 'Enter the bike brand.'
      if (!newBike.model.trim()) next.vModel = 'Enter the bike model.'
      if (!newBike.regNo.trim()) next.vReg = 'Enter the registration number.'
    }
    if (!serviceIds.length) next.services = 'Select at least one service.'
    return next
  }

  const submit = (event) => {
    event.preventDefault()
    const next = validate()
    if (Object.keys(next).length) {
      setErrors(next)
      notify('Please complete the highlighted details.', 'error')
      return
    }

    let activeCustomerId = customerId
    let activeBikeId = bikeId

    if (mode === 'new') {
      const created = registerCustomerVehicle({
        customer: newCustomer,
        vehicle: newBike,
      })
      activeCustomerId = created.customer.id
      activeBikeId = created.bike.id
    }

    const result = createJob({
      customerId: activeCustomerId,
      bikeId: activeBikeId,
      serviceIds,
      priority,
      notes,
      complaint,
      technicianId,
    })

    const createdCustomer = data.customers.find(
      (item) => item.id === activeCustomerId,
    )
    const createdBike = data.bikes.find((item) => item.id === activeBikeId)
    const displayCustomer =
      mode === 'new'
        ? { name: newCustomer.name }
        : createdCustomer || customer
    const displayBike =
      mode === 'new'
        ? { brand: newBike.brand, model: newBike.model, regNo: newBike.regNo }
        : createdBike || bike

    setLastCreated({
      jobNo: result.job.jobNo,
      technician: result.technician,
      customerName: displayCustomer?.name || 'Customer',
      vehicle: displayBike
        ? `${displayBike.brand} ${displayBike.model}`
        : 'Vehicle',
      amount: result.job.amount,
    })
    notify(
      result.technician
        ? `Job ${result.job.jobNo} assigned to ${result.technician.name}.`
        : `Job ${result.job.jobNo} created and waiting for a technician.`,
      result.technician ? 'success' : 'error',
    )

    setServiceIds([])
    setNotes('')
    setComplaint('')
    setTechnicianId('')
    setPriority('Normal')
    setErrors({})
    setMode('existing')
    setCustomerId(activeCustomerId)
    setBikeId(activeBikeId)
    setNewCustomer(emptyCustomer)
    setNewBike(emptyBike)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const summaryCustomerName =
    mode === 'new'
      ? newCustomer.name || 'New customer'
      : customer?.name || 'Select a customer'
  const summaryVehicle =
    mode === 'new'
      ? `${newBike.brand || 'Brand'} ${newBike.model || 'model'}`
      : bike
        ? `${bike.brand} ${bike.model}`
        : 'Select a vehicle'

  return (
    <div className="stack-lg">
      {lastCreated && (
        <div className={`alert ${lastCreated.technician ? 'alert-success' : 'alert-warning'}`}>
          <Icon name={lastCreated.technician ? 'check-circle' : 'alert'} size={18} />
          <div>
            <strong>
              Job {lastCreated.jobNo} created for {lastCreated.customerName}
            </strong>
            <span>
              {lastCreated.technician
                ? `Auto-assigned to ${lastCreated.technician.name}. Their status is now Busy.`
                : 'No online technician was free. The job is waiting in the assignment queue.'}
            </span>
          </div>
          <div className="alert-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('pending')}
            >
              View job cards
            </button>
            <button
              type="button"
              className="alert-close"
              onClick={() => setLastCreated(null)}
              aria-label="Dismiss"
            >
              <Icon name="close" size={15} />
            </button>
          </div>
        </div>
      )}

      <form className="two-col two-col-form" onSubmit={submit} noValidate>
        <div className="stack-lg">
          <Card className="card-pad">
            <CardHeader
              title="1. Customer & vehicle"
              subtitle="Pick an existing rider or register a new one on the spot."
              icon="users"
            />
            <div className="choice-cards">
              <button
                type="button"
                className={`choice-card${mode === 'existing' ? ' active' : ''}`}
                onClick={() => setMode('existing')}
              >
                <span className="choice-icon">
                  <Icon name="users" size={18} />
                </span>
                <span className="choice-copy">
                  <strong>Existing customer</strong>
                  <small>Search your customer directory</small>
                </span>
                <span className="choice-radio" />
              </button>
              <button
                type="button"
                className={`choice-card${mode === 'new' ? ' active' : ''}`}
                onClick={() => setMode('new')}
              >
                <span className="choice-icon">
                  <Icon name="plus" size={18} />
                </span>
                <span className="choice-copy">
                  <strong>Customer registration</strong>
                  <small>Register rider and vehicle</small>
                </span>
                <span className="choice-radio" />
              </button>
            </div>

            {mode === 'existing' ? (
              <div className="form-grid">
                <Field
                  label="Customer"
                  htmlFor="job-customer"
                  required
                  error={errors.customerId}
                >
                  <SearchBox
                    value={customerQuery}
                    onChange={setCustomerQuery}
                    placeholder="Search by name, mobile or email…"
                  />
                  <Select
                    id="job-customer"
                    value={customerId}
                    onChange={(event) => selectCustomer(event.target.value)}
                    error={errors.customerId}
                  >
                    <option value="">Select a customer</option>
                    {visibleCustomers.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.phone}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="Vehicle"
                  htmlFor="job-bike"
                  required
                  error={errors.bikeId}
                >
                  <Select
                    id="job-bike"
                    value={bikeId}
                    onChange={(event) => {
                      setBikeId(event.target.value)
                      clearError('bikeId')
                    }}
                    error={errors.bikeId}
                    disabled={!customerId || !customerBikes.length}
                  >
                    <option value="">
                      {customerId && !customerBikes.length
                        ? 'No vehicles on file'
                        : 'Select a vehicle'}
                    </option>
                    {customerBikes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.brand} {item.model} · {item.regNo}
                      </option>
                    ))}
                  </Select>
                </Field>
                {customerId && !customerBikes.length && (
                  <div className="alert alert-warning span-2">
                    <Icon name="alert" size={16} />
                    <div>
                      <strong>This customer has no vehicle yet</strong>
                      <span>Add a bike before creating the job card.</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate('bikes')}
                    >
                      Add vehicle
                    </button>
                  </div>
                )}
                {bike && (
                  <div className="bike-preview span-2">
                    <span className="bike-preview-icon">
                      <Icon name="bike" size={20} />
                    </span>
                    <div>
                      <strong>
                        {bike.brand} {bike.model}
                      </strong>
                      <span>
                        {bike.regNo} · {bike.year || '—'} · {bike.color || '—'}
                      </span>
                    </div>
                    <span className="bike-preview-km">
                      {Number(bike.odometer || 0).toLocaleString('en-IN')} km
                    </span>
                  </div>
                )}
                {customerId && (
                  <div className="customer-summary span-2">
                    <div className="customer-summary-head">
                      <Avatar name={customer?.name} size="sm" />
                      <div>
                        <strong>{customer?.name || 'Customer'}</strong>
                        <span>{customer?.phone || '—'}</span>
                      </div>
                    </div>
                    <div className="customer-summary-grid">
                      <div>
                        <span>Mobile</span>
                        <strong>{customer?.phone || '—'}</strong>
                      </div>
                      <div>
                        <span>Email</span>
                        <strong>{customer?.email || '—'}</strong>
                      </div>
                      <div>
                        <span>Address</span>
                        <strong>{customer?.address || '—'}</strong>
                      </div>
                      <div>
                        <span>Vehicles</span>
                        <strong>{customerBikes.length}</strong>
                      </div>
                    </div>
                    {customerBikes.length ? (
                      <div className="line-list">
                        {customerBikes.map((item) => (
                          <div className="line-item" key={item.id}>
                            <span className="line-dot" />
                            <div>
                              <strong>
                                {item.brand} {item.model}
                              </strong>
                              <small>{item.regNo}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="muted small">
                        No vehicle on file yet — add one before creating the job.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="form-grid">
                <Field label="Customer name" htmlFor="new-customer-name" required error={errors.cName}>
                  <Input
                    id="new-customer-name"
                    value={newCustomer.name}
                    onChange={(event) => {
                      setNewCustomer((prev) => ({ ...prev, name: event.target.value }))
                      clearError('cName')
                    }}
                    placeholder="e.g. Ananya Iyer"
                    error={errors.cName}
                  />
                </Field>
                <Field label="Mobile number" htmlFor="new-customer-phone" required error={errors.cPhone}>
                  <Input
                    id="new-customer-phone"
                    value={newCustomer.phone}
                    onChange={(event) => {
                      setNewCustomer((prev) => ({ ...prev, phone: event.target.value }))
                      clearError('cPhone')
                    }}
                    placeholder="99801 24680"
                    inputMode="tel"
                    error={errors.cPhone}
                  />
                </Field>
                <Field label="Email" htmlFor="new-customer-email" className="span-2">
                  <Input
                    id="new-customer-email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(event) =>
                      setNewCustomer((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder="rider@example.com"
                  />
                </Field>
                <Field label="Bike brand" htmlFor="new-bike-brand" required error={errors.vBrand}>
                  <Input
                    id="new-bike-brand"
                    value={newBike.brand}
                    onChange={(event) => {
                      setNewBike((prev) => ({ ...prev, brand: event.target.value }))
                      clearError('vBrand')
                    }}
                    placeholder="Yamaha"
                    error={errors.vBrand}
                  />
                </Field>
                <Field label="Bike model" htmlFor="new-bike-model" required error={errors.vModel}>
                  <Input
                    id="new-bike-model"
                    value={newBike.model}
                    onChange={(event) => {
                      setNewBike((prev) => ({ ...prev, model: event.target.value }))
                      clearError('vModel')
                    }}
                    placeholder="FZ-S FI"
                    error={errors.vModel}
                  />
                </Field>
                <Field label="Registration no." htmlFor="new-bike-reg" required error={errors.vReg}>
                  <Input
                    id="new-bike-reg"
                    value={newBike.regNo}
                    onChange={(event) => {
                      setNewBike((prev) => ({
                        ...prev,
                        regNo: event.target.value.toUpperCase(),
                      }))
                      clearError('vReg')
                    }}
                    placeholder="KA 03 NP 2210"
                    error={errors.vReg}
                  />
                </Field>
                <Field label="Engine no." htmlFor="new-bike-engine">
                  <Input
                    id="new-bike-engine"
                    value={newBike.engineNo}
                    onChange={(event) =>
                      setNewBike((prev) => ({
                        ...prev,
                        engineNo: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="E3N5E0123456"
                  />
                </Field>
                <Field label="Chassis no." htmlFor="new-bike-chassis">
                  <Input
                    id="new-bike-chassis"
                    value={newBike.chassisNo}
                    onChange={(event) =>
                      setNewBike((prev) => ({
                        ...prev,
                        chassisNo: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="ME1RG12345678901"
                  />
                </Field>
                <Field label="Model year" htmlFor="new-bike-year">
                  <Input
                    id="new-bike-year"
                    type="number"
                    value={newBike.year}
                    onChange={(event) =>
                      setNewBike((prev) => ({ ...prev, year: event.target.value }))
                    }
                    placeholder={String(CURRENT_YEAR)}
                  />
                </Field>
                <Field label="Colour" htmlFor="new-bike-color">
                  <Input
                    id="new-bike-color"
                    value={newBike.color}
                    onChange={(event) =>
                      setNewBike((prev) => ({ ...prev, color: event.target.value }))
                    }
                    placeholder="Racing Blue"
                  />
                </Field>
                <Field label="Odometer (km)" htmlFor="new-bike-odometer">
                  <Input
                    id="new-bike-odometer"
                    type="number"
                    value={newBike.odometer}
                    onChange={(event) =>
                      setNewBike((prev) => ({ ...prev, odometer: event.target.value }))
                    }
                    placeholder="6400"
                  />
                </Field>
              </div>
            )}
          </Card>

          <Card className="card-pad">
            <CardHeader
              title="2. Select service categories"
              subtitle="Tap the services this job needs. Prices roll into the estimate."
              icon="layers"
              action={
                <span className="pill">
                  {serviceIds.length} selected · {duration} min
                </span>
              }
            />
            <div className="service-filters">
              <div className="service-chips">
                {['All', ...serviceGroups.map(([group]) => group)].map((group) => (
                  <button
                    key={group}
                    type="button"
                    className={`chip${groupFilter === group ? ' active' : ''}`}
                    onClick={() => setGroupFilter(group)}
                  >
                    {group}
                  </button>
                ))}
              </div>
              <div className="service-search">
                <Icon name="search" size={14} />
                <input
                  value={serviceQuery}
                  onChange={(event) => setServiceQuery(event.target.value)}
                  placeholder="Search services…"
                />
              </div>
            </div>
            {visibleServices.map(([group, items]) => (
              <section key={group} className="service-group">
                <h4 className="service-group-title">{group}</h4>
                <div className="service-grid">
                  {items.map((category) => {
                    const selected = serviceIds.includes(category.id)
                    return (
                      <button
                        type="button"
                        key={category.id}
                        className={`service-option${selected ? ' selected' : ''}`}
                        onClick={() => toggleService(category.id)}
                      >
                        <span className="service-check">
                          {selected && <Icon name="check" size={11} />}
                        </span>
                        <span className="service-icon">
                          <Icon name={category.icon || 'wrench'} size={17} />
                        </span>
                        <strong>{category.name}</strong>
                        <span className="service-meta">
                          <span>{money(category.price)}</span>
                          <span>{category.duration} min</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            ))}
            {!visibleServices.length && (
              <p className="muted">No services match your search.</p>
            )}
            {errors.services && (
              <p className="field-error services-error">{errors.services}</p>
            )}
          </Card>

          <Card className="card-pad">
            <CardHeader
              title="3. Job details"
              subtitle="Set urgency and capture the rider's complaint."
              icon="clipboard-plus"
            />
            <div className="form-grid">
              <Field label="Priority" className="span-2">
                <Segmented
                  options={PRIORITIES}
                  value={priority}
                  onChange={setPriority}
                />
              </Field>
              <Field
                label="Complaint description"
                htmlFor="job-complaint"
                className="span-2"
                hint="What the rider reported. The assigned technician will see this."
              >
                <Textarea
                  id="job-complaint"
                  value={complaint}
                  onChange={(event) => setComplaint(event.target.value)}
                  placeholder="e.g. Front brake feels spongy, chain slipping at high speed…"
                  rows={3}
                />
              </Field>
              <Field
                label="Work notes"
                htmlFor="job-notes"
                className="span-2"
                hint="Optional internal notes — diagnosis, parts or handover."
              >
                <Textarea
                  id="job-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add diagnosis, parts or handover notes."
                  rows={4}
                />
              </Field>
            </div>
          </Card>
        </div>

        <div className="summary-sticky">
          <Card className="card-pad job-summary">
            <CardHeader title="Job summary" subtitle="Auto-numbered on creation" icon="receipt" />

            <div className="summary-customer">
              <Avatar name={summaryCustomerName} size="md" />
              <div>
                <strong>{summaryCustomerName}</strong>
                <span>{summaryVehicle}</span>
              </div>
              <Badge tone="neutral">{priority}</Badge>
            </div>

            <div className="summary-services">
              {selectedServices.length ? (
                selectedServices.map((service) => (
                  <div className="summary-row" key={service.id}>
                    <span>{service.name}</span>
                    <strong>{money(service.price)}</strong>
                  </div>
                ))
              ) : (
                <p className="muted small">No services selected yet.</p>
              )}
            </div>

            <div className="summary-divider" />

            <div className="summary-row">
              <span>Labour total</span>
              <strong>{money(laborTotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Spare parts</span>
              <strong>₹0</strong>
            </div>
            <div className="summary-row summary-total">
              <span>Estimated total</span>
              <strong>{money(laborTotal)}</strong>
            </div>
            <p className="muted small summary-note">
              Parts can be added by the technician once the bike is inspected.
            </p>

            <div className="summary-assign">
              <span className="summary-assign-label">Technician</span>
              <Select
                value={technicianId}
                onChange={(event) => setTechnicianId(event.target.value)}
              >
                <option value="">Auto-assign (recommended)</option>
                {onlineTechs.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} · {tech.status}
                  </option>
                ))}
              </Select>
            </div>

            <div className={`auto-assign${selectedTech ? '' : ' warn'}`}>
              <span className="auto-assign-icon">
                <Icon name={selectedTech ? 'user-check' : 'alert'} size={17} />
              </span>
              <div>
                <strong>
                  {selectedTech ? (technicianId ? 'Technician assigned' : 'Auto-assignment ready') : 'No technician online'}
                </strong>
                <span>
                  {selectedTech
                    ? technicianId
                      ? `${selectedTech.name} is assigned to this job.`
                      : `${selectedTech.name} is online with the lightest workload and will take this job.`
                    : 'The job will be created unassigned. You can assign it from the board.'}
                </span>
              </div>
              {selectedTech && <Badge tone="success" dot>Online</Badge>}
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              <Icon name="plus" size={17} />
              Create job card
            </button>
            <p className="muted small center">
              A job number is generated automatically.
            </p>
          </Card>
        </div>
      </form>
    </div>
  )
}
