import { Sprout, ShieldAlert } from 'lucide-react';
import { COPY } from '../../shared/config/copy.es.js';

/**
 * Pie de página en verde bosque profundo con créditos y advertencias de uso orientativo.
 */
export function Footer() {
  return (
    <footer className="bg-forest-dark text-surface/90 border-t border-forest mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Columna 1: Marca y descripción */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-surface">
              <Sprout className="w-5 h-5 text-accent" />
              <span className="font-serif text-xl font-bold tracking-tight">
                {COPY.app.name}
              </span>
            </div>
            <p className="text-xs text-surface/75 leading-relaxed max-w-sm">
              {COPY.app.tagline}. Herramienta orientativa de apoyo para agricultores pequeños y medianos.
            </p>
          </div>

          {/* Columna 2: Dataset y Metodología */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-accent font-semibold">
              Datos de Referencia
            </h4>
            <p className="text-xs text-surface/75 leading-relaxed">
              Entrenado con el conjunto de datos referencial <em>New Plant Diseases Dataset</em> (derivado de PlantVillage).
            </p>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-surface/60 bg-forest/60 px-2.5 py-1 rounded-md border border-forest">
              <span>38 Clases Fitosanitarias</span>
              <span>•</span>
              <span>14 Cultivos</span>
            </div>
          </div>

          {/* Columna 3: Nota Agronómica */}
          <div className="space-y-2 bg-forest/40 p-4 rounded-xl border border-forest">
            <div className="flex items-center gap-2 text-amber text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Aviso Agronómico</span>
            </div>
            <p className="text-xs text-surface/75 leading-relaxed">
              {COPY.disclaimers.agronomicAdvice}
            </p>
          </div>
        </div>

        {/* Línea inferior de copyright */}
        <div className="mt-8 pt-6 border-t border-forest flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-surface/50 font-mono">
          <p>© {new Date().getFullYear()} AgroGuard. Proyecto de Ingeniería de Software.</p>
          <p>Sin fines de lucro • Uso académico y demostrativo</p>
        </div>
      </div>
    </footer>
  );
}
