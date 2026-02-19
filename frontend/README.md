# La Terraza - Frontend (React)

Frontend para consumir la API de reservas del bootcamp.

## Requisitos

- Node.js 20+
- API backend corriendo y accesible

## Configuración

Crear un archivo `.env` en la raíz:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

Si el backend está desplegado, colocar la URL pública.

## Ejecutar

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Pantallas incluidas

- Health check de la API
- Ejecutar seed
- Consultar disponibilidad (`GET /availability`)
- Crear reserva (`POST /reservations`)
- Listar reservas por fecha (`GET /reservations`)
- Actualizar estado (`PATCH /reservations/:id/status`)
