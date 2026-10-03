import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Leaf, AlertTriangle, ChevronRight, BookOpen } from 'lucide-react';
import { ROUTES } from '../../../shared/config/routes.js';
import { Field } from '../../../shared/ui/Field.jsx';
import { Card } from '../../../shared/ui/Card.jsx';
import { Badge } from '../../../shared/ui/Badge.jsx';
import { Skeleton } from '../../../shared/ui/Skeleton.jsx';
import { MonoLabel } from '../../../shared/ui/MonoLabel.jsx';
import { Alert } from '../../../shared/ui/Alert.jsx';
import { useCrops } from '../hooks/useCrops.js';
import { useConditions } from '../hooks/useConditions.js';

export function CatalogPage() {
  const [selectedCrop, setSelectedCrop] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHealthy, setShowHealthy] = useState(true);
  const [showDiseased, setShowDiseased] = useState(true);

  const { crops, isLoading: cropsLoading } = useCrops();
  const {
    conditions,
    isLoading: conditionsLoading,
    isError,
  } = useConditions({ cropKey: selectedCrop || undefined });

  const isLoading = cropsLoading || conditionsLoading;

  /** Filtro local por búsqueda de texto */
  const filtered = useMemo(() => {
    let result = conditions;
    if (!showHealthy) result = result.filter((c) => !c.isHealthy);
    if (!showDiseased) result = result.filter((c) => c.isHealthy);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.conditionName.toLowerCase().includes(q) ||
          c.cropName.toLowerCase().includes(q) ||
          c.classKey.toLowerCase().includes(q)
      );
    }
    return result;
  }, [conditions, searchQuery, showHealthy, showDiseased]);

  const healthy = filtered.filter((c) => c.isHealthy);
  const diseased = filtered.filter((c) => !c.isHealthy);

  return (
    <div className="space-y-8 py-2">
      {/* Encabezado */}
      <div className="border-b border-border pb-4">
        <MonoLabel>Enciclopedia Fitosanitaria</MonoLabel>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-1">
          Catálogo de Cultivos y Enfermedades
        </h1>
        <p className="text-xs text-text-muted mt-1">
          Referencia técnica de condiciones fitopatológicas identificables por AgroGuard.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-surface-card border border-border rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Búsqueda */}
          <Field
            id="catalog-search"
            type="search"
            placeholder="Buscar condición o cultivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
          />

          {/* Filtro de cultivo */}
          <Field
            id="catalog-crop"
            as="select"
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
          >
            <option value="">Todos los cultivos</option>
            {crops.map((c) => (
              <option key={c.cropKey} value={c.cropKey}>
                {c.cropName} — {c.conditionsCount} condiciones
              </option>
            ))}
          </Field>
        </div>

        {/* Toggle sano/enfermo */}
        <div className="flex flex-wrap gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showHealthy}
              onChange={(e) => setShowHealthy(e.target.checked)}
              className="accent-accent w-4 h-4"
            />
            <Leaf className="w-3 h-3 text-accent" aria-hidden="true" />
            Mostrar sanas
          </label>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDiseased}
              onChange={(e) => setShowDiseased(e.target.checked)}
              className="accent-granate w-4 h-4"
            />
            <AlertTriangle className="w-3 h-3 text-granate" aria-hidden="true" />
            Mostrar enfermedades
          </label>
        </div>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <ConditionSkeletons />
      ) : isError ? (
        <Alert variant="error">
          No se pudo cargar el catálogo. Verifica la conexión con el servidor e inténtalo de nuevo.
        </Alert>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-forest/30 mx-auto" aria-hidden="true" />
          <p className="text-sm font-medium text-text-muted">
            No se encontraron condiciones con los filtros aplicados.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Sección: Enfermedades */}
          {diseased.length > 0 && (
            <section aria-labelledby="diseased-heading">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-granate" aria-hidden="true" />
                <h2
                  id="diseased-heading"
                  className="text-base font-serif font-bold text-forest"
                >
                  Enfermedades y Plagas
                  <span className="ml-2 text-xs font-mono text-text-muted font-normal">
                    ({diseased.length})
                  </span>
                </h2>
              </div>
              <ConditionGrid conditions={diseased} />
            </section>
          )}

          {/* Sección: Sanas */}
          {healthy.length > 0 && (
            <section aria-labelledby="healthy-heading">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="w-4 h-4 text-accent" aria-hidden="true" />
                <h2
                  id="healthy-heading"
                  className="text-base font-serif font-bold text-forest"
                >
                  Estado Saludable
                  <span className="ml-2 text-xs font-mono text-text-muted font-normal">
                    ({healthy.length})
                  </span>
                </h2>
              </div>
              <ConditionGrid conditions={healthy} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/** Grid de tarjetas de condición */
function ConditionGrid({ conditions }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {conditions.map((condition) => (
        <ConditionCard key={condition.classKey} condition={condition} />
      ))}
    </div>
  );
}

/** Tarjeta individual de condición */
function ConditionCard({ condition }) {
  return (
    <Link
      to={`${ROUTES.CATALOG}/${condition.classKey}`}
      className="group block focus:outline-none focus:ring-2 focus:ring-accent rounded-xl"
    >
      <Card className="h-full p-4 space-y-3 hover:border-forest/40 transition-colors flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Badge status={condition.isHealthy ? 'HEALTHY' : 'DISEASED'} size="sm" />
            <ChevronRight
              className="w-4 h-4 text-text-muted group-hover:text-forest transition-colors mt-0.5 shrink-0"
              aria-hidden="true"
            />
          </div>

          <div>
            <h3 className="text-sm font-serif font-bold text-forest group-hover:text-accent transition-colors leading-snug">
              {condition.conditionName}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">{condition.cropName}</p>
          </div>
        </div>

        <MonoLabel className="text-[10px] truncate">{condition.classKey}</MonoLabel>
      </Card>
    </Link>
  );
}

/** Esqueletos de carga */
function ConditionSkeletons() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </Card>
      ))}
    </div>
  );
}
