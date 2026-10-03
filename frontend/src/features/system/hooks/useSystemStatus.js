import { useQuery } from '@tanstack/react-query';
import { systemApi } from '../api/systemApi.js';
import { mapHealthResponse, mapModelInfoResponse } from '../mappers/systemMapper.js';

/**
 * Hook para consultar y supervisar el estado de salud y la versión del modelo de IA.
 */
export function useSystemStatus() {
  const healthQuery = useQuery({
    queryKey: ['system', 'health'],
    queryFn: async () => {
      const data = await systemApi.getHealth();
      return mapHealthResponse(data);
    },
    refetchInterval: 60000, // 1 minuto
    staleTime: 30000,
  });

  const modelQuery = useQuery({
    queryKey: ['system', 'model'],
    queryFn: async () => {
      const data = await systemApi.getModelInfo();
      return mapModelInfoResponse(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Si hay error en la consulta de salud o el estado no es UP, el servicio no está disponible
  const isOnline = healthQuery.isError ? false : (healthQuery.data?.isHealthy ?? true);
  const modelInfo = modelQuery.data || {
    name: 'AgroGuard',
    version: '1.0',
    classCount: 38,
    dataset: 'PlantVillage Dataset',
    metrics: null,
    evaluationNote: '',
  };

  return {
    isOnline,
    healthStatus: healthQuery.isError ? 'DOWN' : (healthQuery.data?.status || 'UNKNOWN'),
    modelInfo,
    isLoading: healthQuery.isLoading && !healthQuery.isError,
  };
}
