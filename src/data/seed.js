import { addHours, isActiveJob, isCompletedJob, hashPassword } from './utils'

const round = (value) => Math.round(value)

export function buildSeed() {
  let state = 20261127
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
  const pick = (list) => list[Math.floor(random() * list.length)]
  const randInt = (min, max) => min + Math.floor(random() * (max - min + 1))
  const chance = (probability) => random() < probability

  const now = new Date()
  const stamp = (daysAgo, hour = 10, minute = 0) => {
    const d = new Date(now)
    d.setDate(d.getDate() - daysAgo)
    d.setHours(hour, minute, 0, 0)
    return d.toISOString()
  }

  const categories = [
    {
      id: 'cat-01',
      name: 'General Bike Service',
      group: 'General Maintenance',
      description: 'Full inspection, cleaning, lubrication and a safety check.',
      price: 499,
      duration: 60,
      icon: 'wrench',
    },
    {
      id: 'cat-02',
      name: 'Periodic Maintenance',
      group: 'General Maintenance',
      description: 'Scheduled periodic upkeep across brakes, suspension and fluids.',
      price: 899,
      duration: 90,
      icon: 'activity',
    },
    {
      id: 'cat-03',
      name: 'Basic Service',
      group: 'General Maintenance',
      description: 'Essential checks and fluid top-ups for everyday riding.',
      price: 399,
      duration: 45,
      icon: 'check-circle',
    },
    {
      id: 'cat-04',
      name: 'Complete Service',
      group: 'General Maintenance',
      description: 'End-to-end service including filters, fluids and adjustments.',
      price: 1299,
      duration: 120,
      icon: 'shield',
    },
    {
      id: 'cat-05',
      name: 'Engine Oil Service',
      group: 'General Maintenance',
      description: 'Engine oil and filter service with lubrication support.',
      price: 449,
      duration: 40,
      icon: 'droplet',
    },
    {
      id: 'cat-06',
      name: 'Oil Filter Service',
      group: 'General Maintenance',
      description: 'Oil filter replacement and filter inspection.',
      price: 249,
      duration: 20,
      icon: 'circle',
    },
    {
      id: 'cat-07',
      name: 'Air Filter Service',
      group: 'General Maintenance',
      description: 'Air filter cleaning or replacement with leak check.',
      price: 399,
      duration: 25,
      icon: 'package',
    },
    {
      id: 'cat-08',
      name: 'Bike Washing',
      group: 'General Maintenance',
      description: 'Deep foam wash, chain degrease and hand polish finish.',
      price: 349,
      duration: 30,
      icon: 'sparkles',
    },
    {
      id: 'cat-09',
      name: 'Lubrication Service',
      group: 'General Maintenance',
      description: 'Wide-range lubrication for drive chain, cables and pivot joints.',
      price: 299,
      duration: 25,
      icon: 'settings',
    },
    {
      id: 'cat-10',
      name: 'Vehicle Inspection',
      group: 'General Maintenance',
      description: 'Road-worthiness and safety inspection for riders.',
      price: 199,
      duration: 20,
      icon: 'eye',
    },
    {
      id: 'cat-11',
      name: 'Engine Repair',
      group: 'Engine Services',
      description: 'Diagnosed repair of engine faults with bench verification.',
      price: 1499,
      duration: 120,
      icon: 'wrench',
    },
    {
      id: 'cat-12',
      name: 'Engine Overhaul',
      group: 'Engine Services',
      description: 'Full engine overhaul with teardown and reassembly.',
      price: 4499,
      duration: 180,
      icon: 'gauge',
    },
    {
      id: 'cat-13',
      name: 'Engine Tuning',
      group: 'Engine Services',
      description: 'Carburetor / fuel-injection tuning and performance setup.',
      price: 1599,
      duration: 150,
      icon: 'settings',
    },
    {
      id: 'cat-14',
      name: 'Engine Noise Diagnosis',
      group: 'Engine Services',
      description: 'Acoustic diagnosis of unusual engine noises.',
      price: 1299,
      duration: 90,
      icon: 'activity',
    },
    {
      id: 'cat-15',
      name: 'Engine Compression Check',
      group: 'Engine Services',
      description: 'Compression and leak-down performance testing.',
      price: 1199,
      duration: 60,
      icon: 'circle',
    },
    {
      id: 'cat-16',
      name: 'Cylinder & Piston Service',
      group: 'Engine Services',
      description: 'Cylinder bore, piston ring and head service.',
      price: 2399,
      duration: 180,
      icon: 'disc',
    },
    {
      id: 'cat-17',
      name: 'Valve Adjustment',
      group: 'Engine Services',
      description: 'Engine valve clearance and timing adjustment.',
      price: 1799,
      duration: 120,
      icon: 'link',
    },
    {
      id: 'cat-18',
      name: 'Head Gasket Service',
      group: 'Engine Services',
      description: 'Head gasket inspection and replacement.',
      price: 2199,
      duration: 150,
      icon: 'shield',
    },
    {
      id: 'cat-19',
      name: 'Engine Leakage Repair',
      group: 'Engine Services',
      description: 'Sealing and repair of engine oil and coolant leaks.',
      price: 1399,
      duration: 120,
      icon: 'info',
    },
    {
      id: 'cat-20',
      name: 'Engine Performance Diagnosis',
      group: 'Engine Services',
      description: 'Full performance mapping and driveability diagnosis.',
      price: 1699,
      duration: 150,
      icon: 'target',
    },
    {
      id: 'cat-21',
      name: 'Clutch Service',
      group: 'Clutch & Transmission',
      description: 'Clutch function check, adjustment and cable setup.',
      price: 899,
      duration: 60,
      icon: 'settings',
    },
    {
      id: 'cat-22',
      name: 'Clutch Plate Replacement',
      group: 'Clutch & Transmission',
      description: 'Clutch plate wear diagnosis and replacement.',
      price: 2199,
      duration: 120,
      icon: 'disc',
    },
    {
      id: 'cat-23',
      name: 'Clutch Cable Service',
      group: 'Clutch & Transmission',
      description: 'Clutch cable inspection, lubrication and adjustment.',
      price: 799,
      duration: 45,
      icon: 'link',
    },
    {
      id: 'cat-24',
      name: 'Gearbox Repair',
      group: 'Clutch & Transmission',
      description: 'Gearbox repair with internal inspection.',
      price: 1899,
      duration: 150,
      icon: 'settings',
    },
    {
      id: 'cat-25',
      name: 'Gear Shifting Service',
      group: 'Clutch & Transmission',
      description: 'Gear shift linkage and pattern tuning.',
      price: 1599,
      duration: 120,
      icon: 'activity',
    },
    {
      id: 'cat-26',
      name: 'Chain & Sprocket Service',
      group: 'Clutch & Transmission',
      description: 'Chain cleaning, tension setting and sprocket service.',
      price: 1299,
      duration: 60,
      icon: 'link',
    },
    {
      id: 'cat-27',
      name: 'Drive Chain Adjustment',
      group: 'Clutch & Transmission',
      description: 'Drive chain slack and tension adjustment.',
      price: 899,
      duration: 50,
      icon: 'settings',
    },
    {
      id: 'cat-28',
      name: 'Drive Chain Replacement',
      group: 'Clutch & Transmission',
      description: 'Drive chain replacement with cassette check.',
      price: 1899,
      duration: 90,
      icon: 'disc',
    },
    {
      id: 'cat-29',
      name: 'Transmission Oil Service',
      group: 'Clutch & Transmission',
      description: 'Transmission oil change and filter service.',
      price: 1099,
      duration: 50,
      icon: 'droplet',
    },
    {
      id: 'cat-30',
      name: 'Clutch Adjustment',
      group: 'Clutch & Transmission',
      description: 'Standalone clutch free-play adjustment.',
      price: 1199,
      duration: 60,
      icon: 'settings',
    },
    {
      id: 'cat-31',
      name: 'Front Brake Service',
      group: 'Brake & Suspension',
      description: 'Front brake pad, cable and fluid service.',
      price: 1099,
      duration: 70,
      icon: 'disc',
    },
    {
      id: 'cat-32',
      name: 'Rear Brake Service',
      group: 'Brake & Suspension',
      description: 'Rear brake pad, cable and fluid service.',
      price: 1099,
      duration: 70,
      icon: 'disc',
    },
    {
      id: 'cat-33',
      name: 'Brake Pad Replacement',
      group: 'Brake & Suspension',
      description: 'Front and rear brake pad replacement.',
      price: 1699,
      duration: 90,
      icon: 'disc',
    },
    {
      id: 'cat-34',
      name: 'Brake Shoe Replacement',
      group: 'Brake & Suspension',
      description: 'Brake shoe and lining replacement.',
      price: 1599,
      duration: 90,
      icon: 'disc',
    },
    {
      id: 'cat-35',
      name: 'Brake Disc Service',
      group: 'Brake & Suspension',
      description: 'Brake disc inspection and resurfacing.',
      price: 1899,
      duration: 90,
      icon: 'disc',
    },
    {
      id: 'cat-36',
      name: 'Brake Fluid Service',
      group: 'Brake & Suspension',
      description: 'Brake fluid flush and bleed service.',
      price: 899,
      duration: 40,
      icon: 'droplet',
    },
    {
      id: 'cat-37',
      name: 'ABS System Diagnosis',
      group: 'Brake & Suspension',
      description: 'ABS sensor and pump diagnostics.',
      price: 2199,
      duration: 120,
      icon: 'shield',
    },
    {
      id: 'cat-38',
      name: 'Front Fork Service',
      group: 'Brake & Suspension',
      description: 'Front fork seal and damping service.',
      price: 1499,
      duration: 100,
      icon: 'activity',
    },
    {
      id: 'cat-39',
      name: 'Rear Suspension Service',
      group: 'Brake & Suspension',
      description: 'Rear suspension seal and damping service.',
      price: 1499,
      duration: 100,
      icon: 'activity',
    },
    {
      id: 'cat-40',
      name: 'Shock Absorber Replacement',
      group: 'Brake & Suspension',
      description: 'Shock absorber replacement and setup.',
      price: 1999,
      duration: 120,
      icon: 'gauge',
    },
    {
      id: 'cat-41',
      name: 'Battery Service',
      group: 'Electrical & Battery',
      description: 'Battery load test, charge and health check.',
      price: 1299,
      duration: 60,
      icon: 'zap',
    },
    {
      id: 'cat-42',
      name: 'Battery Replacement',
      group: 'Electrical & Battery',
      description: 'Battery replacement with charging verification.',
      price: 5499,
      duration: 90,
      icon: 'zap',
    },
    {
      id: 'cat-43',
      name: 'Charging System Service',
      group: 'Electrical & Battery',
      description: 'Alternator and charging system diagnostics.',
      price: 1499,
      duration: 80,
      icon: 'zap',
    },
    {
      id: 'cat-44',
      name: 'Starter Motor Service',
      group: 'Electrical & Battery',
      description: 'Starter motor repair and testing.',
      price: 1899,
      duration: 90,
      icon: 'zap',
    },
    {
      id: 'cat-45',
      name: 'Self Start Repair',
      group: 'Electrical & Battery',
      description: 'Electric self-start system repair.',
      price: 1799,
      duration: 90,
      icon: 'zap',
    },
    {
      id: 'cat-46',
      name: 'Headlight Service',
      group: 'Electrical & Battery',
      description: 'Headlight bulb, lens and beam service.',
      price: 1299,
      duration: 60,
      icon: 'info',
    },
    {
      id: 'cat-47',
      name: 'Indicator & Tail Light Service',
      group: 'Electrical & Battery',
      description: 'Indicator and tail light circuit service.',
      price: 1099,
      duration: 50,
      icon: 'alert',
    },
    {
      id: 'cat-48',
      name: 'Wiring Repair',
      group: 'Electrical & Battery',
      description: 'Wiring harness repair and insulation check.',
      price: 1499,
      duration: 80,
      icon: 'info',
    },
    {
      id: 'cat-49',
      name: 'Horn Service',
      group: 'Electrical & Battery',
      description: 'Horn bulb and amplifier service.',
      price: 1199,
      duration: 45,
      icon: 'alert',
    },
    {
      id: 'cat-50',
      name: 'Electrical Diagnosis',
      group: 'Electrical & Battery',
      description: 'Complete electrical fault tracing and diagnosis.',
      price: 1599,
      duration: 90,
      icon: 'info',
    },
    {
      id: 'cat-51',
      name: 'Front Tyre Service',
      group: 'Tyre & Wheel Services',
      description: 'Front tyre pressure, wear and tread check.',
      price: 1299,
      duration: 60,
      icon: 'disc',
    },
    {
      id: 'cat-52',
      name: 'Rear Tyre Service',
      group: 'Tyre & Wheel Services',
      description: 'Rear tyre pressure, wear and tread check.',
      price: 1299,
      duration: 60,
      icon: 'disc',
    },
    {
      id: 'cat-53',
      name: 'Tyre Replacement',
      group: 'Tyre & Wheel Services',
      description: 'Tyre replacement with balance check.',
      price: 5499,
      duration: 120,
      icon: 'package',
    },
    {
      id: 'cat-54',
      name: 'Puncture Repair',
      group: 'Tyre & Wheel Services',
      description: 'Puncture repair with casing and pressure check.',
      price: 999,
      duration: 45,
      icon: 'alert',
    },
    {
      id: 'cat-55',
      name: 'Wheel Alignment',
      group: 'Tyre & Wheel Services',
      description: 'Front and rear wheel alignment service.',
      price: 2499,
      duration: 90,
      icon: 'activity',
    },
    {
      id: 'cat-56',
      name: 'Wheel Balancing',
      group: 'Tyre & Wheel Services',
      description: 'Wheel balancing and dynamic tracking check.',
      price: 1499,
      duration: 60,
      icon: 'gauge',
    },
    {
      id: 'cat-57',
      name: 'Rim Repair',
      group: 'Tyre & Wheel Services',
      description: 'Rim denting, patching and repair service.',
      price: 1799,
      duration: 90,
      icon: 'box',
    },
    {
      id: 'cat-58',
      name: 'Wheel Bearing Service',
      group: 'Tyre & Wheel Services',
      description: 'Wheel bearing replacement and adjustment.',
      price: 1399,
      duration: 80,
      icon: 'link',
    },
    {
      id: 'cat-59',
      name: 'Tubeless Tyre Service',
      group: 'Tyre & Wheel Services',
      description: 'Tubeless tyre setup, patch and balance.',
      price: 5999,
      duration: 120,
      icon: 'package',
    },
    {
      id: 'cat-60',
      name: 'Tyre Pressure Check',
      group: 'Tyre & Wheel Services',
      description: 'Tyre pressure build-up and leak check.',
      price: 799,
      duration: 30,
      icon: 'circle',
    },
    {
      id: 'cat-61',
      name: 'Body Repair',
      group: 'Body, Accessories & Other Services',
      description: 'Denting, alignment and panel repair.',
      price: 1499,
      duration: 90,
      icon: 'wrench',
    },
    {
      id: 'cat-62',
      name: 'Painting Service',
      group: 'Body, Accessories & Other Services',
      description: 'Full or touch-up painting and finishing coat.',
      price: 2499,
      duration: 180,
      icon: 'sparkles',
    },
    {
      id: 'cat-63',
      name: 'Denting Service',
      group: 'Body, Accessories & Other Services',
      description: 'Panel denting removal and filler work.',
      price: 2199,
      duration: 150,
      icon: 'edit',
    },
    {
      id: 'cat-64',
      name: 'Seat Repair',
      group: 'Body, Accessories & Other Services',
      description: 'Seat cushion, frame and mounting repair.',
      price: 1399,
      duration: 90,
      icon: 'package',
    },
    {
      id: 'cat-65',
      name: 'Mirror Replacement',
      group: 'Body, Accessories & Other Services',
      description: 'Mirror assembly replacement and alignment.',
      price: 1499,
      duration: 60,
      icon: 'edit',
    },
    {
      id: 'cat-66',
      name: 'Handlebar Service',
      group: 'Body, Accessories & Other Services',
      description: 'Handlebar, grip and control service.',
      price: 1699,
      duration: 90,
      icon: 'link',
    },
    {
      id: 'cat-67',
      name: 'Silencer & Exhaust Service',
      group: 'Body, Accessories & Other Services',
      description: 'Silencer, exhaust and heat shield service.',
      price: 1899,
      duration: 90,
      icon: 'settings',
    },
    {
      id: 'cat-68',
      name: 'Accessories Installation',
      group: 'Body, Accessories & Other Services',
      description: 'Accessory fitting with torque and safety checks.',
      price: 1399,
      duration: 60,
      icon: 'package',
    },
    {
      id: 'cat-69',
      name: 'Roadside Assistance',
      group: 'Body, Accessories & Other Services',
      description: 'On-road breakdown support and first-response help.',
      price: 2499,
      duration: 60,
      icon: 'phone',
    },
    {
      id: 'cat-70',
      name: 'Breakdown Repair',
      group: 'Body, Accessories & Other Services',
      description: 'Breakdown diagnosis and repair coordination.',
      price: 1999,
      duration: 120,
      icon: 'alert',
    },
  ]

  const technicians = [
    {
      id: 'tech-1',
      name: 'Arjun Mehta',
      phone: '98450 11223',
      skills: ['Engine Tune-Up', 'General Service', 'Suspension Check'],
      status: 'Online',
      completedJobs: 0,
      joinedAt: stamp(820),
    },
    {
      id: 'tech-2',
      name: 'Ravi Kumar',
      phone: '98861 44520',
      skills: ['Brake Service', 'Chain & Sprocket', 'Tyre & Puncture'],
      status: 'Online',
      completedJobs: 0,
      joinedAt: stamp(640),
    },
    {
      id: 'tech-3',
      name: 'Sameer Khan',
      phone: '99012 87341',
      skills: ['Engine Oil Change', 'General Service', 'Electrical & Battery'],
      status: 'Online',
      completedJobs: 0,
      joinedAt: stamp(510),
    },
    {
      id: 'tech-4',
      name: 'Priya Nair',
      phone: '97401 66320',
      skills: ['Engine Tune-Up', 'Clutch & Gearbox', 'Chain & Sprocket'],
      status: 'Online',
      completedJobs: 0,
      joinedAt: stamp(430),
    },
    {
      id: 'tech-5',
      name: 'Vikram Singh',
      phone: '98123 55890',
      skills: ['Suspension Check', 'Brake Service', 'Foam Wash & Polish'],
      status: 'Offline',
      completedJobs: 0,
      joinedAt: stamp(360),
    },
    {
      id: 'tech-6',
      name: 'Neha Joshi',
      phone: '96320 77841',
      skills: ['Electrical & Battery', 'Engine Oil Change', 'General Service'],
      status: 'Online',
      completedJobs: 0,
      joinedAt: stamp(280),
    },
    {
      id: 'tech-7',
      name: 'Imran Sheikh',
      phone: '95351 20934',
      skills: ['Tyre & Puncture', 'Chain & Sprocket', 'Foam Wash & Polish'],
      status: 'Online',
      completedJobs: 0,
      joinedAt: stamp(190),
    },
  ]

  const customers = [
    {
      id: 'cust-1',
      name: 'Rahul Sharma',
      phone: '98765 43210',
      email: 'rahul.sharma@example.com',
      address: '12, 4th Cross, Indiranagar, Bengaluru',
      createdAt: stamp(210),
    },
    {
      id: 'cust-2',
      name: 'Ananya Iyer',
      phone: '99801 24680',
      email: 'ananya.iyer@example.com',
      address: '44, Lake View Road, Koramangala',
      createdAt: stamp(170),
    },
    {
      id: 'cust-3',
      name: 'Karan Patel',
      phone: '98422 11876',
      email: 'karan.patel@example.com',
      address: '8, 1st Main, HSR Layout',
      createdAt: stamp(140),
    },
    {
      id: 'cust-4',
      name: 'Meera Reddy',
      phone: '97418 90765',
      email: 'meera.reddy@example.com',
      address: '27, Palm Grove, Whitefield',
      createdAt: stamp(110),
    },
    {
      id: 'cust-5',
      name: 'Aditya Rao',
      phone: '99024 33567',
      email: 'aditya.rao@example.com',
      address: '5, Temple Street, Jayanagar',
      createdAt: stamp(88),
    },
    {
      id: 'cust-6',
      name: 'Sneha Kulkarni',
      phone: '98867 54231',
      email: 'sneha.k@example.com',
      address: '19, Garden Layout, Malleshwaram',
      createdAt: stamp(54),
    },
    {
      id: 'cust-7',
      name: 'Farhan Ali',
      phone: '97392 66408',
      email: 'farhan.ali@example.com',
      address: '31, Market Road, Frazer Town',
      createdAt: stamp(32),
    },
    {
      id: 'cust-8',
      name: 'Divya Menon',
      phone: '98458 77120',
      email: 'divya.menon@example.com',
      address: '7, Sunrise Enclave, Bellandur',
      createdAt: stamp(12),
    },
  ]

  const bikeSeeds = [
    { brand: 'Royal Enfield', model: 'Classic 350', regNo: 'KA 01 MJ 4821', engineNo: 'J3A5F1A104821', chassisNo: 'ME4J3A5F1A1048217', year: 2021, color: 'Stealth Black', odometer: 18420 },
    { brand: 'Honda', model: 'Activa 6G', regNo: 'KA 05 HR 7712', engineNo: 'JF77E1077120', chassisNo: 'ME4JF7710771204', year: 2022, color: 'Matte Grey', odometer: 9320 },
    { brand: 'Bajaj', model: 'Pulsar NS200', regNo: 'KA 02 AB 9087', engineNo: 'DHZBPB90870', chassisNo: 'MD2A36FZ9087012', year: 2020, color: 'Cocktail Red', odometer: 26110 },
    { brand: 'KTM', model: 'Duke 390', regNo: 'KA 01 ZZ 1008', engineNo: 'DUKE3901008', chassisNo: 'MD2JPJZ1008013', year: 2022, color: 'Electronic Orange', odometer: 11250 },
    { brand: 'TVS', model: 'Apache RTR 160', regNo: 'KA 04 XY 5521', engineNo: 'RTR16055210', chassisNo: 'MD2A11CX5521045', year: 2019, color: 'Pearl White', odometer: 33480 },
    { brand: 'Suzuki', model: 'Access 125', regNo: 'KA 06 QR 3344', engineNo: 'A125E133440', chassisNo: 'MB8CF4CA3344071', year: 2021, color: 'Metallic Silver', odometer: 15020 },
    { brand: 'Yamaha', model: 'FZ-S FI', regNo: 'KA 03 NP 2210', engineNo: 'G3D5E022100', chassisNo: 'ME1RG1232210038', year: 2023, color: 'Racing Blue', odometer: 6410 },
    { brand: 'Hero', model: 'Splendor Plus', regNo: 'KA 07 LM 6677', engineNo: 'HA10E166770', chassisNo: 'MBLHA10E1667709', year: 2018, color: 'Black & Silver', odometer: 41200 },
  ]

  const bikes = bikeSeeds.map((bike, index) => ({
    id: `bike-${index + 1}`,
    customerId: customers[index].id,
    ...bike,
    createdAt: customers[index].createdAt,
  }))

  const parts = [
    { id: 'part-1', name: 'Engine Oil 10W-30 (1L)', sku: 'OIL-1030', category: 'Lubricants', stock: 24, minStock: 10, price: 420, supplier: 'Shell Distributors' },
    { id: 'part-2', name: 'Oil Filter', sku: 'OF-221', category: 'Filters', stock: 18, minStock: 6, price: 180, supplier: 'Bosch Auto' },
    { id: 'part-3', name: 'Brake Pad Set (Front)', sku: 'BP-110', category: 'Braking', stock: 9, minStock: 6, price: 650, supplier: 'TVS Parts' },
    { id: 'part-4', name: 'Brake Pad Set (Rear)', sku: 'BP-111', category: 'Braking', stock: 4, minStock: 6, price: 720, supplier: 'TVS Parts' },
    { id: 'part-5', name: 'Chain Lube Spray', sku: 'CL-045', category: 'Lubricants', stock: 12, minStock: 5, price: 260, supplier: 'Motul India' },
    { id: 'part-6', name: 'Spark Plug', sku: 'SP-078', category: 'Engine', stock: 7, minStock: 8, price: 320, supplier: 'NGK' },
    { id: 'part-7', name: 'Air Filter', sku: 'AF-330', category: 'Filters', stock: 15, minStock: 6, price: 450, supplier: 'Bosch Auto' },
    { id: 'part-8', name: 'Clutch Cable', sku: 'CC-212', category: 'Transmission', stock: 3, minStock: 5, price: 380, supplier: 'TVS Parts' },
    { id: 'part-9', name: 'Battery 12V 5Ah', sku: 'BAT-12', category: 'Electrical', stock: 5, minStock: 3, price: 2400, supplier: 'Exide' },
    { id: 'part-10', name: 'Tyre Tube 90/90', sku: 'TT-090', category: 'Tyres', stock: 20, minStock: 8, price: 340, supplier: 'MRF' },
    { id: 'part-11', name: 'Headlight Bulb LED', sku: 'HL-501', category: 'Electrical', stock: 6, minStock: 4, price: 540, supplier: 'Philips' },
    { id: 'part-12', name: 'Coolant 1L', sku: 'COOL-1', category: 'Lubricants', stock: 10, minStock: 4, price: 310, supplier: 'Motul India' },
  ]

  const jobs = []
  let sequence = 1001

  const addJob = (data) => {
    const id = `job-${sequence}`
    const jobNo = `JC-${sequence}`
    sequence += 1
    const job = {
      id,
      jobNo,
      services: [],
      partsUsed: [],
      laborTotal: 0,
      partsTotal: 0,
      amount: 0,
      status: 'Pending',
      priority: 'Normal',
      progress: 0,
      notes: '',
      technicianId: null,
      createdAt: now.toISOString(),
      startedAt: null,
      completedAt: null,
      deliveredAt: null,
      paymentStatus: 'Unpaid',
      paymentMethod: null,
      paidAt: null,
      ...data,
    }
    job.amount = round(job.laborTotal + job.partsTotal)
    jobs.push(job)
    return job
  }

  const serviceSnapshot = (category) => ({
    id: category.id,
    name: category.name,
    price: category.price,
    duration: category.duration,
  })

  // Historical delivered jobs across the last ~5 months.
  for (let daysAgo = 152; daysAgo >= 1; daysAgo -= 1) {
    if (chance(0.16)) continue
    const count = randInt(1, 3)
    for (let i = 0; i < count; i += 1) {
      const index = randInt(0, customers.length - 1)
      const customer = customers[index]
      const bike = bikes[index]
      const technician = pick(technicians)
      const chosen = []
      const serviceCount = randInt(1, 2) + (chance(0.28) ? 1 : 0)
      while (chosen.length < serviceCount) {
        const category = pick(categories)
        if (!chosen.some((item) => item.id === category.id)) chosen.push(category)
      }
      const services = chosen.map(serviceSnapshot)
      const laborTotal = services.reduce((total, service) => total + service.price, 0)
      const partsUsed = []
      let partsTotal = 0
      if (chance(0.38)) {
        const part = pick(parts)
        const qty = part.category === 'Lubricants' ? 1 : randInt(1, 2)
        partsUsed.push({
          id: `used-${sequence}-${part.id}`,
          partId: part.id,
          name: part.name,
          qty,
          unitPrice: part.price,
        })
        partsTotal = part.price * qty
      }
      const createdAt = stamp(daysAgo, randInt(9, 17), randInt(0, 59))
      const completedAt = addHours(createdAt, 1)
      const paidAt = addHours(createdAt, 2)
      addJob({
        customerId: customer.id,
        bikeId: bike.id,
        technicianId: technician.id,
        services,
        laborTotal,
        partsUsed,
        partsTotal,
        amount: laborTotal + partsTotal,
        status: 'Delivered',
        priority: chance(0.12) ? 'High' : 'Normal',
        progress: 100,
        notes: '',
        createdAt,
        startedAt: addHours(createdAt, 0.2),
        completedAt,
        deliveredAt: paidAt,
        paymentStatus: 'Paid',
        paymentMethod: chance(0.5) ? 'UPI' : chance(0.55) ? 'Cash' : 'Card',
        paidAt,
      })
    }
  }

  // Today's completed and paid jobs.
  const sameer = technicians.find((tech) => tech.id === 'tech-3')
  const neha = technicians.find((tech) => tech.id === 'tech-6')

  const jobA = addJob({
    customerId: 'cust-8',
    bikeId: 'bike-8',
    technicianId: sameer.id,
    services: [serviceSnapshot(categories[1]), serviceSnapshot(categories[0])],
    laborTotal: 848,
    status: 'Delivered',
    progress: 100,
    createdAt: stamp(0, 8, 30),
    startedAt: stamp(0, 8, 45),
    completedAt: stamp(0, 9, 30),
    deliveredAt: stamp(0, 10, 0),
    paymentStatus: 'Paid',
    paymentMethod: 'UPI',
    paidAt: stamp(0, 10, 0),
  })

  const jobB = addJob({
    customerId: 'cust-1',
    bikeId: 'bike-1',
    technicianId: neha.id,
    services: [serviceSnapshot(categories[2]), serviceSnapshot(categories[3])],
    laborTotal: 748,
    status: 'Delivered',
    progress: 100,
    createdAt: stamp(0, 9, 10),
    startedAt: stamp(0, 9, 20),
    completedAt: stamp(0, 10, 15),
    deliveredAt: stamp(0, 10, 40),
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    paidAt: stamp(0, 10, 40),
  })

  // Finished but unpaid work, so collections and outstanding balances are visible.
  addJob({
    customerId: 'cust-6',
    bikeId: 'bike-6',
    technicianId: technicians[0].id,
    services: [serviceSnapshot(categories[0]), serviceSnapshot(categories[2])],
    laborTotal: 798,
    status: 'Delivered',
    priority: 'Normal',
    progress: 100,
    notes: 'Handed over after a test ride. Customer will settle the bill on their next visit.',
    createdAt: stamp(1, 15, 0),
    startedAt: stamp(1, 15, 10),
    completedAt: stamp(1, 16, 0),
    deliveredAt: stamp(1, 16, 30),
  })

  addJob({
    customerId: 'cust-2',
    bikeId: 'bike-2',
    technicianId: technicians[5].id,
    services: [serviceSnapshot(categories[7]), serviceSnapshot(categories[1])],
    laborTotal: 598,
    status: 'Completed',
    priority: 'Normal',
    progress: 100,
    notes: 'Ready for pickup. Invoice printed and waiting at the counter.',
    createdAt: stamp(1, 12, 10),
    startedAt: stamp(1, 12, 20),
    completedAt: stamp(1, 13, 5),
  })

  // Live jobs on the floor.
  const ravi = technicians.find((tech) => tech.id === 'tech-2')
  const priya = technicians.find((tech) => tech.id === 'tech-4')

  const activeOne = addJob({
    customerId: 'cust-3',
    bikeId: 'bike-3',
    technicianId: ravi.id,
    services: [serviceSnapshot(categories[0]), serviceSnapshot(categories[2])],
    laborTotal: 798,
    partsUsed: [
      { id: 'used-live-1', partId: 'part-3', name: 'Brake Pad Set (Front)', qty: 1, unitPrice: 650 },
    ],
    partsTotal: 650,
    status: 'In Progress',
    priority: 'Normal',
    progress: 55,
    notes: 'Front brake lever felt spongy. Replacing the pads and adjusting cable play.',
    createdAt: stamp(0, 9, 40),
    startedAt: stamp(0, 10, 5),
  })

  addJob({
    customerId: 'cust-4',
    bikeId: 'bike-4',
    technicianId: priya.id,
    services: [serviceSnapshot(categories[8]), serviceSnapshot(categories[3])],
    laborTotal: 1348,
    status: 'In Progress',
    priority: 'High',
    progress: 25,
    notes: 'Customer reported chain slack and a rattle above 4,000 rpm. Tuning and chain work in progress.',
    createdAt: stamp(0, 10, 15),
    startedAt: stamp(0, 10, 30),
  })

  addJob({
    customerId: 'cust-7',
    bikeId: 'bike-7',
    services: [serviceSnapshot(categories[0]), serviceSnapshot(categories[7])],
    laborTotal: 748,
    status: 'Pending',
    priority: 'High',
    progress: 0,
    notes: 'Walk-in customer waiting at the counter. Requested pickup by 6 PM.',
    createdAt: stamp(1, 17, 20),
  })

  technicians.forEach((technician) => {
    const hasActive = jobs.some(
      (job) => job.technicianId === technician.id && isActiveJob(job),
    )
    technician.status = hasActive ? 'Busy' : technician.status
    technician.completedJobs = jobs.filter(
      (job) => job.technicianId === technician.id && isCompletedJob(job),
    ).length
  })

  const activity = [
    {
      id: 'act-1',
      at: stamp(0, 10, 40),
      type: 'payment',
      message: '₹748 collected from Rahul Sharma via Cash',
    },
    {
      id: 'act-2',
      at: stamp(0, 10, 15),
      type: 'job',
      message: `Job ${jobB.jobNo} completed by Neha Joshi`,
    },
    {
      id: 'act-3',
      at: stamp(0, 10, 5),
      type: 'job',
      message: `Job ${activeOne.jobNo} started by Ravi Kumar`,
    },
    {
      id: 'act-4',
      at: stamp(0, 9, 40),
      type: 'job',
      message: `Job ${activeOne.jobNo} auto-assigned to Ravi Kumar`,
    },
    {
      id: 'act-5',
      at: stamp(0, 9, 30),
      type: 'job',
      message: `Job ${jobA.jobNo} completed by Sameer Khan`,
    },
    {
      id: 'act-6',
      at: stamp(0, 10, 0),
      type: 'payment',
      message: '₹848 collected from Divya Menon via UPI',
    },
    {
      id: 'act-7',
      at: stamp(1, 18, 10),
      type: 'stock',
      message: 'Brake Pad Set (Rear) dropped below its reorder level',
    },
    {
      id: 'act-8',
      at: stamp(1, 17, 20),
      type: 'job',
      message: 'Job created for Farhan Ali — waiting for an available technician',
    },
    {
      id: 'act-9',
      at: stamp(2, 11, 25),
      type: 'customer',
      message: 'Divya Menon registered with a Hero Splendor Plus',
    },
  ].sort((a, b) => new Date(b.at) - new Date(a.at))

  const users = [
    {
      id: 'usr-1',
      username: 'arjun.mehta',
      passwordHash: hashPassword('arjun123'),
      role: 'Technician',
      technicianId: 'tech-1',
      loginAccess: true,
      createdAt: stamp(800),
    },
    {
      id: 'usr-2',
      username: 'imran.khan',
      passwordHash: hashPassword('imran123'),
      role: 'Technician',
      technicianId: 'tech-7',
      loginAccess: true,
      createdAt: stamp(700),
    },
  ]

  return {
    customers,
    bikes,
    technicians,
    categories,
    jobs: jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    parts,
    users,
    activity,
    createdAt: now.toISOString(),
  }
}
