
// --- IMPORTS AND APP INIT ---
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const YAML = require('yaml');

const app = express();
app.use(cors());
app.use(express.json());

// Load OpenAPI spec
const openapi = YAML.parse(fs.readFileSync(__dirname + '/../openapi.yaml', 'utf8'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));

// Health endpoint
app.get('/api/health', (req, res) => res.sendStatus(200));

// In-memory storage
let db = {
  areas: [],
  tables: [],
  reservations: []
};

// /seed endpoint
app.post('/api/seed', (req, res) => {
  try {
    const seed = JSON.parse(fs.readFileSync(__dirname + '/../data/seed.json', 'utf8'));
    db.areas = seed.areas.map(area => ({ ...area, tables: undefined }));
    db.tables = seed.areas.flatMap(area =>
      area.tables.map(table => ({ ...table, areaId: area.id }))
    );
    db.reservations = [];
    res.status(200).json({ message: 'Seeded' });
  } catch (e) {
    res.status(500).json({ error: 'Seed failed', details: e.message });
  }
});

// --- ENDPOINTS ---

// GET /areas - list all areas
app.get('/api/areas', (req, res) => {
  res.json(db.areas.map(area => ({
    id: area.id,
    name: area.name,
    maxTables: area.maxTables
  })));
});

// POST /areas/{areaId}/tables - add a table to an area
app.post('/api/areas/:areaId/tables', (req, res) => {
  const { areaId } = req.params;
  const { type, capacity } = req.body;
  const area = db.areas.find(a => a.id === areaId);
  if (!area) return res.status(404).json({ error: 'Area not found' });
  const tablesInArea = db.tables.filter(t => t.areaId === areaId);
  if (tablesInArea.length >= area.maxTables) {
    return res.status(409).json({ error: 'Area table limit reached' });
  }
  if (!type || !capacity || typeof capacity !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }
  // VIP special: only allow 3 tables max
  if (areaId === 'vip' && tablesInArea.length >= 3) {
    return res.status(409).json({ error: 'VIP area table limit reached' });
  }
  const newTable = {
    id: `${areaId}_${Date.now()}`,
    type,
    capacity,
    areaId
  };
  db.tables.push(newTable);
  res.status(201).json(newTable);
});

// GET /tables - list tables, optionally by areaId
app.get('/api/tables', (req, res) => {
  const { areaId } = req.query;
  let tables = db.tables;
  if (areaId) {
    tables = tables.filter(t => t.areaId === areaId);
  }
  res.json(tables);
});

// Helper: round up to next table capacity
function getTableCapacity(partySize, areaTables) {
  const sorted = [...areaTables].sort((a, b) => a.capacity - b.capacity);
  for (const t of sorted) {
    if (t.capacity >= partySize) return t.capacity;
  }
  return null;
}

// Helper: check for overlapping reservations
function isOverlapping(res1, res2) {
  const start1 = res1.startTime;
  const end1 = addMinutes(start1, res1.duration || 90);
  const start2 = res2.startTime;
  const end2 = addMinutes(start2, res2.duration || 90);
  return (start1 < end2 && start2 < end1);
}

function addMinutes(time, mins) {
  const [h, m] = time.split(':').map(Number);
  const date = new Date(2000, 0, 1, h, m);
  date.setMinutes(date.getMinutes() + mins);
  return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
}

// POST /reservations - create reservation (pending, no table assigned)
app.post('/api/reservations', (req, res) => {
  const { name, date, startTime, partySize, areaPreference, duration, notes } = req.body;
  if (!name || !date || !startTime || !partySize) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Validate future date
  const now = new Date();
  const resDate = new Date(date + 'T' + startTime);
  if (resDate < now) {
    return res.status(422).json({ error: 'Cannot reserve in the past' });
  }
  // Find area
  let area = db.areas.find(a => a.id === (areaPreference || 'any').toLowerCase());
  if (!area && areaPreference && areaPreference !== 'ANY') {
    return res.status(422).json({ error: 'Area not found' });
  }
  // If ANY, pick area with available table
  let candidateAreas = area ? [area] : db.areas;
  let assignedArea = null;
  let assignedCapacity = null;
  for (const a of candidateAreas) {
    const tables = db.tables.filter(t => t.areaId === a.id);
    const cap = getTableCapacity(partySize, tables);
    if (cap) {
      assignedArea = a;
      assignedCapacity = cap;
      break;
    }
  }
  if (!assignedArea) {
    return res.status(422).json({ error: 'No suitable table available' });
  }
  // Create reservation (pending, no table assigned yet)
  const newRes = {
    id: 'r' + Date.now(),
    name,
    date,
    startTime,
    duration: duration || 90,
    partySize,
    areaId: assignedArea.id,
    tableId: null,
    status: 'pending',
    notes: notes || ''
  };
  db.reservations.push(newRes);
  res.status(201).json(newRes);
});

// GET /reservations?date=YYYY-MM-DD&areaId=?
app.get('/api/reservations', (req, res) => {
  const { date, areaId } = req.query;
  let results = db.reservations;
  if (date) results = results.filter(r => r.date === date);
  if (areaId) results = results.filter(r => r.areaId === areaId);
  res.json(results);
});

// PATCH /reservations/{id}/status
app.patch('/api/reservations/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'cancelled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const resv = db.reservations.find(r => r.id === id);
  if (!resv) return res.status(404).json({ error: 'Reservation not found' });
  if (resv.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot confirm a cancelled reservation' });
  }
  // On confirm, assign table if possible
  if (status === 'confirmed') {
    // Find available table
    const tables = db.tables.filter(t => t.areaId === resv.areaId && t.capacity >= resv.partySize);
    let assigned = null;
    for (const t of tables) {
      const overlaps = db.reservations.some(r =>
        r.tableId === t.id && r.date === resv.date && r.status === 'confirmed' && isOverlapping(r, resv)
      );
      if (!overlaps) {
        assigned = t;
        break;
      }
    }
    if (!assigned) {
      return res.status(409).json({ error: 'No available table for this reservation' });
    }
    resv.tableId = assigned.id;
  }
  resv.status = status;
  res.json(resv);
});

// GET /availability?date=YYYY-MM-DD&partySize=7&startTime=20:00&areaPreference=VIP|TERRACE|ANY
app.get('/api/availability', (req, res) => {
  const { date, partySize, startTime, areaPreference } = req.query;
  if (!date || !partySize || !startTime) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  const size = parseInt(partySize, 10);
  let areas = db.areas;
  if (areaPreference && areaPreference !== 'ANY') {
    areas = areas.filter(a => a.id.toLowerCase() === areaPreference.toLowerCase());
    if (areas.length === 0) {
      return res.status(422).json({ error: 'Area not found' });
    }
  }
  let found = null;
  for (const area of areas) {
    const tables = db.tables.filter(t => t.areaId === area.id && t.capacity >= size);
    for (const t of tables) {
      const overlaps = db.reservations.some(r =>
        r.tableId === t.id && r.date === date && r.status === 'confirmed' &&
        isOverlapping(r, { startTime, duration: 90 })
      );
      if (!overlaps) {
        found = { area: area.name, table: t };
        break;
      }
    }
    if (found) break;
  }
  if (!found) {
    return res.status(422).json({ error: 'No suitable table available' });
  }
  res.json(found);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
