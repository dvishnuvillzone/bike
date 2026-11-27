import { useEffect, useState } from 'react'
import { StoreContext } from './storeContext'
import { buildSeed } from './seed'
import {
  findAvailableTechnician,
  lowStockParts,
} from './selectors'
import {
  digitsOnly,
  isActiveJob,
  isCompletedJob,
  nextJobNumber,
  uid,
  hashPassword,
} from './utils'

const STORAGE_KEY = 'villzone-bike-service-v6'
const STORE_VERSION = 6

const loadState = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.version === STORE_VERSION && parsed.data) {
        return parsed.data
      }
    }
  } catch {
    // Ignore malformed or unavailable storage and start from demo data.
  }
  return buildSeed()
}

const logActivity = (state, entry) => ({
  ...state,
  activity: [
    { id: uid('act'), at: new Date().toISOString(), ...entry },
    ...(state.activity || []),
  ].slice(0, 40),
})

export function StoreProvider({ children }) {
  const [data, setData] = useState(loadState)
  const [toast, setToast] = useState(null)
  const [customerSession, setCustomerSession] = useState(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: STORE_VERSION, data }),
      )
    } catch {
      // Persistence is best-effort; the app still works in memory.
    }
  }, [data])

  const notify = (message, tone = 'success') =>
    setToast({ id: Date.now() + Math.random(), message, tone })

  const clearToast = () => setToast(null)

  const loginTechnician = ({ username, password }) => {
    const user = (data.users || []).find(
      (item) => item.username === String(username || '').trim().toLowerCase(),
    )
    if (
      !user ||
      user.passwordHash !== hashPassword(password || '') ||
      !user.loginAccess
    ) {
      notify('Invalid technician login details.', 'error')
      return null
    }
    const technician = data.technicians.find(
      (item) => item.id === user.technicianId,
    )
    notify(`${technician?.name || 'Technician'} signed in.`, 'success')
    return technician
  }

  const loginCustomer = ({ phone }) => {
    const digits = digitsOnly(phone)
    const customer = (data.customers || []).find(
      (item) => digitsOnly(item.phone) === digits,
    )
    if (!customer) {
      notify('No customer account found for that mobile number.', 'error')
      return null
    }
    const session = {
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
    }
    setCustomerSession(session)
    notify(`${customer.name} signed in to the customer portal.`, 'success')
    return customer
  }

  const logoutCustomer = () => {
    setCustomerSession(null)
    notify('Customer portal signed out.', 'success')
  }

  const registerCustomerVehicle = ({ customer, vehicle }) => {
    const createdAt = new Date().toISOString()
    const newCustomer = {
      id: uid('cust'),
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      email: (customer.email || '').trim(),
      address: (customer.address || '').trim(),
      createdAt,
    }
    const newBike = {
      id: uid('bike'),
      customerId: newCustomer.id,
      brand: vehicle.brand.trim(),
      model: vehicle.model.trim(),
      regNo: vehicle.regNo.trim().toUpperCase(),
      engineNo: (vehicle.engineNo || '').trim().toUpperCase(),
      chassisNo: (vehicle.chassisNo || '').trim().toUpperCase(),
      year: Number(vehicle.year) || '',
      color: (vehicle.color || '').trim(),
      odometer: Number(vehicle.odometer) || 0,
      createdAt,
    }
    setData((prev) =>
      logActivity(
        {
          ...prev,
          customers: [newCustomer, ...prev.customers],
          bikes: [newBike, ...prev.bikes],
        },
        {
          type: 'customer',
          message: `${newCustomer.name} registered with a ${newBike.brand} ${newBike.model}`,
        },
      ),
    )
    return { customer: newCustomer, bike: newBike }
  }

  const addBike = (customerId, vehicle) => {
    const bike = {
      id: uid('bike'),
      customerId,
      brand: vehicle.brand.trim(),
      model: vehicle.model.trim(),
      regNo: vehicle.regNo.trim().toUpperCase(),
      engineNo: (vehicle.engineNo || '').trim().toUpperCase(),
      chassisNo: (vehicle.chassisNo || '').trim().toUpperCase(),
      year: Number(vehicle.year) || '',
      color: (vehicle.color || '').trim(),
      odometer: Number(vehicle.odometer) || 0,
      createdAt: new Date().toISOString(),
    }
    setData((prev) => ({ ...prev, bikes: [bike, ...prev.bikes] }))
    return bike
  }

  const createJob = ({
    customerId,
    bikeId,
    serviceIds,
    priority,
    notes,
    complaint,
    technicianId,
  }) => {
    const services = data.categories
      .filter((category) => serviceIds.includes(category.id))
      .map((category) => ({
        id: category.id,
        name: category.name,
        price: category.price,
        duration: category.duration,
      }))
    const laborTotal = services.reduce((total, service) => total + service.price, 0)
    const technician = technicianId
      ? data.technicians.find((tech) => tech.id === technicianId) || null
      : findAvailableTechnician(data.technicians, data.jobs, services.map((s) => s.name))
    const job = {
      id: uid('job'),
      jobNo: nextJobNumber(data.jobs),
      customerId,
      bikeId,
      technicianId: technician ? technician.id : null,
      services,
      partsUsed: [],
      laborTotal,
      partsTotal: 0,
      amount: laborTotal,
      status: 'Pending',
      priority: priority || 'Normal',
      progress: 0,
      notes: (notes || '').trim(),
      complaint: (complaint || '').trim(),
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      deliveredAt: null,
      paymentStatus: 'Unpaid',
      paymentMethod: null,
      paidAt: null,
    }
    setData((prev) =>
      logActivity(
        {
          ...prev,
          jobs: [job, ...prev.jobs],
          technicians: prev.technicians.map((tech) =>
            technician && tech.id === technician.id
              ? { ...tech, status: 'Busy' }
              : tech,
          ),
        },
        {
          type: 'job',
          message: technician
            ? `Job ${job.jobNo} created and auto-assigned to ${technician.name}`
            : `Job ${job.jobNo} created — waiting for an available technician`,
        },
      ),
    )
    return { job, technician }
  }

  const startJob = (jobId) => {
    const job = data.jobs.find((item) => item.id === jobId)
    if (!job) return
    setData((prev) =>
      logActivity(
        {
          ...prev,
          jobs: prev.jobs.map((item) =>
            item.id === jobId
              ? {
                  ...item,
                  status: 'In Progress',
                  startedAt: item.startedAt || new Date().toISOString(),
                  progress: Math.max(item.progress || 0, 10),
                }
              : item,
          ),
          technicians: prev.technicians.map((tech) =>
            tech.id === job.technicianId ? { ...tech, status: 'Busy' } : tech,
          ),
        },
        {
          type: 'job',
          message: `Job ${job.jobNo} started`,
        },
      ),
    )
    notify(`Job ${job.jobNo} is now in progress.`)
  }

  const completeJob = (jobId) => {
    const job = data.jobs.find((item) => item.id === jobId)
    if (!job || isCompletedJob(job)) return
    const completedAt = new Date().toISOString()
    setData((prev) => {
      const jobs = prev.jobs.map((item) =>
        item.id === jobId
          ? {
              ...item,
              status: 'Completed',
              completedAt,
              progress: 100,
            }
          : item,
      )
      const technicians = prev.technicians.map((tech) => {
        if (tech.id !== job.technicianId) return tech
        const stillBusy = jobs.some(
          (item) => item.technicianId === tech.id && isActiveJob(item),
        )
        return {
          ...tech,
          status: stillBusy ? 'Busy' : 'Online',
          completedJobs: (tech.completedJobs || 0) + 1,
        }
      })
      return logActivity(
        { ...prev, jobs, technicians },
        { type: 'job', message: `Job ${job.jobNo} completed` },
      )
    })
    const tech = data.technicians.find((item) => item.id === job.technicianId)
    notify(
      tech
        ? `Job ${job.jobNo} completed. ${tech.name} is back online.`
        : `Job ${job.jobNo} completed.`,
    )
  }

  const markDelivered = (jobId) => {
    const job = data.jobs.find((item) => item.id === jobId)
    if (!job) return
    setData((prev) => ({
      ...prev,
      jobs: prev.jobs.map((item) =>
        item.id === jobId
          ? { ...item, status: 'Delivered', deliveredAt: new Date().toISOString() }
          : item,
      ),
    }))
    notify(`Job ${job.jobNo} marked as delivered.`)
  }

  const markPaid = (jobId, method = 'UPI') => {
    const job = data.jobs.find((item) => item.id === jobId)
    if (!job || job.paymentStatus === 'Paid') return
    setData((prev) =>
      logActivity(
        {
          ...prev,
          jobs: prev.jobs.map((item) =>
            item.id === jobId
              ? {
                  ...item,
                  paymentStatus: 'Paid',
                  paymentMethod: method,
                  paidAt: new Date().toISOString(),
                }
              : item,
          ),
        },
        {
          type: 'payment',
          message: `₹${Number(job.amount).toLocaleString('en-IN')} collected for ${job.jobNo} via ${method}`,
        },
      ),
    )
    notify(`Payment of ₹${Number(job.amount).toLocaleString('en-IN')} recorded.`)
  }

  const reassignJob = (jobId, technicianId) => {
    const job = data.jobs.find((item) => item.id === jobId)
    const target = data.technicians.find((tech) => tech.id === technicianId)
    if (!job || !target) return false
    if (target.status !== 'Online') {
      notify('Only technicians who are online can take a new job.', 'error')
      return false
    }
    const previousTechId = job.technicianId
    setData((prev) => {
      const jobs = prev.jobs.map((item) =>
        item.id === jobId ? { ...item, technicianId } : item,
      )
      const technicians = prev.technicians.map((tech) => {
        if (tech.id === technicianId) return { ...tech, status: 'Busy' }
        if (tech.id === previousTechId) {
          const stillBusy = jobs.some(
            (item) => item.technicianId === tech.id && isActiveJob(item),
          )
          return { ...tech, status: stillBusy ? 'Busy' : 'Online' }
        }
        return tech
      })
      return logActivity(
        { ...prev, jobs, technicians },
        {
          type: 'job',
          message: `Job ${job.jobNo} assigned to ${target.name}`,
        },
      )
    })
    notify(`Job ${job.jobNo} assigned to ${target.name}.`)
    return true
  }

  const autoAssignJob = (jobId) => {
    const technician = findAvailableTechnician(data.technicians, data.jobs)
    if (!technician) {
      notify('No online technician is available right now.', 'error')
      return false
    }
    return reassignJob(jobId, technician.id)
  }

  const setJobNotes = (jobId, notes) => {
    setData((prev) => ({
      ...prev,
      jobs: prev.jobs.map((job) =>
        job.id === jobId ? { ...job, notes } : job,
      ),
    }))
    notify('Work notes saved.')
  }

  const setJobProgress = (jobId, progress) => {
    setData((prev) => ({
      ...prev,
      jobs: prev.jobs.map((job) =>
        job.id === jobId
          ? { ...job, progress: Math.min(100, Math.max(0, progress)) }
          : job,
      ),
    }))
  }

  const addPartToJob = (jobId, partId, qty = 1) => {
    const job = data.jobs.find((item) => item.id === jobId)
    const part = data.parts.find((item) => item.id === partId)
    const quantity = Math.max(1, Number(qty) || 1)
    if (!job || !part) return false
    if (part.stock < quantity) {
      notify(`Only ${part.stock} unit(s) of ${part.name} left in stock.`, 'error')
      return false
    }
    setData((prev) => {
      const jobs = prev.jobs.map((item) => {
        if (item.id !== jobId) return item
        const existing = (item.partsUsed || []).find(
          (used) => used.partId === partId,
        )
        const partsUsed = existing
          ? item.partsUsed.map((used) =>
              used.partId === partId
                ? { ...used, qty: used.qty + quantity }
                : used,
            )
          : [
              ...(item.partsUsed || []),
              {
                id: uid('used'),
                partId,
                name: part.name,
                qty: quantity,
                unitPrice: part.price,
              },
            ]
        const partsTotal = partsUsed.reduce(
          (total, used) => total + used.qty * used.unitPrice,
          0,
        )
        return {
          ...item,
          partsUsed,
          partsTotal,
          amount: item.laborTotal + partsTotal,
        }
      })
      return logActivity(
        {
          ...prev,
          jobs,
          parts: prev.parts.map((item) =>
            item.id === partId
              ? { ...item, stock: item.stock - quantity }
              : item,
          ),
        },
        {
          type: 'stock',
          message: `${quantity} × ${part.name} used on ${job.jobNo}`,
        },
      )
    })
    notify(`${quantity} × ${part.name} added to ${job.jobNo}.`)
    return true
  }

  const addTechnician = ({
    name,
    phone,
    category,
    skills,
    experience,
    qualification,
    techType,
    salaryType,
    salaryAmount,
    shift,
    supervisorId,
    joiningDate,
    gender,
    username,
    password,
    loginAccess,
    registrationStatus,
  }) => {
    const technician = {
      id: uid('tech'),
      name: (name || '').trim(),
      phone: (phone || '').trim(),
      category: (category || '').trim(),
      skills: Array.isArray(skills)
        ? skills
        : (skills || '')
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
      experience: Number(experience) || 0,
      qualification: (qualification || '').trim(),
      techType: techType || 'Junior',
      salaryType: salaryType || 'Monthly',
      salaryAmount: Number(salaryAmount) || 0,
      shift: (shift || '').trim(),
      supervisorId: supervisorId || null,
      joiningDate: joiningDate || new Date().toISOString(),
      gender: gender || '',
      registrationStatus: registrationStatus || 'Active',
      status: 'Online',
      completedJobs: 0,
      joinedAt: new Date().toISOString(),
    }
    const user = username
      ? {
          id: uid('usr'),
          username: String(username).trim().toLowerCase(),
          passwordHash: hashPassword(password || ''),
          role: 'Technician',
          technicianId: technician.id,
          loginAccess: loginAccess !== 'Disabled',
          createdAt: new Date().toISOString(),
        }
      : null
    setData((prev) => ({
      ...prev,
      technicians: [...prev.technicians, technician],
      users: user ? [...(prev.users || []), user] : prev.users || [],
    }))
    notify(`${technician.name} added to the team.`)
    return { technician, user }
  }

  const updateTechnician = (technicianId, patch) => {
    if (patch.status && patch.status !== 'Busy') {
      const activeCount = data.jobs.filter(
        (job) => job.technicianId === technicianId && isActiveJob(job),
      ).length
      if (activeCount > 0) {
        notify(
          `Complete the ${activeCount} active job(s) before changing availability.`,
          'error',
        )
        return false
      }
    }
    setData((prev) => ({
      ...prev,
      technicians: prev.technicians.map((tech) =>
        tech.id === technicianId ? { ...tech, ...patch } : tech,
      ),
    }))
    return true
  }

  const addCategory = (category) => {
    const entry = {
      id: uid('cat'),
      name: category.name.trim(),
      group: (category.group || 'General Maintenance').trim(),
      description: (category.description || '').trim(),
      price: Number(category.price) || 0,
      duration: Number(category.duration) || 30,
      icon: category.icon || 'wrench',
    }
    setData((prev) => ({ ...prev, categories: [...prev.categories, entry] }))
    notify(`${entry.name} added to the service menu.`)
    return entry
  }

  const updateCategory = (categoryId, patch) => {
    setData((prev) => ({
      ...prev,
      categories: prev.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              ...patch,
              group: patch.group ?? category.group,
              price: Number(patch.price ?? category.price) || 0,
              duration: Number(patch.duration ?? category.duration) || 30,
            }
          : category,
      ),
    }))
    notify('Service category updated.')
  }

  const addPart = (part) => {
    const entry = {
      id: uid('part'),
      name: part.name.trim(),
      sku: (part.sku || '').trim().toUpperCase(),
      category: (part.category || 'General').trim(),
      stock: Number(part.stock) || 0,
      minStock: Number(part.minStock) || 0,
      price: Number(part.price) || 0,
      supplier: (part.supplier || '').trim(),
    }
    setData((prev) => ({ ...prev, parts: [entry, ...prev.parts] }))
    notify(`${entry.name} added to spare parts inventory.`)
    return entry
  }

  const updatePart = (partId, patch) => {
    setData((prev) => ({
      ...prev,
      parts: prev.parts.map((part) =>
        part.id === partId
          ? {
              ...part,
              ...patch,
              stock: Number(patch.stock ?? part.stock) || 0,
              minStock: Number(patch.minStock ?? part.minStock) || 0,
              price: Number(patch.price ?? part.price) || 0,
            }
          : part,
      ),
    }))
    notify('Spare part updated.')
  }

  const restockPart = (partId, qty) => {
    const quantity = Math.max(1, Number(qty) || 1)
    const part = data.parts.find((item) => item.id === partId)
    if (!part) return
    setData((prev) => ({
      ...prev,
      parts: prev.parts.map((item) =>
        item.id === partId
          ? { ...item, stock: item.stock + quantity }
          : item,
      ),
    }))
    notify(`${quantity} × ${part.name} added to stock.`)
  }

  const resetData = () => {
    const fresh = buildSeed()
    setData(fresh)
    notify('Demo data has been reset.')
  }

  const lowStock = lowStockParts(data.parts)

  const value = {
    data,
    toast,
    notify,
    clearToast,
    lowStock,
    registerCustomerVehicle,
    addBike,
    createJob,
    startJob,
    completeJob,
    markDelivered,
    markPaid,
    reassignJob,
    autoAssignJob,
    setJobNotes,
    setJobProgress,
    addPartToJob,
    addTechnician,
    updateTechnician,
    addCategory,
    updateCategory,
    addPart,
    updatePart,
    restockPart,
    resetData,
    loginTechnician,
    customerSession,
    loginCustomer,
    logoutCustomer,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
