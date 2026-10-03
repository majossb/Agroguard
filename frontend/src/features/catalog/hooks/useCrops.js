import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '../api/catalogApi.js';
import { mapCropsResponse } from '../mappers/catalogMapper.js';

/**
 * Hook para consultar y listar los cultivos soportados.
 */
export function useCrops() {
  const query = useQuery({
    queryKey: ['catalog', 'crops'],
    queryFn: async () => {
      const data = await catalogApi.getCrops();
      return mapCropsResponse(data);
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  return {
    crops: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
