import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api/catalogApi.js';
import { mapConditionDetail } from '../mappers/catalogMapper.js';

/**
 * Hook para obtener el detalle completo de una condición fitopatológica.
 * @param {string | null | undefined} classKey - Ej: 'Tomato___Early_blight'
 */
export function useConditionDetail(classKey) {
  const query = useQuery({
    queryKey: ['catalog', 'conditions', classKey],
    queryFn: async () => {
      const data = await catalogApi.getCondition(classKey);
      return mapConditionDetail(data);
    },
    enabled: typeof classKey === 'string' && classKey.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutos — dato público estático
    retry: 1,
  });

  return {
    condition: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
