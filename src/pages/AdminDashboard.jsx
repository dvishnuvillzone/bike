import { useMemo, useState } from 'react'
import { useStore } from '../data/storeContext'
import {
  changePct,
  inventoryValue,
  lowStockParts,
  monthlyRevenueSeries,
  paymentSplit,
  serviceStats,
  stockStatus,
  technicianStats,
  totalRevenue,
  outstandingAmount,
} from '../data/selectors'
import {
  isCompletedJob,
  money,
  pluralize,
} from '../data/utils'
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  ProgressBar,
  SearchBox,
  Select,
  StatCard,
} from '../components/UI'
import { Icon } from '../components/Icons'

const emptyPart = {
  name: '',
  sku: '',
  category: 'General',
  stock: '',
  minStock: '',
  price: '',
  supplier: '',
}

export default function AdminDashboard() {
  const { data, addPart, restockPart, resetData } = useStore()
  const [partSearch, setPartSearch] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [restockTarget, setRestockTarget] = useState(null)
  const [restockQty, setRestockQty] = useState('10')
  const [resetConfirm, setResetConfirm] = useState(false)
  const [form, setForm] = useState(emptyPart)
  const [errors, setErrors] = useState({})

  const metrics = useMemo(() => {
    const monthly = monthlyRevenueSeries(data.jobs, 6)
    const monthRevenue = monthly[monthly.length - 1]?.revenue || 0
    const prevRevenue = monthly[monthly.length - 2]?.revenue || 0
    return {
      monthly,
      monthRevenue,
      growth: changePct(monthRevenue, prevRevenue),
      revenue: totalRevenue(data.jobs),
      outstanding: outstandingAmount(data.jobs),
      inventory: inventoryValue(data.parts),
      low: lowStockParts(data.parts),
      split: paymentSplit(data.jobs),
      completed: data.jobs.filter(isCompletedJob).length,
      services: serviceStats(data.jobs.filter((job) => job.paymentStatus === 'Paid')).slice(0, 6),
      techStats: technicianStats(data.jobs, data.technicians),
    }
  }, [data])

  const maxMonth = Math.max(...metrics.monthly.map((month) => month.revenue), 1)
  const maxService = Math.max(
    ...metrics.services.map((service) => service.revenue),
    1,
  )

  const filteredParts = useMemo(() => {
    const term = partSearch.trim().toLowerCase()
    return data.parts.filter((part) => {
      if (lowOnly && part.stock > part.minStock) return false
      if (!term) return true
      return (
        part.name.toLowerCase().includes(term) ||
        part.sku.toLowerCase().includes(term) ||
        part.category.toLowerCase().includes(term) ||
        part.supplier.toLowerCase().includes(term)
      )
    })
  }, [data.parts, lowOnly, partSearch])

  const submitPart = (event) => {
    event.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Enter the part name.'
    if (!form.sku.trim()) next.sku = 'Enter a SKU.'
    if (!form.price || Number(form.price) <= 0)
      next.price = 'Enter a unit price.'
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }
    addPart(form)
    setForm(emptyPart)
    setErrors({})
    setAddOpen(false)
  }

  const confirmRestock = () => {
    const qty = Number(restockQty)
    if (!restockTarget || !qty || qty <= 0) return
    restockPart(restockTarget.id, qty)
    setRestockTarget(null)
    setRestockQty('10')
  }

  return (
    <div className="stack-lg">
      <div className="stat-grid stat-grid-5">
        <StatCard
          label="Total revenue"
          value={money(metrics.revenue)}
          hint={`${money(metrics.split.paid)} collected all-time`}
          icon="rupee"
          tone="success"
        />
        <StatCard
          label="This month"
          value={money(metrics.monthRevenue)}
          hint="Collected in the current month"
          icon="chart"
          tone="brand"
          trend={metrics.growth}
        />
        <StatCard
          label="Outstanding"
          value={money(metrics.outstanding)}
          hint={`${money(metrics.split.unpaid)} not yet collected`}
          icon="alert"
          tone={metrics.outstanding ? 'warning' : 'success'}
        />
        <StatCard
          label="Inventory value"
          value={money(metrics.inventory)}
          hint={`${data.parts.length} SKUs on the shelf`}
          icon="package"
          tone="info"
        />
        <StatCard
          label="Jobs completed"
          value={metrics.completed}
          hint={`${data.customers.length} customers registered`}
          icon="check-circle"
          tone="neutral"
        />
      </div>

      <div className="two-col">
        <Card className="card-pad">
          <CardHeader
            title="Revenue trend"
            subtitle="Collected revenue across the last six months"
            icon="chart"
            action={<span className="pill">{money(metrics.revenue)} all-time</span>}
          />
          <div className="chart-bars">
            {metrics.monthly.map((month) => (
              <div
                className="bar-col"
                key={month.key}
                title={`${month.fullLabel}: ${money(month.revenue)}`}
              >
                <span className="bar-value">
                  {month.revenue ? money(month.revenue) : ''}
                </span>
                <div className="bar-track">
                  <div
                    className="bar"
                    style={{
                      height: `${month.revenue ? Math.max(8, (month.revenue / maxMonth) * 100) : 3}%`,
                    }}
                  />
                </div>
                <span className="bar-label">{month.label}</span>
              </div>
            ))}
          </div>
          <div className="chart-footer">
            <div>
              <span>Current month</span>
              <strong>{money(metrics.monthRevenue)}</strong>
            </div>
            <Badge tone={metrics.growth >= 0 ? 'success' : 'danger'}>
              {metrics.growth >= 0 ? '+' : ''}
              {metrics.growth}% vs last month
            </Badge>
          </div>
        </Card>

        <Card className="card-pad">
          <CardHeader
            title="Collection health"
            subtitle="Paid vs outstanding across finished invoices"
            icon="credit-card"
          />
          <div className="collection-body">
            <div
              className="donut"
              style={{
                background: `conic-gradient(var(--brand) 0 ${metrics.split.paidPct}%, #f59e0b ${metrics.split.paidPct}% 100%)`,
              }}
            >
              <div className="donut-center">
                <strong>{metrics.split.paidPct}%</strong>
                <span>collected</span>
              </div>
            </div>
            <div className="collection-legend">
              <div className="legend-row">
                <span className="legend-dot paid" />
                <div>
                  <span>Collected</span>
                  <strong>{money(metrics.split.paid)}</strong>
                </div>
              </div>
              <div className="legend-row">
                <span className="legend-dot unpaid" />
                <div>
                  <span>Outstanding</span>
                  <strong>{money(metrics.split.unpaid)}</strong>
                </div>
              </div>
              <div className="legend-row total">
                <span className="legend-dot total" />
                <div>
                  <span>Total invoiced</span>
                  <strong>{money(metrics.split.total)}</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="collection-foot">
            <Icon name="info" size={15} />
            <span>
              {metrics.split.unpaid
                ? `${money(metrics.split.unpaid)} is still sitting in unpaid invoices.`
                : 'Every finished invoice has been collected.'}
            </span>
          </div>
        </Card>
      </div>

      <Card className="card-pad">
        <CardHeader
          title="Spare parts inventory"
          subtitle={`${data.parts.length} SKUs · ${metrics.low.length} below reorder level`}
          icon="package"
          action={
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setAddOpen(true)}
            >
              <Icon name="plus" size={15} />
              Add spare part
            </button>
          }
        />
        <div className="table-toolbar">
          <div className="filter-group">
            <SearchBox
              value={partSearch}
              onChange={setPartSearch}
              placeholder="Search part, SKU or supplier…"
            />
            <button
              type="button"
              className={`filter-chip${lowOnly ? ' active' : ''}`}
              onClick={() => setLowOnly((prev) => !prev)}
            >
              <Icon name="filter" size={13} />
              Low stock only
              <span>{metrics.low.length}</span>
            </button>
          </div>
          <span className="muted small">
            Stock value {money(metrics.inventory)}
          </span>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Spare part</th>
                <th>Category</th>
                <th>In stock</th>
                <th>Reorder at</th>
                <th className="align-right">Unit price</th>
                <th className="align-right">Stock value</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {filteredParts.map((part) => {
                const status = stockStatus(part)
                const level = Math.min(
                  100,
                  Math.round((part.stock / Math.max(part.minStock * 3, 1)) * 100),
                )
                return (
                  <tr key={part.id}>
                    <td>
                      <div className="part-cell">
                        <span className="part-icon">
                          <Icon name="package" size={16} />
                        </span>
                        <div className="cell-main">
                          <strong>{part.name}</strong>
                          <span>
                            {part.sku} · {part.supplier || 'No supplier'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{part.category}</td>
                    <td>
                      <div className="stock-cell">
                        <strong>{part.stock}</strong>
                        <div className="stock-bar">
                          <ProgressBar
                            value={level}
                            tone={
                              status === 'Out of Stock'
                                ? 'danger'
                                : status === 'Low Stock'
                                  ? 'warning'
                                  : 'success'
                            }
                          />
                        </div>
                      </div>
                    </td>
                    <td>{part.minStock}</td>
                    <td className="align-right">{money(part.price)}</td>
                    <td className="align-right">
                      {money(part.stock * part.price)}
                    </td>
                    <td>
                      <Badge tone={status === 'In Stock' ? 'success' : status === 'Low Stock' ? 'warning' : 'danger'} dot>
                        {status}
                      </Badge>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setRestockTarget(part)
                          setRestockQty('10')
                        }}
                      >
                        <Icon name="plus" size={13} />
                        Restock
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!filteredParts.length && (
          <EmptyState
            icon="package"
            title="No parts match"
            message="Clear the filters or add a new spare part."
          />
        )}
      </Card>

      <div className="two-col">
        <Card className="card-pad">
          <CardHeader
            title="Top services by revenue"
            subtitle="All-time paid service value"
            icon="layers"
          />
          <div className="mix-list">
            {metrics.services.map((service) => (
              <div className="mix-row" key={service.id}>
                <div className="mix-label">
                  <strong>{service.name}</strong>
                  <span>{service.count} bookings</span>
                </div>
                <div className="mix-bar">
                  <ProgressBar value={(service.revenue / maxService) * 100} />
                </div>
                <strong className="mix-value">{money(service.revenue)}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-pad">
          <CardHeader
            title="Technician productivity"
            subtitle="All-time completed jobs and revenue"
            icon="users"
          />
          <div className="tech-performance">
            {metrics.techStats.map((tech) => (
              <div className="tech-performance-row" key={tech.id}>
                <div className="tech-performance-copy">
                  <strong>{tech.name}</strong>
                  <span>
                    {pluralize(tech.completed, 'job')} completed
                    {tech.active ? ` · ${tech.active} active` : ''}
                  </span>
                </div>
                <div className="tech-performance-bar">
                  <ProgressBar
                    value={
                      metrics.revenue ? (tech.revenue / metrics.revenue) * 100 : 0
                    }
                  />
                </div>
                <strong>{money(tech.revenue)}</strong>
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
            ))}
          </div>
        </Card>
      </div>

      <Card className="card-pad danger-zone">
        <div className="danger-copy">
          <span className="danger-icon">
            <Icon name="refresh" size={18} />
          </span>
          <div>
            <strong>Reset demo data</strong>
            <p>
              Restore the original seeded customers, job cards, technicians and
              inventory. This clears any changes saved in this browser.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-danger-soft"
          onClick={() => setResetConfirm(true)}
        >
          <Icon name="refresh" size={15} />
          Reset data
        </button>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a spare part"
        subtitle="New SKUs appear in the technician parts picker immediately."
        icon="package"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" form="add-part-form" className="btn btn-primary">
              <Icon name="plus" size={16} />
              Add to inventory
            </button>
          </>
        }
      >
        <form id="add-part-form" className="form-grid" onSubmit={submitPart} noValidate>
          <Field
            label="Part name"
            htmlFor="part-name"
            required
            error={errors.name}
            className="span-2"
          >
            <Input
              id="part-name"
              value={form.name}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, name: event.target.value }))
                setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              placeholder="e.g. Brake Pad Set (Front)"
              error={errors.name}
            />
          </Field>
          <Field label="SKU" htmlFor="part-sku" required error={errors.sku}>
            <Input
              id="part-sku"
              value={form.sku}
              onChange={(event) => {
                setForm((prev) => ({
                  ...prev,
                  sku: event.target.value.toUpperCase(),
                }))
                setErrors((prev) => ({ ...prev, sku: undefined }))
              }}
              placeholder="BP-110"
              error={errors.sku}
            />
          </Field>
          <Field label="Category" htmlFor="part-category">
            <Select
              id="part-category"
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category: event.target.value }))
              }
            >
              {['General', 'Braking', 'Engine', 'Electrical', 'Filters', 'Lubricants', 'Transmission', 'Tyres'].map(
                (category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ),
              )}
            </Select>
          </Field>
          <Field label="Opening stock" htmlFor="part-stock">
            <Input
              id="part-stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, stock: event.target.value }))
              }
              placeholder="12"
            />
          </Field>
          <Field label="Reorder level" htmlFor="part-min">
            <Input
              id="part-min"
              type="number"
              min="0"
              value={form.minStock}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, minStock: event.target.value }))
              }
              placeholder="5"
            />
          </Field>
          <Field label="Unit price (₹)" htmlFor="part-price" required error={errors.price}>
            <Input
              id="part-price"
              type="number"
              min="0"
              value={form.price}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, price: event.target.value }))
                setErrors((prev) => ({ ...prev, price: undefined }))
              }}
              placeholder="650"
              error={errors.price}
            />
          </Field>
          <Field label="Supplier" htmlFor="part-supplier">
            <Input
              id="part-supplier"
              value={form.supplier}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, supplier: event.target.value }))
              }
              placeholder="TVS Parts"
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(restockTarget)}
        onClose={() => setRestockTarget(null)}
        title={`Restock ${restockTarget?.name || 'part'}`}
        subtitle={`${restockTarget?.sku || ''} · currently ${restockTarget?.stock || 0} units`}
        icon="package"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRestockTarget(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={confirmRestock}
              disabled={!Number(restockQty) || Number(restockQty) <= 0}
            >
              <Icon name="plus" size={16} />
              Add stock
            </button>
          </>
        }
      >
        <Field label="Quantity to add" htmlFor="restock-qty" hint="Stock is added on top of the current count.">
          <Input
            id="restock-qty"
            type="number"
            min="1"
            value={restockQty}
            onChange={(event) => setRestockQty(event.target.value)}
          />
        </Field>
        <div className="restock-preview">
          <div>
            <span>Current stock</span>
            <strong>{restockTarget?.stock || 0}</strong>
          </div>
          <Icon name="arrow-right" size={16} />
          <div>
            <span>After restock</span>
            <strong>
              {(Number(restockTarget?.stock) || 0) + (Number(restockQty) || 0)}
            </strong>
          </div>
          <div>
            <span>Stock value added</span>
            <strong>
              {money((Number(restockTarget?.price) || 0) * (Number(restockQty) || 0))}
            </strong>
          </div>
        </div>
      </Modal>

      <Modal
        open={resetConfirm}
        onClose={() => setResetConfirm(false)}
        title="Reset demo data?"
        subtitle="This replaces all current workshop data with a fresh demo set."
        icon="alert"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setResetConfirm(false)}
            >
              Keep my data
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                resetData()
                setResetConfirm(false)
              }}
            >
              <Icon name="refresh" size={15} />
              Reset everything
            </button>
          </>
        }
      >
        <p className="muted">
          Customers, vehicles, job cards, payments and inventory changes made in
          this browser will be replaced. This cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
