# EDGE_CASES.md

1. Si se intenta reservar en el pasado, respondemos 400/422.
2. Si se solicita una mesa para 7 personas, se asigna de 8 (si no hay, sugerimos alternativa o respondemos 422).
3. Si dos reservas se solapan en la misma mesa, respondemos 409.
4. Si se intenta agregar más mesas de las permitidas en un área, respondemos 409.
5. Si se cancela una reserva, la mesa queda disponible para ese horario.
6. Si se solicita VIP y no hay mesas libres, sugerimos otra área o respondemos 422.
7. Si una reserva termina exactamente cuando otra comienza, ambas son válidas.
8. Si se intenta unir mesas VIP y ya están ocupadas, respondemos 409.
9. Si se intenta reservar para más personas que la capacidad máxima de cualquier mesa, respondemos 422.
10. Si se intenta confirmar una reserva ya cancelada, respondemos 400.
