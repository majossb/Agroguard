import { useQuery } from '@tanstack/react-query';
import { historyApi } from '../api/historyApi.js';
import { mapPaginatedDiagnosesResponse } from '../mappers/historyMapper.js';

/**
 * Hook para consultar el historial de diagnósticos con paginación y filtros fitopatológicos.
 * @param {{ page: number, pageSize: number, healthStatus?: string, cropKey?: string }} params
 */
export function useDiagnoses({ page = 1, pageSize = 12, healthStatus = '', cropKey = '' } = {}) {
  const query = useQuery({
    queryKey: ['diagnoses', { page, pageSize, healthStatus, cropKey }],
    queryFn: async () => {
      const apiParams = { page, pageSize };
      if (healthStatus && healthStatus !== 'ALL') apiParams.healthStatus = healthStatus;
      if (cropKey && cropKey !== 'ALL') apiParams.cropKey = cropKey;

      const data = await historyApi.listDiagnoses(apiParams);
      return mapPaginatedDiagnosesResponse(data);
    },
    staleTime: 30000,
  });

  return {
    items: query.data?.items || [],
    page: query.data?.page || page,
    pageSize: query.data?.pageSize || pageSize,
    totalItems: query.data?.totalItems || 0,
    totalPages: query.data?.totalPages || 1,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
