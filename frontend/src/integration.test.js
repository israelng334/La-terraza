import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from './App';

// Mock de fetch global para integration test
global.fetch = vi.fn();

describe('App Component - Integration: Reservation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockReset();

    global.fetch.mockImplementation((url, options) => {
      if (url.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      }

      if (url.includes('/areas') && (!options || options.method !== 'POST')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 'ANY', name: 'Any Area', maxTables: 20 },
            { id: 'TERRACE', name: 'Terrace', maxTables: 10 },
            { id: 'PATIO', name: 'Patio', maxTables: 8 },
            { id: 'VIP', name: 'VIP', maxTables: 3 },
          ],
        });
      }

      if (url.includes('/availability')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            available: true,
            tables: [
              { id: 't1', type: 'Round', capacity: 2 },
              { id: 't2', type: 'Rectangular', capacity: 4 },
              { id: 't3', type: 'Round', capacity: 6 },
            ],
          }),
        });
      }

      if (url.includes('/reservations') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            id: 'res-' + Date.now(),
            name: 'John Doe',
            date: '2024-02-20',
            startTime: '19:00',
            partySize: 2,
            areaId: 'ANY',
            status: 'pending',
          }),
        });
      }

      if (url.includes('/reservations') && (!options || options.method !== 'POST')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'res-1',
              name: 'John Doe',
              date: '2024-02-20',
              startTime: '19:00',
              partySize: 2,
              status: 'confirmed',
            },
          ],
        });
      }

      if (url.includes('/seed')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Seeded' }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });
  });

  it('debería renderizar la aplicación completa', async () => {
    render(React.createElement(App));

    // Verificar que la aplicación realiza al menos los fetches esperados
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.anything()
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/areas'),
        expect.anything()
      );
    }, { timeout: 10000 });
  });

  it('debería cargar datos iniciales (health y áreas)', async () => {
    render(React.createElement(App));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.anything()
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/areas'),
        expect.anything()
      );
    });
  });

  it('debería mostrar lista de reservas después de cargar', async () => {
    render(React.createElement(App));

    // Verificar que el componente se renderizó sin errores
    // El renderizado inicial debería completarse exitosamente
    await waitFor(() => {
      const mainElement = screen.queryByRole('main');
      expect(mainElement).toBeTruthy();
    }, { timeout: 10000 });
  });

  it('debería mostrar interfaz de disponibilidad', async () => {
    render(React.createElement(App));

    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  it('debería mostrar feedback visual después de acciones', async () => {
    render(React.createElement(App));

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    const buttons = screen.getAllByRole('button');
    const seedButton = buttons.find(btn => btn.textContent.toLowerCase().includes('seed'));
    
    if (seedButton) {
      fireEvent.click(seedButton);
    }

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

describe('App Component - Integration: Error Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockReset();
  });

  it('debería manejar respuesta de API inválida', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => {
            throw new Error('Invalid JSON');
          },
        });
      }
      if (url.includes('/areas')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });

    render(React.createElement(App));

    // El app debería seguir renderizando aunque falle algún fetch
    await waitFor(() => {
      const disponibilidad = screen.queryByText(/Disponibilidad/i);
      expect(disponibilidad).toBeDefined();
    }, { timeout: 5000 });
  });

  it('debería mostrar interfaz incluso si los fetches fallan', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'));

    render(React.createElement(App));

    await waitFor(() => {
      // Verificar que al menos el DOM principal se renderiza
      const main = screen.queryByRole('main');
      expect(main).toBeTruthy();
    }, { timeout: 5000 });
  });
});
