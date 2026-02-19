const mongoose = require('mongoose');

const AreaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  maxTables: { type: Number, required: true }
});

const TableSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  capacity: { type: Number, required: true },
  areaId: { type: String, required: true }
});

const ReservationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  duration: { type: Number, default: 90 },
  partySize: { type: Number, required: true },
  areaId: { type: String, required: true },
  tableId: { type: String, default: null },
  status: { type: String, default: 'pending' },
  notes: { type: String, default: '' }
});

module.exports = {
  Area: mongoose.model('Area', AreaSchema),
  Table: mongoose.model('Table', TableSchema),
  Reservation: mongoose.model('Reservation', ReservationSchema)
};
