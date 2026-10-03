import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { httpClient, setRefreshHandler } from '../../shared/api/httpClient.js';
import { tokenStorage } from '../../shared/api/tokenStorage.js';
import { mapAuthResponse } from '../../features/auth/mappers/authMapper.js';

const AuthContext = createContext(null);

/**
 * Proveedor de contexto de autenticación y sesión.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const logout = useCallback(async () => {
    try {
      await httpClient('/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      tokenStorage.clearAccessToken();
      setUser(null);
      queryClient.clear(); // Limpiar toda la caché en memoria al cerrar sesión
    }
  }, [queryClient]);

  const refresh = useCallback(async () => {
    try {
      const rawData = await httpClient('/auth/refresh', {
        method: 'POST',
        isRetry: true, // Evita loops infinitos en httpClient
      });

      const data = mapAuthResponse(rawData);
      tokenStorage.setAccessToken(data.accessToken);
      setUser(data.user);
      return data.accessToken;
    } catch {
      tokenStorage.clearAccessToken();
      setUser(null);
      return null;
    }
  }, []);

  // Registrar manejador de refresco en httpClient
  useEffect(() => {
    setRefreshHandler(refresh);
  }, [refresh]);

  // Al montar, intentar recuperar la sesión existente mediante la cookie HttpOnly
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        await refresh();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const rawData = await httpClient('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = mapAuthResponse(rawData);
    tokenStorage.setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (email, password, fullName) => {
    const rawData = await httpClient('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });

    const data = mapAuthResponse(rawData);
    // Limpiar cualquier sesión residual del registro para exigir inicio de sesión explícito
    await httpClient('/auth/logout', { method: 'POST' }).catch(() => {});
    tokenStorage.clearAccessToken();
    setUser(null);

    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refresh,
    }),
    [user, isLoading, login, register, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder al contexto de autenticación
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
