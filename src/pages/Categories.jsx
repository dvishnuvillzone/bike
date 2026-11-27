import { useMemo, useState } from 'react'
import { useStore } from '../data/storeContext'
import { serviceStats } from '../data/selectors'
import { money } from '../data/utils'
import {
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  StatCard,
  Textarea,
} from '../components/UI'
import { Icon } from '../components/Icons'

const ICON_OPTIONS = [
  'wrench',
  'droplet',
  'disc',
  'link',
  'settings',
  'zap',
  'circle',
  'sparkles',
  'gauge',
  'activity',
  'shield',
  'package',
]

const emptyForm = {
  name: '',
  group: 'General Maintenance',
  description: '',
  price: '',
  duration: '',
  icon: 'wrench',
}

export default function Categories() {
  const { data, addCategory, updateCategory } = useStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  const usage = useMemo(() => serviceStats(data.jobs), [data.jobs])
  const usageById = new Map(usage.map((item) => [item.id, item]))
  const topService = usage[0]
  const averagePrice = data.categories.length
    ? Math.round(
        data.categories.reduce((total, category) => total + category.price, 0) /
          data.categories.length,
      )
    : 0

  const serviceGroups = useMemo(() => {
    const map = new Map()
    data.categories.forEach((category) => {
      const group = category.group || 'General Maintenance'
      map.set(group, (map.get(group) || 0) + 1)
    })
    return [...map.keys()]
  }, [data.categories])

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (category) => {
    setEditing(category)
    setForm({
      name: category.name,
      group: category.group || 'General Maintenance',
      description: category.description || '',
      price: String(category.price),
      duration: String(category.duration),
      icon: category.icon || 'wrench',
    })
    setErrors({})
    setModalOpen(true)
  }

  const submit = (event) => {
    event.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Give this service a name.'
    if (!form.group.trim()) next.group = 'Choose a service group.'
    if (!form.price || Number(form.price) <= 0)
      next.price = 'Enter a price greater than zero.'
    if (!form.duration || Number(form.duration) <= 0)
      next.duration = 'Enter an estimated duration.'
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }
    if (editing) {
      updateCategory(editing.id, form)
    } else {
      addCategory(form)
    }
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  return (
    <div className="stack-lg">
      <div className="stat-grid stat-grid-3">
        <StatCard
          label="Service menu"
          value={data.categories.length}
          hint="Active service categories"
          icon="layers"
          tone="brand"
        />
        <StatCard
          label="Average ticket"
          value={money(averagePrice)}
          hint="Before spare parts"
          icon="rupee"
          tone="success"
        />
        <StatCard
          label="Most booked"
          value={topService?.name || '—'}
          hint={topService ? `${topService.count} bookings` : 'No bookings yet'}
          icon="chart"
          tone="info"
        />
      </div>

      <Card className="card-pad">
        <CardHeader
          title="Service categories"
          subtitle="Prices and durations used when building job cards."
          icon="layers"
          action={
            <button type="button" className="btn btn-primary btn-sm" onClick={openAdd}>
              <Icon name="plus" size={15} />
              Add service
            </button>
          }
        />
        <div className="category-grid">
          {data.categories.map((category) => {
            const stats = usageById.get(category.id)
            return (
              <article className="category-card" key={category.id}>
                <div className="category-top">
                  <span className="category-icon">
                    <Icon name={category.icon || 'wrench'} size={20} />
                  </span>
                  <span className="category-price">{money(category.price)}</span>
                </div>
                <h3>{category.name}</h3>
                <p>{category.description || 'No description added.'}</p>
                <div className="category-meta">
                  <span>
                    <Icon name="clock" size={13} /> {category.duration} min
                  </span>
                  <span>
                    <Icon name="clipboard-plus" size={13} />{' '}
                    {stats?.count || 0} bookings
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm category-edit"
                  onClick={() => openEdit(category)}
                >
                  <Icon name="edit" size={14} />
                  Edit service
                </button>
              </article>
            )
          })}
        </div>
        {!data.categories.length && (
          <EmptyState
            icon="layers"
            title="No service categories"
            message="Add the services your workshop offers to start creating job cards."
          />
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit service category' : 'Add a service category'}
        subtitle={
          editing
            ? 'Changes apply to new job cards. Past invoices keep their original price.'
            : 'Set the price and time estimate riders will see.'
        }
        icon="layers"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" form="category-form" className="btn btn-primary">
              <Icon name="check" size={16} />
              {editing ? 'Save changes' : 'Add service'}
            </button>
          </>
        }
      >
        <form id="category-form" className="form-grid" onSubmit={submit} noValidate>
          <Field
            label="Service group"
            htmlFor="category-group"
            required
            error={errors.group}
            className="span-2"
          >
            <Select
              id="category-group"
              value={form.group}
              onChange={(event) => setField('group', event.target.value)}
              error={errors.group}
            >
              {serviceGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Service name"
            htmlFor="category-name"
            required
            error={errors.name}
            className="span-2"
          >
            <Input
              id="category-name"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="e.g. Brake Service"
              error={errors.name}
            />
          </Field>
          <Field label="Price (₹)" htmlFor="category-price" required error={errors.price}>
            <Input
              id="category-price"
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => setField('price', event.target.value)}
              placeholder="499"
              error={errors.price}
            />
          </Field>
          <Field
            label="Duration (minutes)"
            htmlFor="category-duration"
            required
            error={errors.duration}
          >
            <Input
              id="category-duration"
              type="number"
              min="1"
              value={form.duration}
              onChange={(event) => setField('duration', event.target.value)}
              placeholder="45"
              error={errors.duration}
            />
          </Field>
          <Field label="Icon" htmlFor="category-icon" className="span-2">
            <Select
              id="category-icon"
              value={form.icon}
              onChange={(event) => setField('icon', event.target.value)}
            >
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description" htmlFor="category-description" className="span-2">
            <Textarea
              id="category-description"
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
              placeholder="What does this service include?"
              rows={3}
            />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
