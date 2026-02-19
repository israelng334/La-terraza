# Restaurant Reservation System (Approach D)

## Descripción
Sistema de reservas para restaurante con gestión de áreas, mesas y disponibilidad, evitando sobre-reservas y errores de asignación. Permite agregar mesas, consultar disponibilidad y gestionar reservas según reglas de negocio y límites por área.

## URL pública
- [Pendiente de deploy]

## Cómo correr local
1. Instala dependencias:
   ```bash
   cd backend
   npm install
   ```
2. Inicia el servidor:
   ```bash
   npm start
   ```
3. Accede a Swagger UI en: `http://localhost:3000/api/docs`

## Cómo probar
- Usa Swagger UI (`/api/docs`) o importa la colección Postman (`/backend/postman_collection.json`).
- Ejemplos de requests en `/data/sample_requests.json`.

## Decisiones clave
- Modelo por área: las reservas no asignan mesa al crear, solo área/capacidad.
- Asignación de mesa ocurre al confirmar (no al crear).
- Lógica especial para VIP y mesas unidas.
- Capacidad siempre redondea hacia arriba.

## Limitaciones conocidas
- No hay autenticación.
- No hay pagos ni notificaciones.
- Solo soporta reglas y límites definidos.

## Estructura del proyecto
- `/backend`
  - `openapi.yaml` (contrato API)
  - `src/` (código fuente)
  - `data/` (semillas y ejemplos)
  - `tests/` (unitarios e integración)
  - `docs/` (diagramas y documentación)

## Cómo corren tests
```bash
npm test
```

## Checklist de endpoints
- [x] GET /health
- [x] POST /seed
- [x] GET /areas
- [x] POST /areas/{areaId}/tables
- [x] GET /tables?areaId=?
- [x] POST /reservations
- [x] PATCH /reservations/{id}/status
- [x] GET /reservations?date=YYYY-MM-DD&areaId=?
- [x] GET /availability?date=YYYY-MM-DD&partySize=7&startTime=20:00&areaPreference=VIP|TERRACE|ANY
