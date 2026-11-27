import { useMemo, useState } from 'react'
import { useStore } from '../data/storeContext'
import { activeLoad } from '../data/selectors'
import {
  dateOf,
  displayDateTime,
  isActiveJob,
  money,
  pluralize,
  todayISO,
} from '../data/utils'
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  ProgressBar,
  Select,
  StatCard,
} from '../components/UI'
import { Icon } from '../components/Icons'

const emptyTechForm = {
  name: '',
  mobile: '',
  altMobile: '',
  email: '',
  address: '',
  joiningDate: '',
  gender: '',
  category: '',
  skills: [],
  experience: '',
  qualification: '',
  techType: 'Junior',
  salaryType: 'Monthly',
  salaryAmount: '',
  shift: '',
  supervisorId: '',
  username: '',
  password: '',
  confirmPassword: '',
  loginAccess: 'Enabled',
  registrationStatus: 'Active',
  aadhaarRef: '',
  dlNumber: '',
  expCertificate: '',
  resumeRef: '',
}

function TechTaskCard({ job }) {
  const {
    data,
    startJob,
    completeJob,
    setJobNotes,
    setJobProgress,
    addPartToJob,
  } = useStore()
  const [notes, setNotes] = useState(job.notes || '')
  const [partId, setPartId] = useState('')
  const [qty, setQty] = useState(1)

  const customer = data.customers.find((item) => item.id === job.customerId)
  const bike = data.bikes.find((item) => item.id === job.bikeId)
  const availableParts = data.parts.filter((part) => part.stock > 0)
  const selectedPart = data.parts.find((part) => part.id === partId)

  return (
    <article className="task-card">
      <div className="task-head">
        <div>
          <div className="task-head-top">
            <span className="job-code">{job.jobNo}</span>
            <Badge dot>{job.status}</Badge>
            <Badge tone={job.priority === 'High' ? 'danger' : 'neutral'}>
              {job.priority}
            </Badge>
          </div>
          <h4>{customer?.name || 'Customer'}</h4>
          <span className="muted small">
            {bike
              ? `${bike.brand} ${bike.model} · ${bike.regNo}`
              : 'Vehicle not set'}
          </span>
        </div>
        <div className="task-amount">
          <span>Invoice</span>
          <strong>{money(job.amount)}</strong>
        </div>
      </div>

      <div className="chip-row">
        {(job.services || []).map((service) => (
          <span className="chip" key={service.id}>
            {service.name}
          </span>
        ))}
      </div>

      <div className="task-progress">
        <div className="progress-label">
          <span>Task progress</span>
          <strong>{job.progress || 0}%</strong>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={job.progress || 0}
          className="range"
          onChange={(event) => setJobProgress(job.id, Number(event.target.value))}
          aria-label={`Progress for ${job.jobNo}`}
        />
        <div className="quick-progress">
          {[25, 50, 75, 100].map((value) => (
            <button
              type="button"
              key={value}
              className="btn btn-ghost btn-sm"
              onClick={() => setJobProgress(job.id, value)}
            >
              {value}%
            </button>
          ))}
        </div>
      </div>

      <div className="task-grid">
        <div className="task-notes">
          <div className="task-block-head">
            <span>Work notes</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setJobNotes(job.id, notes)}
            >
              Save
            </button>
          </div>
          <textarea
            className="textarea"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Log diagnosis, parts replaced or handover notes…"
          />
        </div>

        <div className="task-parts">
          <div className="task-block-head">
            <span>Spare parts</span>
            <span className="muted small">{money(job.partsTotal)}</span>
          </div>
          <div className="task-parts-list">
            {job.partsUsed?.length ? (
              job.partsUsed.map((part) => (
                <div className="part-line" key={part.id}>
                  <span>{part.name}</span>
                  <small>
                    {part.qty} × {money(part.unitPrice)}
                  </small>
                  <strong>{money(part.qty * part.unitPrice)}</strong>
                </div>
              ))
            ) : (
              <p className="muted small">No parts used yet.</p>
            )}
          </div>
          <div className="part-add">
            <Select
              value={partId}
              onChange={(event) => setPartId(event.target.value)}
              aria-label="Select spare part"
            >
              <option value="">Add a part…</option>
              {availableParts.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.name} · {part.stock} in stock
                </option>
              ))}
            </Select>
            <Input
              type="number"
              min="1"
              max={selectedPart?.stock || 1}
              value={qty}
              onChange={(event) => setQty(event.target.value)}
              aria-label="Quantity"
              className="qty-input"
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={!partId}
              onClick={() => {
                if (addPartToJob(job.id, partId, Number(qty) || 1)) {
                  setPartId('')
                  setQty(1)
                }
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="task-actions">
        {job.status === 'Pending' && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => startJob(job.id)}
          >
            <Icon name="play" size={14} />
            Start work
          </button>
        )}
        {job.status === 'In Progress' && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => completeJob(job.id)}
          >
            <Icon name="check" size={15} />
            Complete job
          </button>
        )}
        <span className="muted small">
          Created {displayDateTime(job.createdAt)}
        </span>
      </div>
    </article>
  )
}

export default function Technicians() {
  const { data, addTechnician, updateTechnician } = useStore()
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyTechForm)
  const [errors, setErrors] = useState({})
  const [workspaceId, setWorkspaceId] = useState(null)
  const today = todayISO()

  const online = data.technicians.filter((tech) => tech.status === 'Online')
  const busy = data.technicians.filter((tech) => tech.status === 'Busy')
  const offline = data.technicians.filter((tech) => tech.status === 'Offline')
  const activeJobs = data.jobs.filter(isActiveJob)

  const workspaceTech = data.technicians.find(
    (tech) => tech.id === workspaceId,
  )
  const workspaceJobs = useMemo(
    () =>
      data.jobs.filter(
        (job) => job.technicianId === workspaceId && isActiveJob(job),
      ),
    [data.jobs, workspaceId],
  )
  const completedToday = useMemo(
    () =>
      data.jobs.filter(
        (job) =>
          job.technicianId === workspaceId &&
          job.completedAt &&
          dateOf(job.completedAt) === today,
      ),
    [data.jobs, workspaceId, today],
  )

  const clearForm = () => {
    setForm(emptyTechForm)
    setErrors({})
  }

  const toggleSkill = (skillName) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skillName)
        ? prev.skills.filter((skill) => skill !== skillName)
        : [...prev.skills, skillName],
    }))
  }

  const handleSave = (closeAfter) => {
    const next = {}
    if (!form.name.trim()) next.name = 'Enter the technician name.'
    if (!form.mobile.trim() || form.mobile.replace(/\D/g, '').length !== 10)
      next.mobile = 'Enter a valid 10-digit mobile number.'
    if (!form.category.trim()) next.category = 'Choose the technician category.'
    if (!form.skills.length) next.skills = 'Select at least one service skill.'
    if (!form.joiningDate) next.joiningDate = 'Enter the joining date.'
    if (!form.username.trim()) next.username = 'Enter the login username.'
    if (!form.password) next.password = 'Set a password for the login account.'
    if (form.confirmPassword !== form.password)
      next.confirmPassword = 'Passwords do not match.'
    const duplicateUser = (data.users || []).some(
      (user) => user.username === form.username.trim().toLowerCase(),
    )
    if (duplicateUser) next.username = 'That username is already taken.'
    if (Object.keys(next).length) {
      setErrors(next)
      return false
    }

    addTechnician({
      name: form.name,
      mobile: form.mobile,
      category: form.category,
      skills: form.skills,
      experience: form.experience,
      qualification: form.qualification,
      techType: form.techType,
      salaryType: form.salaryType,
      salaryAmount: form.salaryAmount,
      shift: form.shift,
      supervisorId: form.supervisorId,
      joiningDate: form.joiningDate,
      gender: form.gender,
      username: form.username,
      password: form.password,
      loginAccess: form.loginAccess,
      registrationStatus: form.registrationStatus,
    })

    setForm(emptyTechForm)
    setErrors({})
    if (closeAfter) setAddOpen(false)
    return true
  }

  const submit = (event) => {
    event.preventDefault()
    handleSave(true)
  }

  return (
    <div className="stack-lg">
      <div className="stat-grid">
        <StatCard
          label="Online"
          value={online.length}
          hint="Ready for auto-assignment"
          icon="user-check"
          tone="success"
        />
        <StatCard
          label="Busy"
          value={busy.length}
          hint="Working on active jobs"
          icon="wrench"
          tone="warning"
        />
        <StatCard
          label="Offline"
          value={offline.length}
          hint="Not on the floor today"
          icon="user"
          tone="neutral"
        />
        <StatCard
          label="Active tasks"
          value={activeJobs.length}
          hint={`${data.technicians.length} technicians on the team`}
          icon="clipboard-plus"
          tone="info"
        />
      </div>

      <Card className="card-pad">
        <CardHeader
          title="Technician team"
          subtitle="Set availability, open a workspace and update live tasks."
          icon="users"
          action={
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setAddOpen(true)}
            >
              <Icon name="plus" size={15} />
              Add technician
            </button>
          }
        />
        <div className="tech-grid">
          {data.technicians.map((tech) => {
            const load = activeLoad(data.jobs, tech.id)
            const currentJob = activeJobs.find(
              (job) => job.technicianId === tech.id,
            )
            const currentCustomer = currentJob
              ? data.customers.find(
                  (item) => item.id === currentJob.customerId,
                )
              : null
            return (
              <article className="tech-card" key={tech.id}>
                <div className="tech-head">
                  <Avatar name={tech.name} size="lg" />
                  <div className="tech-copy">
                    <strong>{tech.name}</strong>
                    <span>{tech.phone || 'No phone on file'}</span>
                  </div>
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

                <div className="chip-row">
                  {(tech.skills || []).slice(0, 3).map((skill) => (
                    <span className="chip" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="tech-metrics">
                  <div>
                    <strong>{load}</strong>
                    <span>Active jobs</span>
                  </div>
                  <div>
                    <strong>{tech.completedJobs || 0}</strong>
                    <span>Completed</span>
                  </div>
                  <div>
                    <strong>{Math.min(100, Math.round((load / 3) * 100))}%</strong>
                    <span>Capacity</span>
                  </div>
                </div>

                <div className="tech-current">
                  {currentJob ? (
                    <>
                      <span className="job-code">{currentJob.jobNo}</span>
                      <span>{currentCustomer?.name || 'Customer'}</span>
                      <Badge tone="info">{currentJob.status}</Badge>
                    </>
                  ) : (
                    <span className="muted small">
                      {tech.status === 'Offline'
                        ? 'Off the floor'
                        : 'No active job — ready for work'}
                    </span>
                  )}
                </div>

                <div className="tech-actions">
                  <Select
                    className={`status-select status-${tech.status.toLowerCase()}`}
                    value={tech.status}
                    onChange={(event) =>
                      updateTechnician(tech.id, { status: event.target.value })
                    }
                    aria-label={`Set status for ${tech.name}`}
                  >
                    <option value="Online">Online</option>
                    <option value="Busy">Busy</option>
                    <option value="Offline">Offline</option>
                  </Select>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setWorkspaceId(tech.id)}
                  >
                    <Icon name="wrench" size={14} />
                    Workspace
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Register technician"
        subtitle="Personal, professional, skill and login details for the new team member."
        icon="users"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearForm}>
              Clear Form
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleSave(false)}
            >
              Save & Add Another
            </button>
            <button type="submit" form="add-tech-form" className="btn btn-primary">
              <Icon name="plus" size={16} />
              Save Technician
            </button>
          </>
        }
      >
        <form id="add-tech-form" className="form-grid" onSubmit={submit} noValidate>
          <h4 className="form-section">Personal details</h4>
          <Field label="Technician ID" htmlFor="tech-id" className="span-2">
            <Input id="tech-id" value="TECH-001" disabled />
          </Field>
          <Field label="Full name" htmlFor="tech-name" required error={errors.name}>
            <Input
              id="tech-name"
              value={form.name}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, name: event.target.value }))
                setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              placeholder="e.g. Imran Sheikh"
              error={errors.name}
            />
          </Field>
          <Field label="Mobile number" htmlFor="tech-mobile" required error={errors.mobile}>
            <Input
              id="tech-mobile"
              value={form.mobile}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, mobile: event.target.value }))
                setErrors((prev) => ({ ...prev, mobile: undefined }))
              }}
              placeholder="95351 20934"
              inputMode="tel"
              error={errors.mobile}
            />
          </Field>
          <Field label="Alternate mobile number" htmlFor="tech-alt-mobile" className="span-2">
            <Input
              id="tech-alt-mobile"
              value={form.altMobile}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, altMobile: event.target.value }))
              }}
              placeholder="Optional"
              inputMode="tel"
            />
          </Field>
          <Field label="Email ID" htmlFor="tech-email" className="span-2">
            <Input
              id="tech-email"
              value={form.email}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }}
              placeholder="Optional"
              type="email"
            />
          </Field>
          <Field label="Address" htmlFor="tech-address" className="span-2">
            <Input
              id="tech-address"
              value={form.address}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, address: event.target.value }))
              }}
              placeholder="Workshop address"
            />
          </Field>
          <Field label="Date of joining" htmlFor="tech-joining" required error={errors.joiningDate}>
            <Input
              id="tech-joining"
              type="date"
              value={form.joiningDate}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, joiningDate: event.target.value }))
                setErrors((prev) => ({ ...prev, joiningDate: undefined }))
              }}
              error={errors.joiningDate}
            />
          </Field>
          <Field label="Gender" htmlFor="tech-gender" className="span-2">
            <Select
              id="tech-gender"
              value={form.gender}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, gender: event.target.value }))
              }}
            >
              <option value="">Prefer not to say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
          </Field>

          <h4 className="form-section">Professional details</h4>
          <Field label="Technician category" htmlFor="tech-category" required error={errors.category} className="span-2">
            <Input
              id="tech-category"
              value={form.category}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, category: event.target.value }))
                setErrors((prev) => ({ ...prev, category: undefined }))
              }}
              placeholder="e.g. Mechanic"
              error={errors.category}
            />
          </Field>
          <Field
            label="Technician skills"
            htmlFor="tech-skills"
            className="span-2"
            error={errors.skills}
          >
            <div className="tech-skills">
              {data.categories.map((category) => (
                <label key={category.id} className="tech-skill">
                  <input
                    type="checkbox"
                    checked={form.skills.includes(category.name)}
                    onChange={() => toggleSkill(category.name)}
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
            {errors.skills && <span className="field-error">{errors.skills}</span>}
          </Field>
          <Field label="Experience (years)" htmlFor="tech-experience" className="span-2">
            <Input
              id="tech-experience"
              type="number"
              min="0"
              value={form.experience}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, experience: event.target.value }))
              }}
              placeholder="e.g. 5"
            />
          </Field>
          <Field label="Qualification" htmlFor="tech-qualification" className="span-2">
            <Input
              id="tech-qualification"
              value={form.qualification}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, qualification: event.target.value }))
              }}
              placeholder="Optional"
            />
          </Field>
          <Field label="Technician type" htmlFor="tech-type" className="span-2">
            <Select
              id="tech-type"
              value={form.techType}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, techType: event.target.value }))
              }}
            >
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Specialist">Specialist</option>
            </Select>
          </Field>
          <Field label="Salary type" htmlFor="tech-salary-type" className="span-2">
            <Select
              id="tech-salary-type"
              value={form.salaryType}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, salaryType: event.target.value }))
              }}
            >
              <option value="Monthly">Monthly</option>
              <option value="Daily">Daily</option>
              <option value="Per Service">Per Service</option>
            </Select>
          </Field>
          <Field label="Salary amount (admin only)" htmlFor="tech-salary-amount" className="span-2">
            <Input
              id="tech-salary-amount"
              type="number"
              min="0"
              value={form.salaryAmount}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, salaryAmount: event.target.value }))
              }}
              placeholder="e.g. 45000"
            />
          </Field>
          <Field label="Working shift" htmlFor="tech-shift" className="span-2">
            <Input
              id="tech-shift"
              value={form.shift}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, shift: event.target.value }))
              }}
              placeholder="e.g. Morning / Evening / Night"
            />
          </Field>
          <Field label="Assigned supervisor" htmlFor="tech-supervisor" className="span-2">
            <Select
              id="tech-supervisor"
              value={form.supervisorId}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, supervisorId: event.target.value }))
              }}
            >
              <option value="">None</option>
              {data.technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </Select>
          </Field>

          <h4 className="form-section">Login & account details</h4>
          <Field label="Username" htmlFor="tech-username" required error={errors.username} className="span-2">
            <Input
              id="tech-username"
              value={form.username}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, username: event.target.value }))
                setErrors((prev) => ({ ...prev, username: undefined }))
              }}
              placeholder="e.g. imran.khan"
              error={errors.username}
            />
          </Field>
          <Field label="Password" htmlFor="tech-password" required error={errors.password} className="span-2">
            <Input
              id="tech-password"
              type="password"
              value={form.password}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, password: event.target.value }))
                setErrors((prev) => ({ ...prev, password: undefined }))
              }}
              placeholder="Login password"
              error={errors.password}
            />
          </Field>
          <Field label="Confirm password" htmlFor="tech-confirm" required error={errors.confirmPassword} className="span-2">
            <Input
              id="tech-confirm"
              type="password"
              value={form.confirmPassword}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
              }}
              placeholder="Repeat the password"
              error={errors.confirmPassword}
            />
          </Field>
          <Field label="Role" htmlFor="tech-role" className="span-2">
            <Select id="tech-role" value="Technician" disabled>
              <option value="Technician">Technician</option>
            </Select>
          </Field>
          <Field label="Login access" htmlFor="tech-login-access" className="span-2">
            <Select
              id="tech-login-access"
              value={form.loginAccess}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, loginAccess: event.target.value }))
              }}
            >
              <option value="Enabled">Enabled</option>
              <option value="Disabled">Disabled</option>
            </Select>
          </Field>

          <h4 className="form-section">Registration status</h4>
          <Field label="Status" htmlFor="tech-status" className="span-2">
            <Select
              id="tech-status"
              value={form.registrationStatus}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, registrationStatus: event.target.value }))
              }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="Resigned">Resigned</option>
            </Select>
          </Field>

          <h4 className="form-section">Documents (optional)</h4>
          <Field label="Aadhaar / ID proof reference" htmlFor="tech-aadhaar" className="span-2">
            <Input
              id="tech-aadhaar"
              value={form.aadhaarRef}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, aadhaarRef: event.target.value }))
              }}
              placeholder="Optional"
            />
          </Field>
          <Field label="Driving licence number" htmlFor="tech-dl" className="span-2">
            <Input
              id="tech-dl"
              value={form.dlNumber}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, dlNumber: event.target.value }))
              }}
              placeholder="Optional"
            />
          </Field>
          <Field label="Experience certificate" htmlFor="tech-exp-cert" className="span-2">
            <Input
              id="tech-exp-cert"
              value={form.expCertificate}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, expCertificate: event.target.value }))
              }}
              placeholder="Optional"
            />
          </Field>
          <Field label="Resume" htmlFor="tech-resume" className="span-2">
            <Input
              id="tech-resume"
              value={form.resumeRef}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, resumeRef: event.target.value }))
              }}
              placeholder="Optional"
            />
          </Field>
        </form>
      </Modal>

      {workspaceTech && (
        <Modal
          open
          onClose={() => setWorkspaceId(null)}
          title={`${workspaceTech.name}'s workspace`}
          subtitle={`${workspaceJobs.length} active task(s) · ${workspaceTech.phone || 'No phone'}`}
          icon="wrench"
          size="xl"
          footer={
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setWorkspaceId(null)}
            >
              Close workspace
            </button>
          }
        >
          <div className="workspace-head">
            <div className="workspace-person">
              <Avatar name={workspaceTech.name} size="lg" />
              <div>
                <strong>{workspaceTech.name}</strong>
                <span>
                  {pluralize(workspaceTech.completedJobs || 0, 'job')} completed
                  all-time
                </span>
              </div>
              <Badge
                tone={
                  workspaceTech.status === 'Online'
                    ? 'success'
                    : workspaceTech.status === 'Busy'
                      ? 'warning'
                      : 'neutral'
                }
                dot
              >
                {workspaceTech.status}
              </Badge>
            </div>
            <div className="workspace-status">
              <span className="muted small">Availability</span>
              <Select
                value={workspaceTech.status}
                onChange={(event) =>
                  updateTechnician(workspaceTech.id, {
                    status: event.target.value,
                  })
                }
              >
                <option value="Online">Online</option>
                <option value="Busy">Busy</option>
                <option value="Offline">Offline</option>
              </Select>
            </div>
          </div>

          <div className="workspace-grid">
            <div className="workspace-main">
              <div className="detail-section-head">
                <h4>Active tasks</h4>
                <span>{pluralize(workspaceJobs.length, 'job')}</span>
              </div>
              <div className="task-list">
                {workspaceJobs.map((job) => (
                  <TechTaskCard job={job} key={job.id} />
                ))}
                {!workspaceJobs.length && (
                  <EmptyState
                    icon="check-circle"
                    title="No active tasks"
                    message="This technician is free. New job cards will auto-assign when they are online."
                  />
                )}
              </div>
            </div>

            <aside className="workspace-side">
              <div className="workspace-side-card">
                <div className="detail-section-head">
                  <h4>Completed today</h4>
                  <span>{completedToday.length}</span>
                </div>
                <div className="mini-list">
                  {completedToday.map((job) => {
                    const customer = data.customers.find(
                      (item) => item.id === job.customerId,
                    )
                    return (
                      <div className="mini-list-row" key={job.id}>
                        <div>
                          <strong>{job.jobNo}</strong>
                          <span>{customer?.name || 'Customer'}</span>
                        </div>
                        <div>
                          <strong>{money(job.amount)}</strong>
                          <Badge
                            tone={job.paymentStatus === 'Paid' ? 'success' : 'danger'}
                          >
                            {job.paymentStatus}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                  {!completedToday.length && (
                    <p className="muted small">Nothing completed yet today.</p>
                  )}
                </div>
              </div>

              <div className="workspace-side-card">
                <div className="detail-section-head">
                  <h4>Workload</h4>
                </div>
                <div className="load-block">
                  <div className="progress-label">
                    <span>Active capacity</span>
                    <strong>{workspaceJobs.length} / 3</strong>
                  </div>
                  <ProgressBar
                    value={Math.min(100, (workspaceJobs.length / 3) * 100)}
                    tone={workspaceJobs.length >= 3 ? 'danger' : 'warning'}
                  />
                </div>
                <p className="muted small">
                  Auto-assignment picks the online technician with the fewest
                  active jobs, so workloads stay balanced.
                </p>
              </div>
            </aside>
          </div>
        </Modal>
      )}
    </div>
  )
}
