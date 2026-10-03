import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Leaf,
  AlertTriangle,
  Sprout,
  FlaskConical,
  Bug,
  Microscope,
  ShieldCheck,
  Camera,
} from 'lucide-react';
import { z } from 'zod';
import { ROUTES } from '../../../shared/config/routes.js';
import { Card } from '../../../shared/ui/Card.jsx';
import { Badge } from '../../../shared/ui/Badge.jsx';
import { Button } from '../../../shared/ui/Button.jsx';
import { Skeleton } from '../../../shared/ui/Skeleton.jsx';
import { MonoLabel } from '../../../shared/ui/MonoLabel.jsx';
import { Alert } from '../../../shared/ui/Alert.jsx';
import { useConditionDetail } from '../hooks/useConditionDetail.js';

/** Valida y sanitiza el classKey de la URL */
const classKeySchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_]+$/, 'classKey inválido');

export function ConditionDetailPage() {
  const { classKey: rawClassKey } = useParams();

  // Validar parámetro de URL con Zod — evitar injection
  const parseResult = classKeySchema.safeParse(rawClassKey);
  const safeClassKey = parseResult.success ? parseResult.data : null;

  const { condition, isLoading, isError } = useConditionDetail(safeClassKey);

  if (!safeClassKey) {
    return (
      <div className="space-y-4 py-2">
        <BackLink />
        <Alert variant="error">
          El identificador de condición no es válido. Regresa al catálogo y selecciona una condición.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 max-w-3xl mx-auto">
      <BackLink />

      {isLoading ? (
        <DetailSkeleton />
      ) : isError ? (
        <Alert variant="error">
          No se pudo cargar el detalle de esta condición. Verifica tu conexión e inténtalo de nuevo.
        </Alert>
      ) : !condition ? null : (
        <article aria-label={`Detalle: ${condition.conditionName}`} className="space-y-6">
          {/* Encabezado */}
          <div className="border-b border-border pb-4 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Badge status={condition.isHealthy ? 'HEALTHY' : 'DISEASED'} />
              <MonoLabel>{condition.classKey}</MonoLabel>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-1 leading-tight">
              {condition.conditionName}
            </h1>
            <p className="text-sm text-text-muted">
              Cultivo:{' '}
              <span className="font-medium text-text">{condition.cropName}</span>
            </p>
          </div>

          {/* Descripción */}
          {condition.description && (
            <Card className="p-5 space-y-2">
              <SectionTitle icon={Microscope}>Descripción técnica</SectionTitle>
              <p className="text-sm text-text leading-relaxed">{condition.description}</p>
            </Card>
          )}

          {/* Estado saludable — no hay síntomas ni manejo */}
          {condition.isHealthy ? (
            <Card className="p-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cream border border-border flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-accent" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-forest">
                  Planta en condición saludable
                </p>
                <p className="text-xs text-text-muted leading-relaxed mt-0.5">
                  Esta clase representa una planta sin patologías detectables. No requiere intervención agronómica.
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* Síntomas */}
              {condition.symptoms.length > 0 && (
                <Card className="p-5 space-y-3">
                  <SectionTitle icon={Bug}>Síntomas observables</SectionTitle>
                  <ul className="space-y-2">
                    {condition.symptoms.map((symptom, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-text leading-relaxed"
                      >
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full bg-granate shrink-0"
                          aria-hidden="true"
                        />
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Manejo */}
              {(condition.management.cultural.length > 0 ||
                condition.management.biological.length > 0 ||
                condition.management.chemical.length > 0) && (
                <div className="space-y-3">
                  <h2 className="text-base font-serif font-bold text-forest">
                    Guías de Manejo Agronómico
                  </h2>

                  {condition.management.cultural.length > 0 && (
                    <ManagementSection
                      icon={Sprout}
                      title="Manejo cultural"
                      items={condition.management.cultural}
                      color="accent"
                    />
                  )}

                  {condition.management.biological.length > 0 && (
                    <ManagementSection
                      icon={Leaf}
                      title="Control biológico"
                      items={condition.management.biological}
                      color="forest"
                    />
                  )}

                  {condition.management.chemical.length > 0 && (
                    <ManagementSection
                      icon={FlaskConical}
                      title="Control químico"
                      items={condition.management.chemical}
                      color="amber"
                    />
                  )}
                </div>
              )}

              {/* Advertencia química */}
              {condition.management.chemical.length > 0 && (
                <div className="bg-amber/10 border border-amber/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-xs text-text leading-relaxed">
                    <strong>Consulta a un ingeniero agrónomo</strong> antes de aplicar cualquier
                    tratamiento químico. Las recomendaciones son orientativas y deben ajustarse a
                    las condiciones locales y regulaciones vigentes.
                  </p>
                </div>
              )}
            </>
          )}

          {/* CTA — Escanear */}
          <Card withCorners className="p-6 text-center space-y-3">
            <p className="text-sm text-text-muted">
              ¿Sospechas que tu cultivo puede tener esta condición?
            </p>
            <Link to={ROUTES.SCAN}>
              <Button icon={Camera}>Escanear una hoja</Button>
            </Link>
          </Card>
        </article>
      )}
    </div>
  );
}

/** Título de sección con icono */
function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-forest" aria-hidden="true" />
      <h2 className="text-sm font-serif font-bold text-forest">{children}</h2>
    </div>
  );
}

/** Sección de manejo con lista */
function ManagementSection({ icon: Icon, title, items, color }) {
  const colorMap = {
    accent: 'text-accent',
    forest: 'text-forest',
    amber: 'text-amber',
  };

  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${colorMap[color] || 'text-forest'}`} aria-hidden="true" />
        <h3 className="text-sm font-serif font-bold text-forest">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2 text-sm text-text leading-relaxed"
          >
            <span
              className="mt-1.5 w-1.5 h-1.5 rounded-full bg-border shrink-0"
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Enlace de regreso al catálogo */
function BackLink() {
  return (
    <Link
      to={ROUTES.CATALOG}
      className="inline-flex items-center gap-1.5 text-xs font-mono text-text-muted hover:text-forest transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
      Volver al catálogo
    </Link>
  );
}

/** Esqueleto de carga del detalle */
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 pb-4 border-b border-border">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Card className="p-5 space-y-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </Card>
      <Card className="p-5 space-y-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </Card>
    </div>
  );
}
