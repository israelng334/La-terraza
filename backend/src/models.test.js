const mongoose = require('mongoose');
const { Area, Table, Reservation } = require('./models');

describe('Mongoose Models', () => {
  // Desconectar después de todos los tests
  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Area Model', () => {
    it('debería crear un área válida con todos los campos requeridos', () => {
      const areaData = {
        id: 'area-1',
        name: 'Terrace',
        maxTables: 10
      };
      
      const area = new Area(areaData);
      
      expect(area.id).toBe('area-1');
      expect(area.name).toBe('Terrace');
      expect(area.maxTables).toBe(10);
    });

    it('debería fallar si falta un campo requerido (name)', () => {
      const areaData = {
        id: 'area-1',
        maxTables: 10
      };
      
      const area = new Area(areaData);
      const error = area.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    it('debería fallar si falta un campo requerido (id)', () => {
      const areaData = {
        name: 'Terrace',
        maxTables: 10
      };
      
      const area = new Area(areaData);
      const error = area.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.id).toBeDefined();
    });
  });

  describe('Table Model', () => {
    it('debería crear una mesa válida con todos los campos requeridos', () => {
      const tableData = {
        id: 'table-1',
        type: 'Round',
        capacity: 4,
        areaId: 'area-1'
      };
      
      const table = new Table(tableData);
      
      expect(table.id).toBe('table-1');
      expect(table.type).toBe('Round');
      expect(table.capacity).toBe(4);
      expect(table.areaId).toBe('area-1');
    });

    it('debería fallar si falta un campo requerido (capacity)', () => {
      const tableData = {
        id: 'table-1',
        type: 'Round',
        areaId: 'area-1'
      };
      
      const table = new Table(tableData);
      const error = table.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.capacity).toBeDefined();
    });
  });

  describe('Reservation Model', () => {
    it('debería crear una reserva válida con todos los campos requeridos', () => {
      const reservationData = {
        id: 'res-1',
        name: 'John Doe',
        date: '2024-02-20',
        startTime: '19:00',
        partySize: 4,
        areaId: 'area-1'
      };
      
      const reservation = new Reservation(reservationData);
      
      expect(reservation.id).toBe('res-1');
      expect(reservation.name).toBe('John Doe');
      expect(reservation.date).toBe('2024-02-20');
      expect(reservation.duration).toBe(90); // valor por defecto
      expect(reservation.status).toBe('pending'); // valor por defecto
    });

    it('debería crear una reserva con valores por defecto', () => {
      const reservationData = {
        id: 'res-2',
        name: 'Jane Smith',
        date: '2024-02-21',
        startTime: '20:00',
        partySize: 2,
        areaId: 'area-2'
      };
      
      const reservation = new Reservation(reservationData);
      
      expect(reservation.duration).toBe(90);
      expect(reservation.status).toBe('pending');
      expect(reservation.tableId).toBeNull();
      expect(reservation.notes).toBe('');
    });

    it('debería fallar si falta un campo requerido (name)', () => {
      const reservationData = {
        id: 'res-1',
        date: '2024-02-20',
        startTime: '19:00',
        partySize: 4,
        areaId: 'area-1'
      };
      
      const reservation = new Reservation(reservationData);
      const error = reservation.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    it('debería fallar si falta un campo requerido (partySize)', () => {
      const reservationData = {
        id: 'res-1',
        name: 'John Doe',
        date: '2024-02-20',
        startTime: '19:00',
        areaId: 'area-1'
      };
      
      const reservation = new Reservation(reservationData);
      const error = reservation.validateSync();
      
      expect(error).toBeDefined();
      expect(error.errors.partySize).toBeDefined();
    });
  });
});
