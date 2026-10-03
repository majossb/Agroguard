import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Search, Filter, ChevronLeft, ChevronRight, Sprout } from 'lucide-react';
import { ROUTES } from '../../../shared/config/routes.js';
import { Button } from '../../../shared/ui/Button.jsx';
import { Card } from '../../../shared/ui/Card.jsx';
import { Badge } from '../../../shared/ui/Badge.jsx';
import { Field } from '../../../shared/ui/Field.jsx';
import { Skeleton } from '../../../shared/ui/Skeleton.jsx';
import { MonoLabel } from '../../../shared/ui/MonoLabel.jsx';
import { useDiagnoses } from '../hooks/useDiagnoses.js';
import { useCrops } from '../../catalog/hooks/useCrops.js';
import { formatDate, formatPercentage } from '../../../shared/lib/formatters.js';

export function DiagnosesPage() {
  const [page, setPage] = useState(1);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { crops } = useCrops();
  const { items, totalPages, totalItems, isLoading, isError } = useDiagnoses({
    page,
    pageSize: 12,
    healthStatus: selectedStatus,
    cropKey: selectedCrop,
  });

  // Filtro de búsqueda local por lote o notas
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const plot = item.context?.plotName?.toLowerCase() || '';
      const notes = item.context?.notes?.toLowerCase() || '';
      const condition = item.prediction?.conditionName?.toLowerCase() || '';
      const crop = item.prediction?.cropName?.toLowerCase() || '';
      return plot.includes(query) || notes.includes(query) || condition.includes(query) || crop.includes(query);
    });
  }, [items, searchQuery]);

  const hasActiveFilters = selectedCrop || selectedStatus || searchQuery.trim();

  const handleResetFilters = () => {
    setSelectedCrop('');
    setSelectedStatus('');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="space-y-8 py-2">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <MonoLabel>Cuaderno de Campo Digital</MonoLabel>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-1">
            Historial de Diagnósticos
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Registro de evaluaciones fitosanitarias realizadas en tus parcelas.
          </p>
        </div>

        <Link to={ROUTES.SCAN}>
          <Button icon={Camera} size="md">
            Nuevo análisis
          </Button>
        </Link>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-surface-card border border-border rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Búsqueda por texto */}
          <div className="sm:col-span-5">
            <Field
              id="search-diagnoses"
              type="search"
              placeholder="Buscar por lote, notas o condición..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>

          {/* Filtro Cultivo */}
          <div className="sm:col-span-4">
            <Field
              id="filter-crop"
              as="select"
              value={selectedCrop}
              onChange={(e) => {
                setSelectedCrop(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los cultivos</option>
              {crops.map((c) => (
                <option key={c.cropKey} value={c.cropKey}>
                  {c.cropName} ({c.cropKey})
                </option>
              ))}
            </Field>
          </div>

          {/* Filtro Estado */}
          <div className="sm:col-span-3">
            <Field
              id="filter-status"
              as="select"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="HEALTHY">Sanas</option>
              <option value="DISEASED">Enfermas</option>
              <option value="INCONCLUSIVE">No concluyentes</option>
            </Field>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-text-muted">
            <span>Filtros activos aplicados</span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-accent hover:underline font-medium"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Estados de Carga, Error y Contenido */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="space-y-3 p-4">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center space-y-3">
          <p className="text-sm font-medium text-granate">
            No se pudo cargar el historial de diagnósticos.
          </p>
          <p className="text-xs text-text-muted">
            Verifica tu conexión al servidor e inténtalo de nuevo.
          </p>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card withCorners className="p-10 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-cream border border-border mx-auto flex items-center justify-center text-forest">
            <Sprout className="w-6 h-6 text-accent" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-serif font-bold text-forest">
              {hasActiveFilters
                ? 'No se encontraron diagnósticos'
                : 'Tu cuaderno de campo está vacío'}
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              {hasActiveFilters
                ? 'Ningún registro coincide con los criterios de búsqueda seleccionados.'
                : 'Aún no has registrado ninguna muestra foliar. Escanea tu primera hoja para comenzar tu seguimiento.'}
            </p>
          </div>

          <div className="pt-2">
            {hasActiveFilters ? (
              <Button variant="secondary" onClick={handleResetFilters} icon={Filter}>
                Restablecer filtros
              </Button>
            ) : (
              <Link to={ROUTES.SCAN}>
                <Button icon={Camera}>Escanear primera hoja</Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                to={`${ROUTES.DIAGNOSES}/${item.id}`}
                className="group block focus:outline-none focus:ring-2 focus:ring-accent rounded-2xl"
              >
                <Card className="h-full space-y-3 hover:border-forest/40 transition-colors bg-surface-card p-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Imagen miniatura */}
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-cream/60 border border-border flex items-center justify-center relative">
                      {item.image?.url ? (
                        <img
                          src={item.image.url}
                          alt={`${item.prediction.cropName} - ${item.prediction.conditionName}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                      ) : (
                        <Sprout className="w-8 h-8 text-forest/40" />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge status={item.verdict.healthStatus} size="sm" />
                      </div>
                    </div>

                    {/* Veredicto */}
                    <div className="space-y-1">
                      <h3 className="font-serif font-bold text-forest text-base group-hover:text-accent transition-colors">
                        {item.prediction.cropName} • {item.prediction.conditionName}
                      </h3>
                      <p className="text-xs font-mono text-text-muted">
                        Confianza: {formatPercentage(item.verdict.confidence)}
                      </p>
                    </div>
                  </div>

                  {/* Pie de tarjeta con Lote y Fecha */}
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-subtle font-mono">
                    <span className="truncate max-w-[140px]">
                      {item.context?.plotName || 'Sin lote'}
                    </span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs font-mono text-text-muted">
                Página {page} de {totalPages} ({totalItems} registros)
              </span>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  icon={ChevronLeft}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  icon={ChevronRight}
                  iconPosition="right"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
