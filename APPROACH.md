# Approach D — Modelo por área (capacidad por zona) + asignación posterior

## ¿Por qué Approach D?
1. Refleja la operación real: en la práctica, las reservas se hacen por área y capacidad, no por mesa específica.
2. Permite máxima flexibilidad: la asignación de mesa se realiza justo antes del servicio, optimizando ocupación.
3. Reduce errores humanos: evita sobre-reservas y asignaciones ineficientes.

## Trade-offs
- Menos control sobre la mesa exacta al reservar (pero más eficiente para el negocio).
- Lógica de asignación más compleja al confirmar reservas.

## ¿Qué haríamos distinto en 1 semana?
- Agregaríamos autenticación y roles (host, admin).
- Integraríamos notificaciones automáticas (email/SMS).

## Prioridad asumida
- Priorizamos evitar sobre-reservas y maximizar ocupación eficiente.
- Negociamos que la asignación de mesa sea posterior, no al crear la reserva.
