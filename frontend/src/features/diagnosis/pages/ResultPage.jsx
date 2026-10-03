import { useLocation, Link } from 'react-router-dom';
import { Camera, AlertTriangle, UserCheck, HelpCircle } from 'lucide-react';
import { ROUTES } from '../../../shared/config/routes.js';
import { COPY } from '../../../shared/config/copy.es.js';
import { Button } from '../../../shared/ui/Button.jsx';
import { Card } from '../../../shared/ui/Card.jsx';
import { Badge } from '../../../shared/ui/Badge.jsx';
import { Alert } from '../../../shared/ui/Alert.jsx';
import { ProgressBar } from '../../../shared/ui/ProgressBar.jsx';
import { MonoLabel } from '../../../shared/ui/MonoLabel.jsx';
import { formatPercentage, formatDate } from '../../../shared/lib/formatters.js';

export function ResultPage() {
  const location = useLocation();

  const diagnosis = location.state?.diagnosis;
  const previewUrl = location.state?.previewUrl;

  // Si no hay diagnóstico en el estado (por ejemplo, recarga en modo anónimo), redirigir o mostrar aviso
  if (!diagnosis) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <Card withCorners className="p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-light text-amber-dark mx-auto flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-forest">
            No hay ningún diagnóstico en pantalla
          </h1>
          <p className="text-sm text-text-muted leading-relaxed">
            Si realizaste un análisis en modo anónimo y recargaste la página, los resultados no se almacenaron en el servidor. Por favor, realiza un nuevo análisis.
          </p>
          <div className="pt-2">
            <Link to={ROUTES.SCAN}>
              <Button icon={Camera}>Escanear una hoja</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const { verdict, prediction, topPredictions, warnings, recommendation, model, context } = diagnosis;
  const isInconclusive = verdict.healthStatus === 'INCONCLUSIVE';

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Encabezado del resultado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <MonoLabel>Resultado del Análisis Fitosanitario</MonoLabel>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-1">
            Evaluación de Salud Foliar
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">
            {formatDate(diagnosis.createdAt)} {diagnosis.id ? `• Folio #${diagnosis.id.slice(0, 8)}` : '• Modo Anónimo'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge status={verdict.healthStatus} size="lg" />
        </div>
      </div>

      {/* Aviso de Modo Demostración si model.provider === 'mock' */}
      {model.isMock && (
        <Alert type="warning" title="Modo demostración activo">
          {COPY.disclaimers.mockWarning}
        </Alert>
      )}

      {/* Grid Principal: Imagen y Diagnóstico */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Imagen analizada */}
        <div className="md:col-span-5 space-y-4">
          <Card withCorners cornerColor="#1E3B2C" className="p-3 bg-surface-card">
            {previewUrl || diagnosis.image?.url ? (
              <img
                src={previewUrl || diagnosis.image?.url}
                alt="Fotografía de la hoja diagnosticada"
                className="w-full aspect-square object-contain rounded-lg bg-cream/40"
              />
            ) : (
              <div className="w-full aspect-square rounded-lg bg-cream/60 flex items-center justify-center text-text-muted text-xs font-mono">
                Fotografía no disponible
              </div>
            )}

            {/* Metadatos de campo si existen */}
            {(context.plotName || context.cropHint || context.notes) && (
              <div className="pt-3 border-t border-border mt-3 space-y-1.5 text-xs text-text-muted">
                {context.plotName && (
                  <p><strong>Lote:</strong> {context.plotName}</p>
                )}
                {context.cropHint && (
                  <p><strong>Cultivo indicado:</strong> {context.cropHint}</p>
                )}
                {context.notes && (
                  <p className="italic">&ldquo;{context.notes}&rdquo;</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Columna Derecha: Certeza, Predicción y Top 3 */}
        <div className="md:col-span-7 space-y-6">
          <Card className="space-y-5">
            {/* Veredicto de la Predicción */}
            <div className="space-y-1">
              <MonoLabel>Clasificación Identificada</MonoLabel>
              <h2 className="font-serif text-2xl font-bold text-forest">
                {prediction.cropName} • {prediction.conditionName}
              </h2>
              {prediction.classKey && (
                <p className="font-mono text-xs text-text-subtle">{prediction.classKey}</p>
              )}
            </div>

            {/* Nivel de Confianza */}
            <div className="space-y-3 pt-2 border-t border-border">
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-forest">
                Qué tan seguro está el sistema
              </h3>

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
                <h4 className="font-mono text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Top 3 Predicciones del Modelo
                </h4>
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

          {/* Advertencias si existen */}
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

      {/* Orientación de Manejo o Mensaje de Inconcluso */}
      <section className="space-y-4">
        <h3 className="font-serif font-bold text-xl text-forest">
          {isInconclusive ? 'Recomendación sobre la Fotografía' : 'Orientación de Manejo en Campo'}
        </h3>

        {isInconclusive ? (
          <Card className="space-y-4 border-amber/40 bg-amber-light/30">
            <div className="space-y-2">
              <p className="text-sm font-medium text-forest leading-relaxed">
                {diagnosis.message || 'El modelo no pudo determinar con suficiente certeza la condición fitopatológica de esta hoja.'}
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                Te sugerimos tomar una nueva fotografía asegurándote de que la hoja esté enfocada, libre de reflejos directos de luz y centrada sobre un fondo neutro.
              </p>
            </div>
          </Card>
        ) : (
          <Card className="space-y-4">
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
                    <h4 className="font-mono text-xs uppercase tracking-wider text-forest font-semibold">
                      Acciones Recomendadas
                    </h4>
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

      {/* Barra de Acciones y Notificación de Sesión */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to={ROUTES.SCAN}>
          <Button variant="secondary" icon={Camera} size="lg">
            Analizar otra hoja
          </Button>
        </Link>

        {diagnosis.persisted ? (
          <div className="inline-flex items-center gap-2 text-xs font-mono text-accent">
            <UserCheck className="w-4 h-4" />
            <span>Guardado en tu historial</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="text-xs text-text-muted">
              ¿Deseas guardar tus diagnósticos en un cuaderno de campo?
            </span>
            <Link to={ROUTES.LOGIN}>
              <Button variant="primary" size="sm">
                Iniciar sesión
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
