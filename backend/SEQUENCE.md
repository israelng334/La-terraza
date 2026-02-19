# SEQUENCE.md

## Secuencia: POST /reservations (flujo completo)

1. Cliente envía solicitud de reserva (área, fecha, hora, party size).
2. Backend valida:
   - Fecha/hora futura
   - Capacidad redondeada
   - Límite de mesas por área
3. Reserva se crea en estado "pending" (sin mesa asignada).
4. (Opcional) Al confirmar, se asigna mesa disponible según reglas.
5. Responde con detalles y estado.

---

## Secuencia: GET /availability (cómo calcula)

1. Cliente consulta disponibilidad (fecha, hora, party size, área preferida).
2. Backend filtra áreas y mesas según preferencia y capacidad.
3. Busca mesas libres (sin solape en ese horario).
4. Si hay mesa adecuada, responde con opciones.
5. Si no, responde 422 y sugiere alternativas si es posible.
