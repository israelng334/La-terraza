

// --- IMPORTS AND APP INIT ---
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const YAML = require('yaml');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// --- MONGODB ATLAS CONNECTION ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://renderuser123:renderuser123@cluster0.i7gz58x.mongodb.net/?appName=Cluster0';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Load OpenAPI spec
const openapi = YAML.parse(fs.readFileSync(__dirname + '/../openapi.yaml', 'utf8'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));

// Health endpoint
app.get('/api/health', (req, res) => res.sendStatus(200));



// Import Mongoose models
const { Area, Table, Reservation } = require('./models');

// /seed endpoint
app.post('/api/seed', async (req, res) => {
  try {
    const seed = JSON.parse(fs.readFileSync(__dirname + '/../data/seed.json', 'utf8'));
    // Clear existing data
    await Area.deleteMany({});
    await Table.deleteMany({});
    await Reservation.deleteMany({});

    // Insert areas
    const areaDocs = seed.areas.map(area => ({
      id: area.id,
      name: area.name,
      maxTables: area.maxTables
    }));
    await Area.insertMany(areaDocs);

    // Insert tables
    const tableDocs = seed.areas.flatMap(area =>
      area.tables.map(table => ({
        id: table.id,
        type: table.type,
        capacity: table.capacity,
        areaId: area.id
      }))
    );
    await Table.insertMany(tableDocs);

    res.status(200).json({ message: 'Seeded to MongoDB' });
  } catch (e) {
    res.status(500).json({ error: 'Seed failed', details: e.message });
  }
});

// --- ENDPOINTS ---


// GET /areas - list all areas (MongoDB)
app.get('/api/areas', async (req, res) => {
  try {
    const areas = await Area.find({}, { _id: 0, __v: 0 });
    res.json(areas);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch areas', details: err.message });
  }
});


// POST /areas/{areaId}/tables - add a table to an area (MongoDB)
app.post('/api/areas/:areaId/tables', async (req, res) => {
  const { areaId } = req.params;
  const { type, capacity } = req.body;
  try {
    const area = await Area.findOne({ id: areaId });
    if (!area) return res.status(404).json({ error: 'Area not found' });
    const tablesInArea = await Table.find({ areaId });
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
    const newTable = new Table({
      id: `${areaId}_${Date.now()}`,
      type,
      capacity,
      areaId
    });
    await newTable.save();
    res.status(201).json(newTable);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add table', details: err.message });
  }
});


// GET /tables - list tables, optionally by areaId (MongoDB)
app.get('/api/tables', async (req, res) => {
  const { areaId } = req.query;
  try {
    let query = {};
    if (areaId) query.areaId = areaId;
    const tables = await Table.find(query, { _id: 0, __v: 0 });
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tables', details: err.message });
  }
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


// POST /reservations - create reservation (pending, no table assigned) (MongoDB)
app.post('/api/reservations', async (req, res) => {
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
  try {
    // Find area(s)
    let area = await Area.findOne({ id: (areaPreference || 'any').toLowerCase() });
    if (!area && areaPreference && areaPreference !== 'ANY') {
      return res.status(422).json({ error: 'Area not found' });
    }
    let candidateAreas = area ? [area] : await Area.find();
    let assignedArea = null;
    let assignedCapacity = null;
    for (const a of candidateAreas) {
      const tables = await Table.find({ areaId: a.id });
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
    const newRes = new Reservation({
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
    });
    await newRes.save();
    res.status(201).json(newRes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create reservation', details: err.message });
  }
});


// GET /reservations?date=YYYY-MM-DD&areaId=? (MongoDB)
app.get('/api/reservations', async (req, res) => {
  const { date, areaId } = req.query;
  try {
    let query = {};
    if (date) query.date = date;
    if (areaId) query.areaId = areaId;
    const results = await Reservation.find(query, { _id: 0, __v: 0 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reservations', details: err.message });
  }
});


// PATCH /reservations/{id}/status (MongoDB)
app.patch('/api/reservations/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const valid = ['pending', 'confirmed', 'cancelled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const resv = await Reservation.findOne({ id });
    if (!resv) return res.status(404).json({ error: 'Reservation not found' });
    if (resv.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot confirm a cancelled reservation' });
    }
    // On confirm, assign table if possible
    if (status === 'confirmed') {
      const tables = await Table.find({ areaId: resv.areaId, capacity: { $gte: resv.partySize } });
      let assigned = null;
      for (const t of tables) {
        const overlaps = await Reservation.findOne({
          tableId: t.id,
          date: resv.date,
          status: 'confirmed',
          $expr: { $function: {
            body: function(rStart, rDuration, sStart, sDuration) {
              function addMinutes(time, mins) {
                const [h, m] = time.split(':').map(Number);
                const date = new Date(2000, 0, 1, h, m);
                date.setMinutes(date.getMinutes() + mins);
                return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
              }
              const start1 = rStart;
              const end1 = addMinutes(rStart, rDuration || 90);
              const start2 = sStart;
              const end2 = addMinutes(sStart, sDuration || 90);
              return (start1 < end2 && start2 < end1);
            },
            args: ["$startTime", "$duration", resv.startTime, resv.duration || 90],
            lang: "js"
          }}
        });
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
    await resv.save();
    res.json(resv);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update reservation status', details: err.message });
  }
});


// GET /availability?date=YYYY-MM-DD&partySize=7&startTime=20:00&areaPreference=VIP|TERRACE|ANY (MongoDB)
app.get('/api/availability', async (req, res) => {
  const { date, partySize, startTime, areaPreference } = req.query;
  if (!date || !partySize || !startTime) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  const size = parseInt(partySize, 10);
  try {
    let areas = await Area.find();
    if (areaPreference && areaPreference !== 'ANY') {
      areas = areas.filter(a => a.id.toLowerCase() === areaPreference.toLowerCase());
      if (areas.length === 0) {
        return res.status(422).json({ error: 'Area not found' });
      }
    }
    let found = null;
    for (const area of areas) {
      const tables = await Table.find({ areaId: area.id, capacity: { $gte: size } });
      for (const t of tables) {
        const overlaps = await Reservation.findOne({
          tableId: t.id,
          date,
          status: 'confirmed',
          $expr: { $function: {
            body: function(rStart, rDuration, sStart, sDuration) {
              function addMinutes(time, mins) {
                const [h, m] = time.split(':').map(Number);
                const date = new Date(2000, 0, 1, h, m);
                date.setMinutes(date.getMinutes() + mins);
                return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
              }
              const start1 = rStart;
              const end1 = addMinutes(rStart, rDuration || 90);
              const start2 = sStart;
              const end2 = addMinutes(sStart, sDuration || 90);
              return (start1 < end2 && start2 < end1);
            },
            args: ["$startTime", "$duration", startTime, 90],
            lang: "js"
          }}
        });
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to check availability', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
