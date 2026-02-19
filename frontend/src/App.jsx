import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

const areaPreferenceOptions = ['ANY', 'TERRACE', 'PATIO', 'LOBBY', 'BAR', 'VIP']

const initialAvailability = {
  date: '',
  startTime: '',
  partySize: 2,
  areaPreference: 'ANY',
}

const initialReservation = {
  customerName: '',
  date: '',
  startTime: '',
  partySize: 2,
  durationMinutes: 90,
  areaId: '',
  areaPreference: 'ANY',
  notes: '',
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const errorMessage = payload?.message ?? payload?.error ?? `Error ${response.status}`
    throw new Error(errorMessage)
  }

  return payload
}

function App() {
  const [health, setHealth] = useState('checking')
  const [areas, setAreas] = useState([])
  const [availabilityForm, setAvailabilityForm] = useState(initialAvailability)
  const [reservationForm, setReservationForm] = useState(initialReservation)
  const [availabilityResult, setAvailabilityResult] = useState(null)
  const [reservations, setReservations] = useState([])
  const [reservationDateFilter, setReservationDateFilter] = useState('')
  const [statusPayload, setStatusPayload] = useState({ id: '', status: 'CONFIRMED' })
  const [loading, setLoading] = useState({
    seed: false,
    availability: false,
    reservation: false,
    list: false,
    status: false,
  })
  const [feedback, setFeedback] = useState({ type: 'info', text: '' })

  const canFetchAvailability = useMemo(() => {
    return Boolean(availabilityForm.date && availabilityForm.startTime && availabilityForm.partySize)
  }, [availabilityForm])

  useEffect(() => {
    checkHealth()
    fetchAreas()
  }, [])

  async function checkHealth() {
    try {
      await apiRequest('/health')
      setHealth('up')
    } catch {
      setHealth('down')
    }
  }

  async function fetchAreas() {
    try {
      const data = await apiRequest('/areas')
      const areaList = Array.isArray(data) ? data : data?.data ?? []
      setAreas(areaList)
    } catch {
      setAreas([])
    }
  }

  async function handleSeed() {
    setLoading((prev) => ({ ...prev, seed: true }))
    setFeedback({ type: 'info', text: '' })
    try {
      await apiRequest('/seed', { method: 'POST' })
      await fetchAreas()
      setFeedback({ type: 'success', text: 'Seed ejecutado correctamente.' })
    } catch (error) {
      setFeedback({ type: 'error', text: `Seed falló: ${error.message}` })
    } finally {
      setLoading((prev) => ({ ...prev, seed: false }))
    }
  }

  async function handleCheckAvailability(event) {
    event.preventDefault()
    if (!canFetchAvailability) {
      return
    }

    setLoading((prev) => ({ ...prev, availability: true }))
    setFeedback({ type: 'info', text: '' })

    try {
      const params = new URLSearchParams({
        date: availabilityForm.date,
        partySize: String(availabilityForm.partySize),
        startTime: availabilityForm.startTime,
        areaPreference: availabilityForm.areaPreference,
      })

      const data = await apiRequest(`/availability?${params.toString()}`)
      setAvailabilityResult(data)
      setFeedback({ type: 'success', text: 'Disponibilidad consultada.' })
    } catch (error) {
      setAvailabilityResult(null)
      setFeedback({ type: 'error', text: `Disponibilidad: ${error.message}` })
    } finally {
      setLoading((prev) => ({ ...prev, availability: false }))
    }
  }

  async function handleCreateReservation(event) {
    event.preventDefault()

    setLoading((prev) => ({ ...prev, reservation: true }))
    setFeedback({ type: 'info', text: '' })

    const payload = {
      customerName: reservationForm.customerName,
      date: reservationForm.date,
      startTime: reservationForm.startTime,
      partySize: Number(reservationForm.partySize),
      durationMinutes: Number(reservationForm.durationMinutes),
      notes: reservationForm.notes,
    }

    if (reservationForm.areaId) {
      payload.areaId = reservationForm.areaId
    }

    if (reservationForm.areaPreference) {
      payload.areaPreference = reservationForm.areaPreference
    }

    try {
      const data = await apiRequest('/reservations', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setFeedback({ type: 'success', text: `Reserva creada (${data?.id ?? 'sin id'}).` })
      setReservationForm(initialReservation)
      if (reservationDateFilter) {
        await handleLoadReservations()
      }
    } catch (error) {
      setFeedback({ type: 'error', text: `Crear reserva: ${error.message}` })
    } finally {
      setLoading((prev) => ({ ...prev, reservation: false }))
    }
  }

  async function handleLoadReservations(event) {
    if (event) {
      event.preventDefault()
    }

    if (!reservationDateFilter) {
      setFeedback({ type: 'error', text: 'El filtro de fecha es obligatorio.' })
      return
    }

    setLoading((prev) => ({ ...prev, list: true }))
    setFeedback({ type: 'info', text: '' })

    try {
      const params = new URLSearchParams({ date: reservationDateFilter })
      const data = await apiRequest(`/reservations?${params.toString()}`)
      const reservationList = Array.isArray(data) ? data : data?.data ?? []
      setReservations(reservationList)
      setFeedback({ type: 'success', text: `Reservas cargadas: ${reservationList.length}.` })
    } catch (error) {
      setReservations([])
      setFeedback({ type: 'error', text: `Listar reservas: ${error.message}` })
    } finally {
      setLoading((prev) => ({ ...prev, list: false }))
    }
  }

  async function handleUpdateStatus(event) {
    event.preventDefault()
    if (!statusPayload.id) {
      setFeedback({ type: 'error', text: 'Debes indicar el ID de la reserva.' })
      return
    }

    setLoading((prev) => ({ ...prev, status: true }))
    setFeedback({ type: 'info', text: '' })

    try {
      await apiRequest(`/reservations/${statusPayload.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: statusPayload.status }),
      })
      setFeedback({ type: 'success', text: 'Estado actualizado.' })
      if (reservationDateFilter) {
        await handleLoadReservations()
      }
    } catch (error) {
      setFeedback({ type: 'error', text: `Actualizar estado: ${error.message}` })
    } finally {
      setLoading((prev) => ({ ...prev, status: false }))
    }
  }

  return (
    <main className="page">
      <header className="header">
        <h1>La Terraza · Reservas</h1>
        <p>Frontend MVP para demo del bootcamp</p>
        <div className="status-row">
          <span className={`pill ${health === 'up' ? 'ok' : health === 'down' ? 'error' : ''}`}>
            API: {health === 'up' ? 'UP' : health === 'down' ? 'DOWN' : 'Checking...'}
          </span>
          <button type="button" onClick={checkHealth} className="secondary-btn">
            Revalidar health
          </button>
          <button type="button" onClick={handleSeed} disabled={loading.seed} className="secondary-btn">
            {loading.seed ? 'Ejecutando seed...' : 'POST /seed'}
          </button>
        </div>
      </header>

      {feedback.text ? <p className={`feedback ${feedback.type}`}>{feedback.text}</p> : null}

      <section className="grid">
        <article className="card">
          <h2>Disponibilidad</h2>
          <form onSubmit={handleCheckAvailability} className="form">
            <label>
              Fecha
              <input
                type="date"
                value={availabilityForm.date}
                onChange={(event) =>
                  setAvailabilityForm((prev) => ({ ...prev, date: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Hora
              <input
                type="time"
                value={availabilityForm.startTime}
                onChange={(event) =>
                  setAvailabilityForm((prev) => ({ ...prev, startTime: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Personas
              <input
                type="number"
                min="1"
                max="20"
                value={availabilityForm.partySize}
                onChange={(event) =>
                  setAvailabilityForm((prev) => ({ ...prev, partySize: Number(event.target.value) }))
                }
                required
              />
            </label>
            <label>
              Preferencia de área
              <select
                value={availabilityForm.areaPreference}
                onChange={(event) =>
                  setAvailabilityForm((prev) => ({ ...prev, areaPreference: event.target.value }))
                }
              >
                {areaPreferenceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={!canFetchAvailability || loading.availability}>
              {loading.availability ? 'Consultando...' : 'GET /availability'}
            </button>
          </form>
          <pre>{availabilityResult ? JSON.stringify(availabilityResult, null, 2) : 'Sin resultados aún'}</pre>
        </article>

        <article className="card">
          <h2>Crear reserva</h2>
          <form onSubmit={handleCreateReservation} className="form">
            <label>
              Nombre cliente
              <input
                type="text"
                value={reservationForm.customerName}
                onChange={(event) =>
                  setReservationForm((prev) => ({ ...prev, customerName: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Fecha
              <input
                type="date"
                value={reservationForm.date}
                onChange={(event) => setReservationForm((prev) => ({ ...prev, date: event.target.value }))}
                required
              />
            </label>
            <label>
              Hora
              <input
                type="time"
                value={reservationForm.startTime}
                onChange={(event) =>
                  setReservationForm((prev) => ({ ...prev, startTime: event.target.value }))
                }
                required
              />
            </label>
            <label>
              Personas
              <input
                type="number"
                min="1"
                max="20"
                value={reservationForm.partySize}
                onChange={(event) =>
                  setReservationForm((prev) => ({ ...prev, partySize: Number(event.target.value) }))
                }
                required
              />
            </label>
            <label>
              Duración (min)
              <select
                value={reservationForm.durationMinutes}
                onChange={(event) =>
                  setReservationForm((prev) => ({ ...prev, durationMinutes: Number(event.target.value) }))
                }
              >
                <option value={90}>90</option>
                <option value={120}>120</option>
                <option value={180}>180</option>
              </select>
            </label>
            <label>
              Área específica (opcional)
              <select
                value={reservationForm.areaId}
                onChange={(event) => setReservationForm((prev) => ({ ...prev, areaId: event.target.value }))}
              >
                <option value="">Sin área fija</option>
                {areas.map((area) => (
                  <option key={area.id ?? area.areaId ?? area.name} value={area.id ?? area.areaId ?? ''}>
                    {area.name ?? area.label ?? area.id}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Preferencia de área
              <select
                value={reservationForm.areaPreference}
                onChange={(event) =>
                  setReservationForm((prev) => ({ ...prev, areaPreference: event.target.value }))
                }
              >
                {areaPreferenceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Notas
              <textarea
                rows="3"
                value={reservationForm.notes}
                onChange={(event) => setReservationForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </label>
            <button type="submit" disabled={loading.reservation}>
              {loading.reservation ? 'Creando...' : 'POST /reservations'}
            </button>
          </form>
        </article>

        <article className="card wide">
          <h2>Reservas y cambio de estado</h2>
          <form onSubmit={handleLoadReservations} className="inline-form">
            <label>
              Fecha
              <input
                type="date"
                value={reservationDateFilter}
                onChange={(event) => setReservationDateFilter(event.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={loading.list}>
              {loading.list ? 'Cargando...' : 'GET /reservations'}
            </button>
          </form>

          <form onSubmit={handleUpdateStatus} className="inline-form">
            <label>
              Reservation ID
              <input
                type="text"
                value={statusPayload.id}
                onChange={(event) => setStatusPayload((prev) => ({ ...prev, id: event.target.value }))}
                required
              />
            </label>
            <label>
              Estado
              <select
                value={statusPayload.status}
                onChange={(event) =>
                  setStatusPayload((prev) => ({ ...prev, status: event.target.value }))
                }
              >
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="PENDING">PENDING</option>
              </select>
            </label>
            <button type="submit" disabled={loading.status}>
              {loading.status ? 'Actualizando...' : 'PATCH /reservations/:id/status'}
            </button>
          </form>

          <div className="list">
            {reservations.length === 0 ? (
              <p>No hay reservas cargadas.</p>
            ) : (
              reservations.map((reservation) => (
                <div className="list-item" key={reservation.id ?? `${reservation.customerName}-${reservation.startTime}`}>
                  <strong>{reservation.customerName ?? 'Sin nombre'}</strong>
                  <span>{reservation.date} {reservation.startTime}</span>
                  <span>{reservation.partySize} personas</span>
                  <span>Estado: {reservation.status ?? 'N/A'}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <footer className="footer">
        <small>
          API Base URL: <strong>{API_BASE_URL}</strong>
        </small>
      </footer>
    </main>
  )
}

export default App
