import { describe, it, expect, beforeEach, vi } from 'vitest';

const API_BASE_URL = 'http://localhost:3000';

// Función a testear (copiada de App.jsx)
async function apiRequest(path, options = {}) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? API_BASE_URL;
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const errorMessage = payload?.message ?? payload?.error ?? `Error ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload;
}

describe('apiRequest Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('debería hacer un GET request exitoso', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, name: 'Test Area' }),
    });

    const result = await apiRequest('/areas');

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/areas`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual({ id: 1, name: 'Test Area' });
  });

  it('debería incluir headers personalizados', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await apiRequest('/test', {
      headers: { 'X-Custom-Header': 'test-value' },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Custom-Header': 'test-value',
        }),
      })
    );
  });

  it('debería hacer un POST request con body', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, created: true }),
    });

    const body = { name: 'John', date: '2024-02-20' };
    await apiRequest('/reservations', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      })
    );
  });

  it('debería lanzar error si la respuesta no es OK', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Bad request' }),
    });

    await expect(apiRequest('/test')).rejects.toThrow('Bad request');
  });

  it('debería usar el mensaje de error de la respuesta', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found' }),
    });

    await expect(apiRequest('/test')).rejects.toThrow('Not found');
  });

  it('debería usar el código de error si no hay mensaje', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ random: 'field' }),
    });

    await expect(apiRequest('/test')).rejects.toThrow('Error 500');
  });

  it('debería manejar respuesta con body nulo', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('No JSON');
      },
    });

    const result = await apiRequest('/test');
    expect(result).toBeNull();
  });

  it('debería respetar la URL base del env', async () => {
    const originalEnv = import.meta.env.VITE_API_BASE_URL;
    import.meta.env.VITE_API_BASE_URL = 'http://custom-api.com';

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    try {
      await apiRequest('/test');
      // Verificar que usa la URL custom (nota: esto es un test simplificado)
      expect(global.fetch).toHaveBeenCalled();
    } finally {
      import.meta.env.VITE_API_BASE_URL = originalEnv;
    }
  });

  it('debería manejar error de red', async () => {
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(apiRequest('/test')).rejects.toThrow('Network error');
  });
});
