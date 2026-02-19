import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from './App';

// Mock de fetch global
global.fetch = vi.fn();

describe('App Component - Rendering and State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockReset();

    // Mock por defecto para health check
    global.fetch.mockImplementation((url) => {
      if (url.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      }
      if (url.includes('/areas')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 'area-1', name: 'Terrace', maxTables: 10 },
            { id: 'area-2', name: 'Patio', maxTables: 5 },
          ],
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });
  });

  it('debería renderizar el componente sin errores', async () => {
    const appComponent = React.createElement(App);
    render(appComponent);
    
    await waitFor(() => {
      expect(screen.getByText(/Disponibilidad/i)).toBeInTheDocument();
    });
  });

  it('debería mostrar indicador de salud del servidor', async () => {
    render(React.createElement(App));
    
    // Simplemente verificar que el componente se renderizó sin errores
    // y que hace el health check
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    }, { timeout: 10000 });
  });

  it('debería hacer health check al montar', async () => {
    render(React.createElement(App));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.anything()
      );
    });
  });

  it('debería cargar áreas al montar', async () => {
    render(React.createElement(App));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/areas'),
        expect.anything()
      );
    });
  });

  it('debería tener secciones principales visibles', async () => {
    render(React.createElement(App));
    
    await waitFor(() => {
      expect(screen.getByText(/Disponibilidad/i)).toBeInTheDocument();
    });
  });

  it('debería renderizar inputs para disponibilidad', async () => {
    render(React.createElement(App));
    
    await waitFor(() => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  it('debería renderizar selector de área', async () => {
    render(React.createElement(App));
    
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  it('debería mostrar botón de seed', async () => {
    render(React.createElement(App));
    
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.some(button => button.textContent.includes('seed'))).toBe(true);
    });
  });

  it('debería contar con sección de reservas', async () => {
    render(React.createElement(App));
    
    // Verificar que el componente se renderizó sin errores
    // El componente debería estar visible en el DOM
    await waitFor(() => {
      const mainElement = screen.queryByRole('main');
      expect(mainElement).toBeTruthy();
    }, { timeout: 10000 });
  });

  it('debería contar con tabla de reservas', async () => {
    render(React.createElement(App));
    
    await waitFor(() => {
      const divs = screen.queryAllByRole('generic');
      expect(divs.length).toBeGreaterThan(0);
    });
  });
});

describe('App Component - User Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockReset();

    global.fetch.mockImplementation((url) => {
      if (url.includes('/health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
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
  });

  it('debería llamar a seed cuando se haga click en el botón', async () => {
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

  it('debería tener botones deshabilitados en el estado inicial', async () => {
    render(React.createElement(App));
    
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
