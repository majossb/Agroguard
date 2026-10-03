import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api/catalogApi.js';
import { mapConditionsResponse } from '../mappers/catalogMapper.js';

/**
 * Hook para listar condiciones del catálogo fitopatológico con filtros opcionales.
 * @param {{ cropKey?: string, isHealthy?: boolean }} [filters={}]
 */
export function useConditions(filters = {}) {
  const query = useQuery({
    queryKey: ['catalog', 'conditions', filters],
    queryFn: async () => {
      const data = await catalogApi.getConditions(filters);
      return mapConditionsResponse(data);
    },
    staleTime: 10 * 60 * 1000, // 10 minutos — dato público estático
  });

  return {
    conditions: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
