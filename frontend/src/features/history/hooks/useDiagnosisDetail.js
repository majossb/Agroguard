import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { historyApi } from '../api/historyApi.js';
import { mapDiagnosisResponse } from '../../diagnosis/mappers/diagnosisMapper.js';
import { mapFeedbackResponse } from '../mappers/historyMapper.js';

/**
 * Hook para consultar y gestionar un diagnóstico individual por su ID.
 * @param {string} id
 */
export function useDiagnosisDetail(id) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['diagnoses', id],
    queryFn: async () => {
      const data = await historyApi.getDiagnosis(id);
      return mapDiagnosisResponse(data);
    },
    enabled: Boolean(id),
    staleTime: 60000,
  });

  const deleteMutation = useMutation({
    mutationFn: () => historyApi.deleteDiagnosis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnoses'] });
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (feedbackData) => {
      const raw = await historyApi.submitFeedback(id, feedbackData);
      return mapFeedbackResponse(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnoses', id] });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: (notesData) => historyApi.updateNotes(id, notesData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnoses', id] });
      queryClient.invalidateQueries({ queryKey: ['diagnoses'] });
    },
  });

  return {
    diagnosis: query.data || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    deleteDiagnosis: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
    submitFeedback: feedbackMutation.mutateAsync,
    isSubmittingFeedback: feedbackMutation.isPending,
    feedbackSuccess: feedbackMutation.isSuccess,
    feedbackError: feedbackMutation.error,
    updateNotes: updateNotesMutation.mutateAsync,
    isUpdatingNotes: updateNotesMutation.isPending,
  };
}
