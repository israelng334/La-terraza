/**
 * Funciones utilitarias para la lógica de negocio
 */

function getTableCapacity(partySize, areaTables) {
  const sorted = [...areaTables].sort((a, b) => a.capacity - b.capacity);
  for (const t of sorted) {
    if (t.capacity >= partySize) return t.capacity;
  }
  return null;
}

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

module.exports = {
  getTableCapacity,
  isOverlapping,
  addMinutes
};
