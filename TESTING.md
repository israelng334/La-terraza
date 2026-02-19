# Testing Documentation

Este documento proporciona instrucciones sobre cómo ejecutar los tests unitarios e integration tests del proyecto.

## Backend Tests

### Instalación de Dependencias

```bash
cd backend
npm install
```

Las dependencias de testing han sido agregadas:
- `jest` - Framework de testing
- `supertest` - HTTP assertions
- `mongodb-memory-server` - Base de datos en memoria para testing

### Tests Disponibles

#### Unit Tests

1. **models.test.js** - Tests para validación de esquemas de Mongoose
   - Area model validation
   - Table model validation
   - Reservation model validation

2. **utils.test.js** - Tests para funciones de lógica de negocio
   - `getTableCapacity()` - Encontrar mesa apropiada por tamaño
   - `isOverlapping()` - Detectar reservas que se solapan
   - `addMinutes()` - Cálculo de tiempo

#### Integration Tests

3. **integration.test.js** - Tests de endpoints HTTP
   - Health check
   - CRUD para áreas, mesas, reservas
   - Validación de errores
   - Flujo completo de reserva

### Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ver cobertura de tests
npm run test:coverage

# Ejecutar solo unit tests
npm test -- --testPathPattern="models|utils"

# Ejecutar solo integration tests
npm test -- integration.test.js

# Ejecutar tests de un archivo específico
npm test -- src/models.test.js

# Ejecutar con output verbose
npm test -- --verbose
```

**Nota sobre Integration Tests:**
Los integration tests requieren que el servidor esté ejecutándose en `http://localhost:3000`. 
Si el servidor no está disponible, los tests se saltarán automáticamente.

Para ejecutar integration tests:
```bash
# Terminal 1: Iniciar servidor
npm start

# Terminal 2 (en otra ventana): Ejecutar solo integration tests
npm test -- integration.test.js
```

---

## Frontend Tests

### Instalación de Dependencias

```bash
cd frontend
npm install
```

Las dependencias de testing han sido agregadas:
- `vitest` - Framework de testing (alternativa moderna a Jest)
- `@testing-library/react` - Utilidades para testing de componentes
- `@testing-library/jest-dom` - Matchers personalizados
- `@vitest/ui` - Interfaz visual para Vitest

### Tests Disponibles

#### Unit Tests

1. **utils.test.js** - Tests para la función `apiRequest()`
   - GET requests
   - POST requests
   - Manejo de headers personalizados
   - Manejo de errores
   - Respuestas inválidas

2. **App.test.js** - Tests para el componente principal
   - Renderizado sin errores
   - Carga de datos iniciales
   - Cambios de estado
   - Interacciones con botones
   - Visibilidad de elementos

#### Integration Tests

3. **integration.test.js** - Tests del flujo completo de la aplicación
   - Flujo completo de reserva
   - Carga de datos iniciales
   - Interacciones entre componentes
   - Manejo de errores de red
   - Estados de loading

### Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo UI (interfaz visual)
npm run test:ui

# Ver cobertura de tests
npm run test:coverage

# Ejecutar tests en modo watch
npm test -- --watch

# Ejecutar un archivo de test específico
npm test -- App.test.js

# Ejecutar solo tests que coincidan con un patrón
npm test -- utils

# Ejecutar con output verbose
npm test -- --reporter=verbose
```

### Interfaz Visual de Vitest

```bash
npm run test:ui
```

Esto abre una interfaz web donde puedes:
- Ver todos los tests en tempo real
- Hacer click para ejecutar tests específicos
- Ver resultados, errores y cobertura
- Filtrar y buscar tests

---

## Estructura de Tests

### Backend

```
backend/
├── jest.config.js              # Configuración de Jest
├── package.json               # Scripts de test
└── src/
    ├── models.test.js         # Unit tests - Modelos
    ├── utils.test.js          # Unit tests - Utilidades
    ├── integration.test.js    # Integration tests
    ├── utils.js               # Funciones de utilidad
    ├── models.js              # Esquemas de Mongoose
    └── index.js               # Servidor Express
```

### Frontend

```
frontend/
├── vitest.config.js           # Configuración de Vitest
├── package.json              # Scripts de test
└── src/
    ├── App.test.js           # Unit tests - Componente App
    ├── utils.test.js         # Unit tests - Función apiRequest
    ├── integration.test.js   # Integration tests
    ├── App.jsx               # Componente principal
    └── main.jsx              # Entry point
```

---

## Cobertura de Tests

### Backend

Los tests cubren:
- ✓ Validación de modelos (5 tests)
- ✓ Lógica de negocio (9 tests)
- ✓ Endpoints HTTP (10 tests)
- ✓ Manejo de errores (5 tests)

**Total: 29 tests**

### Frontend

Los tests cubren:
- ✓ Función apiRequest (9 tests)
- ✓ Componente App - Casos básicos (12 tests)
- ✓ Componente App - Interacciones (2 tests)
- ✓ Flujo completo de reserva (13 tests)
- ✓ Escenarios de error (3 tests)

**Total: 39 tests**

---

## Debugging Tests

### Backend con Jest

```bash
# Ejecutar en debug mode
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Ejecutar solo un test
npm test -- --testNamePattern="debería crear un área válida"

# Ejecutar con output detallado
npm test -- --verbose --no-coverage
```

### Frontend con Vitest

```bash
# Ejecutar con output detallado
npm test -- --reporter=verbose

# Ejecutar solo tests que coincidan
npm test -- --grep "apiRequest"

# Usar interfaz de debugging
npm run test:ui
```

---

## Mejores Prácticas

1. **Mantener tests independientes** - Los tests no deben depender unos de otros
2. **Usar mocks** - Mockear dependencias externas (API, BD)
3. **Descripppiones claras** - Usar `describe` y `it` con textos descriptivos
4. **Cleanup** - Limpiar estado después de cada test (beforeEach/afterEach)
5. **Assertions específicas** - Testear comportamientos concretos, no solo que el código no falle
6. **Cobertura razonable** - Apuntar a 80%+ de cobertura, pero no obsesionarse

---

## Análisis de Cobertura

Para ver un reporte HTML detallado de la cobertura:

### Backend
```bash
npm run test:coverage
# Revisar: ./coverage/index.html
```

### Frontend
```bash
npm run test:coverage
# Revisar: ./coverage/index.html
```

---

## Troubleshooting

### Backend

**Problema:** Tests no encuentran módulos
```bash
# Solución: Asegúrate de que las imports usen rutas correctas
# Usa rutas relativas: ./models not /models
```

**Problema:** MongoDB connection timeout
```bash
# Los unit tests de modelos no requieren BD
# Solo integration.test.js requiere servidor activo
```

### Frontend

**Problema:** "Cannot find module 'react'" 
```bash
npm install react react-dom
```

**Problema:** Tests en jsdom no funcionan
```bash
# Verificar que vitest.config.js tiene environment: 'jsdom'
```

**Problema:** Fetch is not defined
```bash
# Los tests mockan fetch globalmente
# Si hay problemas, verificar que beforeEach() limpia los mocks
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm install && npm test
      
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm install && npm test
```

---

## Próximos Pasos

- [ ] Aumentar cobertura a 90%+
- [ ] Agregar tests de performance
- [ ] Usar test snapshots para UI
- [ ] Configurar CI/CD pipeline
- [ ] Agregar tests de accesibilidad (a11y)
- [ ] Agregar e2e tests con Playwright/Cypress

---

Para más información:
- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
