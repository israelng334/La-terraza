# ERD — Restaurant Reservation System

## Entidades

### Área
- id (PK)
- nombre (único)
- límite_mesas

### Mesa
- id (PK)
- area_id (FK → Área)
- tipo (standard, circular, square)
- capacidad
- unida_con (opcional, para VIP)

### Reserva
- id (PK)
- nombre_cliente
- fecha
- hora_inicio
- duración
- party_size
- area_id (FK → Área)
- mesa_id (FK → Mesa, nullable)
- estado (pending, confirmed, cancelled)
- notas

## Relaciones
- Área 1—N Mesa
- Mesa 1—N Reserva (mesa puede estar en varias reservas, pero no solapadas)
- Área 1—N Reserva

## Índices recomendados
- Reserva: (fecha, area_id), (mesa_id, fecha, hora_inicio)
- Mesa: (area_id, capacidad)

## Notas de reglas
- Capacidad siempre redondea hacia arriba.
- VIP: manejo especial de mesas unidas y tipos.
- No se permite solape de reservas por mesa.
- Límite de mesas por área (8 normal, 3 VIP).
