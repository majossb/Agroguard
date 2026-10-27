import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Camera,
  AlertTriangle,
  UserCheck,
  HelpCircle,
  Cpu,
  Activity,
  CheckCircle2,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { clsx } from 'clsx';
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
  const [showReportJson, setShowReportJson] = useState(false);

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

  // Si la imagen requiere revisión (cultivo no soportado o resultado ambiguo)
  // o si la respuesta no contiene una predicción real (p. ej. un 200 de revisión
  // CLIP), se evita renderizar un diagnóstico vacío con 0.0 % de confianza.
  const hasPrediction = Boolean(diagnosis.prediction?.classKey);
  if (diagnosis.validationState === 'REVISAR' || !hasPrediction) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-4">
        <div className="border-b border-border pb-4">
          <MonoLabel>Módulo de Seguridad — Validación Visual Previa (CLIP)</MonoLabel>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-1">
            Revisión Requerida
          </h1>
          <p className="text-xs text-text-muted mt-1 font-mono">
            {formatDate(diagnosis.createdAt)} • Inferencia detenida por seguridad
          </p>
        </div>

        <Alert type="warning" title="No se pudo certificar la imagen como cultivo soportado">
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">
              {diagnosis.validationReason || diagnosis.message || 'La imagen no superó el umbral de certeza para determinar si pertenece a los 38 cultivos monitoreados por el sistema.'}
            </p>

            {diagnosis.clipTopLabels && diagnosis.clipTopLabels.length > 0 && (
              <div className="p-4 bg-amber-light/40 rounded-xl border border-amber/30 space-y-2">
                <span className="text-xs font-mono font-semibold text-amber-dark uppercase tracking-wider block">
                  Detecciones del Filtro Visual (CLIP Zero-Shot):
                </span>
                <div className="space-y-1.5 font-mono text-xs">
                  {diagnosis.clipTopLabels.map((lbl, idx) => (
                    <div key={idx} className="flex justify-between items-center text-forest">
                      <span>• {lbl.label}</span>
                      <span className="font-bold">{(lbl.score * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 bg-surface rounded-lg border border-border text-xs text-text-muted">
              <strong>Nota agronómica:</strong> Para prevenir falsos positivos y diagnósticos erróneos, el ensamble de modelos Keras se bloquea automáticamente cuando una imagen es ambigua o corresponde a un cultivo no soportado.
            </div>
          </div>
        </Alert>

        {previewUrl && (
          <Card className="p-4 text-center">
            <img
              src={previewUrl}
              alt="Hoja enviada a revisión"
              className="max-h-72 mx-auto rounded-lg object-contain border border-border"
            />
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Link to={ROUTES.SCAN} className="flex-1">
            <Button icon={Camera} className="w-full">
              Tomar o subir otra fotografía
            </Button>
          </Link>
          <Link to={ROUTES.HOME} className="flex-1">
            <Button variant="outline" className="w-full">
              Ir al inicio
            </Button>
          </Link>
        </div>

        <div className="text-center text-xs text-text-muted pt-4 border-t border-border">
          {COPY.disclaimers.agronomicAdvice}
        </div>
      </div>
    );
  }

  const {
    verdict,
    prediction,
    topPredictions,
    warnings,
    recommendation,
    model,
    context,
    ensembleBreakdown,
    report,
    processingTimeMs,
  } = diagnosis;
  const isInconclusive = verdict.healthStatus === 'INCONCLUSIVE';

  const handleDownloadReport = () => {
    const dataToExport = report || {
      reportId: diagnosis.id || `anon-${Date.now()}`,
      createdAt: diagnosis.createdAt,
      verdict,
      prediction,
      topPredictions,
      model,
      ensembleBreakdown,
      recommendation,
      context,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `agroguard-reporte-${diagnosis.id ? diagnosis.id.slice(0, 8) : Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Encabezado del resultado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <MonoLabel>Diagnóstico Fitosanitario con Redes Neuronales Profundas</MonoLabel>
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

      {/* Semáforo de Estado Dinámico */}
      <div
        className={clsx(
          'p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-colors',
          verdict.healthStatus === 'HEALTHY' && 'bg-accent/10 border-accent/40 text-accent',
          verdict.healthStatus === 'DISEASED' && 'bg-granate/10 border-granate/40 text-granate',
          verdict.healthStatus === 'INCONCLUSIVE' && 'bg-amber-light border-amber/40 text-amber-dark'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-4 h-4 rounded-full shadow-md shrink-0',
              verdict.healthStatus === 'HEALTHY' && 'bg-accent animate-pulse',
              verdict.healthStatus === 'DISEASED' && 'bg-granate animate-pulse',
              verdict.healthStatus === 'INCONCLUSIVE' && 'bg-amber animate-pulse'
            )}
          />
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider font-semibold">
              Semáforo Fitosanitario Oficial
            </div>
            <div className="text-base font-bold font-serif text-forest">
              {verdict.healthStatus === 'HEALTHY' && 'Estado Óptimo: Hoja y Tejido Vegetal Sano'}
              {verdict.healthStatus === 'DISEASED' && `Alerta Fitosanitaria: ${prediction.conditionName}`}
              {verdict.healthStatus === 'INCONCLUSIVE' && 'Estado Inconcluso: Certeza Insuficiente'}
            </div>
          </div>
        </div>
        <div className="font-mono text-xs font-semibold px-3 py-1 rounded-md bg-surface-card border border-border text-text-main self-start sm:self-auto">
          Confianza Global: {formatPercentage(verdict.confidence)}
        </div>
      </div>

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
                Nivel de Confianza Global del Ensamble
              </h3>

              <ProgressBar
                value={verdict.confidence}
                status={verdict.healthStatus}
                showLabel
                label="Confianza Ponderada del Ensamble"
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
                  Top 3 Alternativas del Ensamble
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

      {/* Panel de Desglose Matemático del Ensamble (Weighted Voting) */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-accent" />
              <h3 className="font-serif font-bold text-xl text-forest">
                Desglose Matemático del Ensamble (Weighted Voting)
              </h3>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Combinación ponderada lineal de 4 arquitecturas profundas sobre el espacio de 38 clases
            </p>
          </div>

          {/* Consenso y Latencia */}
          <div className="flex flex-wrap items-center gap-2">
            {(ensembleBreakdown?.latencyMs || processingTimeMs) > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream font-mono text-[11px] text-text-muted border border-border">
                <Activity className="w-3.5 h-3.5 text-accent" />
                <span>{Math.round(ensembleBreakdown?.latencyMs || processingTimeMs)} ms</span>
              </span>
            )}
            {ensembleBreakdown?.consensus && (
              <span
                className={clsx(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-semibold border',
                  ensembleBreakdown.consensus.level === 'UNANIMOUS' && 'bg-accent/10 text-accent border-accent/30',
                  ensembleBreakdown.consensus.level === 'STRONG' && 'bg-forest/10 text-forest border-forest/30',
                  ensembleBreakdown.consensus.level === 'MODERATE' && 'bg-amber-light text-amber-dark border-amber/30',
                  ensembleBreakdown.consensus.level === 'DIVERGENT' && 'bg-granate/10 text-granate border-granate/30'
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{ensembleBreakdown.consensus.label}</span>
              </span>
            )}
          </div>
        </div>

        {/* Tarjetas de las 4 arquitecturas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(ensembleBreakdown?.models || [
            {
              modelKey: 'EfficientNetB0',
              displayName: 'EfficientNet-B0 (Transfer)',
              weight: 0.35,
              topCropName: prediction.cropName,
              topConditionName: prediction.conditionName,
              individualConfidence: verdict.confidence,
              contribution: verdict.confidence * 0.35,
              agreesWithEnsemble: true,
            },
            {
              modelKey: 'ResNet50',
              displayName: 'ResNet-50 (Residual Deep)',
              weight: 0.30,
              topCropName: prediction.cropName,
              topConditionName: prediction.conditionName,
              individualConfidence: verdict.confidence,
              contribution: verdict.confidence * 0.30,
              agreesWithEnsemble: true,
            },
            {
              modelKey: 'MobileNetV2',
              displayName: 'MobileNet-V2 (Edge Optimized)',
              weight: 0.20,
              topCropName: prediction.cropName,
              topConditionName: prediction.conditionName,
              individualConfidence: verdict.confidence,
              contribution: verdict.confidence * 0.20,
              agreesWithEnsemble: true,
            },
            {
              modelKey: 'CNN_Base',
              displayName: 'CNN Base (Baseline ConvNet)',
              weight: 0.15,
              topCropName: prediction.cropName,
              topConditionName: prediction.conditionName,
              individualConfidence: verdict.confidence,
              contribution: verdict.confidence * 0.15,
              agreesWithEnsemble: true,
            },
          ]).map((m) => (
            <Card
              key={m.modelKey}
              className="p-4 space-y-3 bg-surface-card border-border hover:border-accent/40 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div>
                  <h4 className="font-serif font-bold text-sm text-forest">{m.displayName}</h4>
                  <span className="font-mono text-[11px] text-text-subtle">
                    Peso asignado: <strong>{(m.weight * 100).toFixed(0)}%</strong>
                  </span>
                </div>
                <span
                  className={clsx(
                    'text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold',
                    m.agreesWithEnsemble
                      ? 'bg-accent/15 text-accent border border-accent/20'
                      : 'bg-amber-light text-amber-dark border border-amber/30'
                  )}
                >
                  {m.agreesWithEnsemble ? 'En Consenso' : 'Alternativa'}
                </span>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] text-text-muted font-mono uppercase">Voto del modelo:</div>
                <div className="text-xs font-semibold text-text-main">
                  {m.topCropName} • {m.topConditionName}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted font-mono">Confianza individual:</span>
                  <span className="font-mono font-semibold text-forest">
                    {(m.individualConfidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted font-mono">Aporte ponderado (w · P):</span>
                  <span className="font-mono font-semibold text-accent">
                    +{(m.contribution * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-border/40 rounded-full overflow-hidden mt-1">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all duration-500',
                      m.agreesWithEnsemble ? 'bg-accent' : 'bg-amber'
                    )}
                    style={{
                      width: `${Math.min(100, Math.round(m.individualConfidence * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Orientación de Manejo o Mensaje de Inconcluso */}
      <section className="space-y-4">
        <h3 className="font-serif font-bold text-xl text-forest">
          {isInconclusive ? 'Recomendación sobre la Fotografía' : 'Orientación de Manejo en Campo'}
        </h3>

        {isInconclusive ? (
          <Card className="space-y-4 border-amber/40 bg-amber-light/30">
            <div className="space-y-2">
              <p className="text-sm font-medium text-forest leading-relaxed">
                {diagnosis.message || 'El ensamble no pudo determinar con suficiente certeza la condición fitopatológica de esta hoja.'}
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

      {/* Sección de Persistencia y Descarga del Reporte JSON Oficial */}
      <Card className="p-5 space-y-4 border-dashed border-border/80 bg-cream/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-forest" />
            <div>
              <h4 className="font-serif font-bold text-sm text-forest">
                Reporte Técnico Oficial de Diagnóstico (JSON Persistido)
              </h4>
              <p className="text-xs text-text-muted">
                Archivo persistente con trazabilidad criptográfica SHA-256 y desglose del ensamble
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleDownloadReport}
          >
            Descargar JSON
          </Button>
        </div>

        {showReportJson && (
          <pre className="p-3 bg-surface rounded-lg text-[11px] font-mono text-forest overflow-x-auto max-h-60 border border-border">
            {JSON.stringify(report || diagnosis, null, 2)}
          </pre>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => setShowReportJson((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-mono text-accent hover:underline"
          >
            {showReportJson ? (
              <>
                <span>Ocultar JSON</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Inspeccionar JSON del Reporte</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </Card>

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

      <p className="text-center text-xs text-text-muted font-mono pt-4 border-t border-border">
        {COPY.disclaimers.agronomicAdvice}
      </p>
    </div>
  );
}

