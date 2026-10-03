import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Download, CheckCircle, XCircle, AlertTriangle, Edit3, Save } from 'lucide-react';
import { ROUTES } from '../../../shared/config/routes.js';
import { COPY } from '../../../shared/config/copy.es.js';
import { Button } from '../../../shared/ui/Button.jsx';
import { Card } from '../../../shared/ui/Card.jsx';
import { Badge } from '../../../shared/ui/Badge.jsx';
import { Alert } from '../../../shared/ui/Alert.jsx';
import { ProgressBar } from '../../../shared/ui/ProgressBar.jsx';
import { Field } from '../../../shared/ui/Field.jsx';
import { Skeleton } from '../../../shared/ui/Skeleton.jsx';
import { MonoLabel } from '../../../shared/ui/MonoLabel.jsx';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog.jsx';
import { useDiagnosisDetail } from '../hooks/useDiagnosisDetail.js';
import { historyApi } from '../api/historyApi.js';
import { formatDate, formatPercentage } from '../../../shared/lib/formatters.js';

export function DiagnosisDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editPlot, setEditPlot] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Estados de retroalimentación (feedback)
  const [feedbackAnswer, setFeedbackAnswer] = useState(null); // true | false
  const [feedbackComment, setFeedbackComment] = useState('');

  const {
    diagnosis,
    isLoading,
    isError,
    error,
    deleteDiagnosis,
    isDeleting,
    submitFeedback,
    isSubmittingFeedback,
    feedbackSuccess,
    updateNotes,
    isUpdatingNotes,
  } = useDiagnosisDetail(id);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Skeleton className="md:col-span-5 h-72 rounded-xl" />
          <Skeleton className="md:col-span-7 h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !diagnosis) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <Card withCorners className="p-8 space-y-4">
          <h1 className="text-xl font-serif font-bold text-forest">
            Diagnóstico no encontrado
          </h1>
          <p className="text-xs text-text-muted leading-relaxed">
            {error?.status === 404
              ? 'El diagnóstico solicitado no existe o no tienes permiso para acceder a él.'
              : 'Ocurrió un error al cargar la información del diagnóstico.'}
          </p>
          <div className="pt-2">
            <Link to={ROUTES.DIAGNOSES}>
              <Button icon={ArrowLeft}>Volver al historial</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { verdict, prediction, topPredictions, warnings, recommendation, model, context } = diagnosis;
  const isInconclusive = verdict.healthStatus === 'INCONCLUSIVE';

  const handleDownloadImage = async () => {
    try {
      const blob = await historyApi.downloadImageBlob(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agroguard-${prediction.cropKey || 'hoja'}-${id.slice(0, 8)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Manejar error de descarga si hiciera falta
    }
  };

  const handleStartEditNotes = () => {
    setEditPlot(context.plotName || '');
    setEditNotes(context.notes || '');
    setIsEditingNotes(true);
  };

  const handleSaveNotes = async () => {
    await updateNotes({
      plotName: editPlot.trim() || undefined,
      notes: editNotes.trim() || undefined,
    });
    setIsEditingNotes(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDiagnosis();
      setDeleteModalOpen(false);
      navigate(ROUTES.DIAGNOSES, { replace: true });
    } catch {
      // Manejado por useDiagnosisDetail
    }
  };

  const handleSubmitFeedback = async () => {
    if (feedbackAnswer === null) return;
    try {
      await submitFeedback({
        wasCorrect: feedbackAnswer,
        comment: feedbackComment.trim() || undefined,
      });
    } catch {
      // Manejado por useDiagnosisDetail
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Barra de navegación superior y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <Link
          to={ROUTES.DIAGNOSES}
          className="inline-flex items-center gap-2 text-xs font-mono text-text-muted hover:text-forest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al historial</span>
        </Link>

        <div className="flex items-center gap-3">
          <Badge status={verdict.healthStatus} size="lg" />
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setDeleteModalOpen(true)}
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Titular */}
      <div>
        <MonoLabel>Evaluación Registrada</MonoLabel>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-1">
          {prediction.cropName} • {prediction.conditionName}
        </h1>
        <p className="text-xs text-text-muted font-mono mt-1">
          Folio #{id} • Evaluado el {formatDate(diagnosis.createdAt)}
        </p>
      </div>

      {/* Aviso de Modo Demostración si model.provider === 'mock' */}
      {model.isMock && (
        <Alert type="warning" title="Modo demostración activo">
          {COPY.disclaimers.mockWarning}
        </Alert>
      )}

      {/* Grid: Imagen y Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Fotografía de la muestra */}
        <div className="md:col-span-5 space-y-3">
          <Card withCorners className="p-3 bg-surface-card space-y-3">
            <div className="aspect-square rounded-lg overflow-hidden bg-cream/40 flex items-center justify-center border border-border">
              {diagnosis.image?.url ? (
                <img
                  src={diagnosis.image.url}
                  alt={`Fotografía de ${prediction.cropName}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs font-mono text-text-muted">Imagen archivada</span>
              )}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Download}
              onClick={handleDownloadImage}
              className="w-full"
            >
              Descargar fotografía
            </Button>
          </Card>
        </div>

        {/* Métricas del Modelo */}
        <div className="md:col-span-7 space-y-6">
          <Card className="space-y-5">
            <div className="space-y-3">
              <h2 className="font-sans font-bold text-xs uppercase tracking-wider text-forest">
                Certeza del Modelo ({model.name} v{model.version})
              </h2>

              <ProgressBar
                value={verdict.confidence}
                status={verdict.healthStatus}
                showLabel
                label="Nivel de Confianza Diagnóstica"
              />

              <div className="flex justify-between items-center text-xs font-mono text-text-muted pt-1">
                <span>Probabilidad de hoja sana:</span>
                <span className="font-semibold text-forest">
                  {formatPercentage(verdict.healthyProbability)}
                </span>
              </div>
            </div>

            {/* Top 3 Predicciones */}
            {topPredictions.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-border">
                <h3 className="font-mono text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Top 3 Predicciones
                </h3>
                <div className="space-y-2">
                  {topPredictions.map((pred, idx) => (
                    <div key={pred.classKey || idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-text-main">
                          {pred.conditionName ? `${pred.cropName} • ${pred.conditionName}` : pred.classKey}
                        </span>
                        <span className="font-mono font-semibold text-forest">
                          {formatPercentage(pred.probability)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-border/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-forest/70 rounded-full"
                          style={{ width: `${Math.round(pred.probability * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Advertencias */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((warnKey) => (
                <Alert key={warnKey} type="warning">
                  {COPY.warnings[warnKey] || warnKey}
                </Alert>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orientación de Manejo */}
      <section className="space-y-4">
        <h2 className="font-serif font-bold text-xl text-forest">
          {isInconclusive ? 'Recomendación sobre la Fotografía' : 'Orientación de Manejo en Campo'}
        </h2>

        {isInconclusive ? (
          <Card className="p-5 border-amber/40 bg-amber-light/30 space-y-2">
            <p className="text-sm font-medium text-forest leading-relaxed">
              {diagnosis.message || 'El modelo no pudo determinar con suficiente certeza la condición fitopatológica de esta hoja.'}
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              Te sugerimos tomar una nueva fotografía asegurándote de que la hoja esté enfocada, libre de reflejos directos de luz y centrada sobre un fondo neutro.
            </p>
          </Card>
        ) : (
          <Card className="p-6 space-y-4">
            {recommendation ? (
              <div className="space-y-4">
                {recommendation.reviewStatus === 'PENDING_REVIEW' && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-light border border-amber/30 text-amber-dark font-mono text-[11px] font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{COPY.disclaimers.pendingReview}</span>
                  </div>
                )}

                {recommendation.summary && (
                  <p className="text-sm text-text-main leading-relaxed font-medium">
                    {recommendation.summary}
                  </p>
                )}

                {recommendation.generalAdvice && (
                  <p className="text-xs text-text-muted leading-relaxed">
                    {recommendation.generalAdvice}
                  </p>
                )}

                {recommendation.actions?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <h3 className="font-mono text-xs uppercase tracking-wider text-forest font-semibold">
                      Acciones Recomendadas
                    </h3>
                    <ul className="space-y-2 text-xs text-text-main list-disc list-inside">
                      {recommendation.actions.map((act, index) => (
                        <li key={index} className="leading-relaxed">
                          <strong className="capitalize">{act.type}:</strong> {act.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-text-muted leading-relaxed">
                {COPY.disclaimers.agronomicAdvice}
              </p>
            )}
          </Card>
        )}
      </section>

      {/* Observaciones de Campo y Lote (Edición inline) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-lg text-forest">
            Observaciones y Lote
          </h2>
          {!isEditingNotes && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Edit3}
              onClick={handleStartEditNotes}
            >
              Editar notas
            </Button>
          )}
        </div>

        <Card className="p-5">
          {isEditingNotes ? (
            <div className="space-y-4">
              <Field
                id="edit-plot"
                label="Nombre del lote o parcela"
                value={editPlot}
                onChange={(e) => setEditPlot(e.target.value)}
                maxLength={100}
                disabled={isUpdatingNotes}
              />
              <Field
                id="edit-notes"
                label="Observaciones de campo"
                as="textarea"
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                maxLength={500}
                disabled={isUpdatingNotes}
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditingNotes(false)}
                  disabled={isUpdatingNotes}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={Save}
                  onClick={handleSaveNotes}
                  isLoading={isUpdatingNotes}
                  disabled={isUpdatingNotes}
                >
                  {isUpdatingNotes ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-text-muted">
              <p><strong>Lote:</strong> {context.plotName || 'Sin asignar'}</p>
              {context.cropHint && (
                <p><strong>Cultivo indicado por usuario:</strong> {context.cropHint}</p>
              )}
              <p><strong>Observaciones:</strong> {context.notes || 'Sin notas adicionales registradas.'}</p>
            </div>
          )}
        </Card>
      </section>

      {/* Sección de Retroalimentación (Feedback) */}
      <section className="space-y-3 pt-2">
        <h2 className="font-serif font-bold text-lg text-forest">
          Retroalimentación Técnica en Campo
        </h2>

        <Card className="p-6 space-y-4 bg-surface-card">
          {feedbackSuccess ? (
            <Alert type="success" title="¡Gracias por tu colaboración!">
              Tu retroalimentación ha sido guardada y contribuye a la mejora continua del sistema agronómico.
            </Alert>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-text-muted">
                ¿Fue acertado este diagnóstico según tu observación directa en el cultivo?
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setFeedbackAnswer(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    feedbackAnswer === true
                      ? 'bg-accent/15 border-accent text-accent font-semibold'
                      : 'bg-surface border-border text-text-main hover:bg-cream'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 text-accent" />
                  <span>Sí, fue acertado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeedbackAnswer(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    feedbackAnswer === false
                      ? 'bg-granate/15 border-granate text-granate font-semibold'
                      : 'bg-surface border-border text-text-main hover:bg-cream'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-granate" />
                  <span>No, fue incorrecto</span>
                </button>
              </div>

              {feedbackAnswer === false && (
                <div className="space-y-3 pt-2">
                  <Field
                    id="feedback-comment"
                    label="Comentario o aclaración sobre la patología real (opcional)"
                    as="textarea"
                    rows={2}
                    placeholder="Ej. Se trataba en realidad de deficiencia de magnesio..."
                    maxLength={500}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    disabled={isSubmittingFeedback}
                  />
                </div>
              )}

              {feedbackAnswer !== null && (
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSubmitFeedback}
                    isLoading={isSubmittingFeedback}
                    disabled={isSubmittingFeedback}
                  >
                    {isSubmittingFeedback ? 'Enviando retroalimentación...' : 'Enviar retroalimentación'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </section>

      {/* Diálogo Accesible de Confirmación de Eliminación */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar diagnóstico"
        description="Esta acción eliminará de forma permanente este diagnóstico de tu cuaderno de campo, junto con la fotografía y retroalimentación asociadas. No se puede deshacer."
        confirmLabel="Eliminar definitivamente"
        cancelLabel="Conservar registro"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
