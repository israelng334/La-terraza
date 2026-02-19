const { getTableCapacity, isOverlapping, addMinutes } = require('./utils');

describe('Utility Functions', () => {
  describe('getTableCapacity', () => {
    it('debería retornar la tabla más pequeña que cabe el tamaño del grupo', () => {
      const areaTables = [
        { id: 't1', capacity: 2 },
        { id: 't2', capacity: 4 },
        { id: 't3', capacity: 6 },
        { id: 't4', capacity: 8 }
      ];
      
      const result = getTableCapacity(3, areaTables);
      expect(result).toBe(4);
    });

    it('debería retornar exactamente la capacidad si existe una tabla de ese tamaño', () => {
      const areaTables = [
        { id: 't1', capacity: 2 },
        { id: 't2', capacity: 4 },
        { id: 't3', capacity: 6 }
      ];
      
      const result = getTableCapacity(4, areaTables);
      expect(result).toBe(4);
    });

    it('debería retornar null si no hay mesa disponible para ese tamaño', () => {
      const areaTables = [
        { id: 't1', capacity: 2 },
        { id: 't2', capacity: 3 }
      ];
      
      const result = getTableCapacity(5, areaTables);
      expect(result).toBeNull();
    });

    it('debería manejar una lista vacía de mesas', () => {
      const areaTables = [];
      
      const result = getTableCapacity(2, areaTables);
      expect(result).toBeNull();
    });

    it('debería retornar la tabla más pequeña disponible (ordenamiento correcto)', () => {
      const areaTables = [
        { id: 't1', capacity: 10 },
        { id: 't2', capacity: 2 },
        { id: 't3', capacity: 6 },
        { id: 't4', capacity: 4 }
      ];
      
      const result = getTableCapacity(4, areaTables);
      expect(result).toBe(4); // No 6 ni 10
    });
  });

  describe('isOverlapping', () => {
    it('debería detectar reservas que se solapan (segunda comienza antes que termine la primera)', () => {
      const res1 = {
        startTime: '19:00',
        duration: 90
      };
      const res2 = {
        startTime: '19:30',
        duration: 90
      };
      
      expect(isOverlapping(res1, res2)).toBe(true);
    });

    it('debería detectar reservas que se solapan (segunda comienza exactamente cuando termina primera)', () => {
      const res1 = {
        startTime: '19:00',
        duration: 90
      };
      const res2 = {
        startTime: '20:30',
        duration: 90
      };
      
      expect(isOverlapping(res1, res2)).toBe(false);
    });

    it('debería retornar false si las reservas no se solapan', () => {
      const res1 = {
        startTime: '19:00',
        duration: 90
      };
      const res2 = {
        startTime: '21:00',
        duration: 90
      };
      
      expect(isOverlapping(res1, res2)).toBe(false);
    });

    it('debería manejar duraciones personalizadas', () => {
      const res1 = {
        startTime: '19:00',
        duration: 120
      };
      const res2 = {
        startTime: '20:30',
        duration: 90
      };
      
      expect(isOverlapping(res1, res2)).toBe(true);
    });

    it('debería detectar solapamiento total (segunda dentro de primera)', () => {
      const res1 = {
        startTime: '19:00',
        duration: 180
      };
      const res2 = {
        startTime: '19:30',
        duration: 60
      };
      
      expect(isOverlapping(res1, res2)).toBe(true);
    });
  });

  describe('addMinutes', () => {
    it('debería sumar minutos correctamente dentro de la misma hora', () => {
      const result = addMinutes('19:00', 30);
      expect(result).toBe('19:30');
    });

    it('debería sumar minutos correctamente atravesando horas', () => {
      const result = addMinutes('19:45', 30);
      expect(result).toBe('20:15');
    });

    it('debería manejar múltiples horas', () => {
      const result = addMinutes('19:00', 180);
      expect(result).toBe('22:00');
    });

    it('debería manejar 0 minutos', () => {
      const result = addMinutes('19:30', 0);
      expect(result).toBe('19:30');
    });

    it('debería rellenar con ceros en formato HH:MM', () => {
      const result = addMinutes('09:05', 5);
      expect(result).toBe('09:10');
    });

    it('debería pasar de medianoche correctamente', () => {
      const result = addMinutes('23:45', 30);
      expect(result).toBe('00:15'); // El resultado se reinicia en el mismo día (formato 24h)
    });
  });
});
