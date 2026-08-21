import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppStateProvider } from './AppStateProvider';
import { useAppState } from './useAppState';

const authMock = vi.hoisted(() => ({
  token: '',
  logout: vi.fn(async () => undefined),
  login: vi.fn(async () => ({
    token: 'access-1',
    refreshToken: 'refresh-1',
    user: {
      id: 77,
      login: 'utilidades@seolocal.test',
      displayName: 'Usuario Utilidades',
      baseRole: 'client',
      roleCode: 'utilidades',
      roleName: 'Utilidades',
      permissions: ['utilidades.read', 'utilidades.manage'],
    },
  })),
  me: vi.fn(),
  clear: vi.fn(),
}));

vi.mock('@/services/adminApi', () => ({
  adminApi: {
    get token() {
      return authMock.token;
    },
    login: authMock.login,
    me: authMock.me,
    logout: authMock.logout,
  },
  clearAdminToken: authMock.clear,
}));

vi.mock('@/services/marketplaceApi', () => ({
  marketplaceApi: {
    getBootstrap: vi.fn(async () => ({
      categories: [],
      agencies: [],
      services: [],
      meta: { database: 'test' },
    })),
    getServices: vi.fn(async () => ({ items: [] })),
    createLead: vi.fn(),
    claimOffer: vi.fn(),
    createAgencyReview: vi.fn(),
    hireAgency: vi.fn(),
  },
}));

function Probe() {
  const { user, authLoading, login, logout } = useAppState();
  return (
    <div>
      <output data-testid="loading">{String(authLoading)}</output>
      <output data-testid="user">{user?.email ?? 'sin-usuario'}</output>
      <button type="button" onClick={() => void login('utilidades@seolocal.test', 'Utilidades2026!')}>Entrar</button>
      <button type="button" onClick={() => void logout()}>Salir</button>
    </div>
  );
}

describe('AppStateProvider autenticación viva', () => {
  beforeEach(() => {
    localStorage.clear();
    authMock.token = '';
    authMock.login.mockClear();
    authMock.logout.mockClear();
    authMock.clear.mockClear();
  });

  it('elimina el usuario de la memoria React después del logout', async () => {
    render(<AppStateProvider><Probe /></AppStateProvider>);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('utilidades@seolocal.test'));

    fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('sin-usuario'));
    expect(authMock.logout).toHaveBeenCalledTimes(1);
    expect(authMock.clear).toHaveBeenCalled();
  });
});
