export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { id: 'customer-login', label: 'Customer Portal', icon: 'user' },
    ],
  },
  {
    label: 'Workshop',
    items: [
      { id: 'track', label: 'Customer Service Tracking', icon: 'search' },
      { id: 'bikes', label: 'Bike Management', icon: 'bike' },
      { id: 'categories', label: 'Service Categories', icon: 'layers' },
      { id: 'new-job', label: 'New Job Card', icon: 'clipboard-plus' },
      { id: 'assignment', label: 'Technician Assignment', icon: 'user-check' },
      { id: 'technicians', label: 'Technician Management', icon: 'sliders' },
      { id: 'pending', label: 'Pending Services', icon: 'clock' },
      { id: 'completed', label: 'Completed Services', icon: 'check-circle' },
    ],
  },
  {
    label: 'Finance & Insights',
    items: [
      { id: 'billing', label: 'Billing & Payments', icon: 'credit-card' },
      { id: 'daily-report', label: 'Daily Report', icon: 'calendar' },
      { id: 'reports', label: 'Monthly Report', icon: 'chart' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { id: 'admin', label: 'Admin Dashboard', icon: 'shield' },
    ],
  },
]

export const PAGE_META = {
  'customer/login': {
    title: 'Customer Portal',
    subtitle: 'Sign in with your registered mobile number to follow your bike service status.',
  },
  'admin/login': {
    title: 'Admin Login',
    subtitle: 'Sign in with your workshop admin or technician account.',
  },
  'customer-login': {
    title: 'Customer Portal',
    subtitle: 'Track your bike service status with your personal login.',
  },
  dashboard: {
    title: 'Dashboard',
    subtitle: 'A live snapshot of your workshop activity.',
  },
  track: {
    title: 'Customer Service Tracking',
    subtitle: 'Check bike service status by customer mobile number or vehicle number.',
  },
  bikes: {
    title: 'Bike Serviced Customer Details',
    subtitle: 'Keep every vehicle and its owner connected.',
  },
  categories: {
    title: 'Service Categories',
    subtitle: 'Define the services you offer, with pricing.',
  },
  'new-job': {
    title: 'New Job Card',
    subtitle: 'Create a job card and auto-assign it to the floor.',
  },
  assignment: {
    title: 'Technician Assignment',
    subtitle: 'Match open jobs with available technicians.',
  },
  technicians: {
    title: 'Technician Management',
    subtitle: 'Manage availability and update workshop tasks.',
  },
  pending: {
    title: 'Pending Services',
    subtitle: 'Track jobs that are still on the workshop floor.',
  },
  completed: {
    title: 'Completed Services',
    subtitle: 'Review finished jobs and collect payments.',
  },
  billing: {
    title: 'Billing & Payments',
    subtitle: 'Collect payments and keep the books balanced.',
  },
  'daily-report': {
    title: 'Daily Report',
    subtitle: 'A day-by-day summary of everything at the counter.',
  },
  reports: {
    title: 'Monthly Report',
    subtitle: 'Revenue, services and team performance by month.',
  },
  admin: {
    title: 'Admin Dashboard',
    subtitle: 'Revenue, collections and spare parts inventory at a glance.',
  },
}

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items)
