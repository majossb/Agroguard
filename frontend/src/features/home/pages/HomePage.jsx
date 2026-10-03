import { Link } from 'react-router-dom';
import { Camera, BookOpen, ArrowRight, AlertTriangle } from 'lucide-react';
import { ROUTES } from '../../../shared/config/routes.js';
import { Button } from '../../../shared/ui/Button.jsx';
import { Card } from '../../../shared/ui/Card.jsx';
import { Badge } from '../../../shared/ui/Badge.jsx';
import { MonoLabel } from '../../../shared/ui/MonoLabel.jsx';
import { useSystemStatus } from '../../system/hooks/useSystemStatus.js';
import { useCrops } from '../../catalog/hooks/useCrops.js';

export function HomePage() {
  const { modelInfo } = useSystemStatus();
  const { crops, isLoading: loadingCrops } = useCrops();

  return (
    <div className="space-y-12 md:space-y-16 py-4">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest/5 border border-border">
            <MonoLabel className="text-forest font-bold">
              Visión Artificial Agronómica • Modelo {modelInfo.name} v{modelInfo.version}
            </MonoLabel>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-forest leading-[1.15]">
            Sabe si tu cultivo está enfermo con una foto de la hoja.
          </h1>

          <p className="text-base sm:text-lg text-text-muted leading-relaxed max-w-xl">
            Fotografía una hoja en medio del surco. El sistema analiza la imagen en el servidor, evalúa si la planta está sana o enferma con su nivel de certeza y te brinda orientación de manejo agronómico.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to={ROUTES.SCAN}>
              <Button size="lg" icon={Camera} className="w-full sm:w-auto">
                Diagnosticar una hoja
              </Button>
            </Link>
            <Link to={ROUTES.CATALOG}>
              <Button variant="secondary" size="lg" icon={BookOpen} className="w-full sm:w-auto">
                Ver cultivos soportados
              </Button>
            </Link>
          </div>

          {/* Estadísticas Reales */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <span className="font-mono text-xs text-text-muted uppercase tracking-wider block">Patologías y Estados</span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-forest">{modelInfo.classCount}</span>
              <span className="text-xs text-text-subtle block">Clases identificables</span>
            </div>
            <div>
              <span className="font-mono text-xs text-text-muted uppercase tracking-wider block">Cultivos Agrícolas</span>
              <span className="font-serif text-2xl sm:text-3xl font-bold text-forest">
                {loadingCrops ? '...' : (crops.length || 14)}
              </span>
              <span className="text-xs text-text-subtle block">Especies vegetales</span>
            </div>
            {modelInfo.metrics && typeof modelInfo.metrics.accuracy === 'number' ? (
              <div>
                <span className="font-mono text-xs text-text-muted uppercase tracking-wider block">Precisión</span>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-forest">
                  {(modelInfo.metrics.accuracy * 100).toFixed(1)}%
                </span>
                <span className="text-xs text-text-subtle block">Validada</span>
              </div>
            ) : null}
          </div>

          {modelInfo.evaluationNote && (
            <p className="text-xs text-text-subtle italic">
              * Nota: {modelInfo.evaluationNote}.
            </p>
          )}
        </div>

        {/* Hero Card Visual */}
        <div className="lg:col-span-5">
          <Card withCorners className="space-y-4 bg-surface-card">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <MonoLabel>Muestra Demostrativa</MonoLabel>
              <Badge status="DISEASED" label="Enferma" />
            </div>

            {/* Ilustración SVG propia de una hoja con mancha foliar */}
            <div className="relative aspect-[4/3] rounded-lg bg-cream/70 border border-border/80 flex items-center justify-center overflow-hidden">
              <svg
                viewBox="0 0 200 150"
                className="w-48 h-48 text-forest/70"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-label="Ilustración de una hoja con sintomatología foliar"
              >
                {/* Hoja */}
                <path
                  d="M100 20 C140 30 170 70 150 110 C130 140 100 135 100 135 C100 135 70 140 50 110 C30 70 60 30 100 20 Z"
                  className="fill-accent/15 stroke-forest"
                  strokeWidth="2.5"
                />
                <path d="M100 20 L100 135" className="stroke-forest/60" strokeWidth="2" />
                <path d="M100 50 Q120 45 135 60" className="stroke-forest/40" />
                <path d="M100 75 Q80 70 65 85" className="stroke-forest/40" />
                <path d="M100 100 Q120 95 130 110" className="stroke-forest/40" />
                {/* Lesión foliar */}
                <circle cx="120" cy="70" r="11" className="fill-granate/40 stroke-granate" strokeWidth="1.5" />
                <circle cx="120" cy="70" r="5" className="fill-granate" />
              </svg>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-sm">
                <span className="font-serif font-bold text-forest text-base">Tomate • Tizón temprano</span>
                <span className="font-mono text-xs font-semibold text-accent">94.2 % confianza</span>
              </div>
              <p className="text-xs text-text-muted">
                Mancha concéntrica detectada en los foliolos inferiores de la planta.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section className="space-y-6 pt-6 border-t border-border">
        <div>
          <MonoLabel>Metodología de Campo</MonoLabel>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-1">
            Cómo funciona en 3 pasos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="space-y-3">
            <span className="font-mono text-2xl font-bold text-accent">01</span>
            <h3 className="font-serif text-lg font-bold text-forest">Toma la foto</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Fotografía la hoja afectada con luz natural difusa, asegurando que esté enfocada y ocupe la mayor parte de la foto.
            </p>
          </Card>

          <Card className="space-y-3">
            <span className="font-mono text-2xl font-bold text-accent">02</span>
            <h3 className="font-serif text-lg font-bold text-forest">Análisis en el servidor</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              La imagen se envía de forma segura a nuestro servidor y se analiza con un modelo de visión artificial especializado en fitopatología.
            </p>
          </Card>

          <Card className="space-y-3">
            <span className="font-mono text-2xl font-bold text-accent">03</span>
            <h3 className="font-serif text-lg font-bold text-forest">Recibe el resultado</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Descubres si la hoja está sana o enferma, el grado de confianza del sistema y recomendaciones agronómicas preventivas.
            </p>
          </Card>
        </div>
      </section>

      {/* Qué cultivos reconoce */}
      <section className="space-y-6 pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <MonoLabel>Cobertura Agrícola</MonoLabel>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-1">
              Qué cultivos reconoce
            </h2>
          </div>
          <Link to={ROUTES.CATALOG} className="text-sm font-semibold text-accent hover:underline flex items-center gap-1">
            Explorar catálogo completo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {crops.slice(0, 10).map((crop) => (
            <div
              key={crop.cropKey}
              className="bg-surface-card border border-border rounded-xl p-3.5 flex flex-col justify-between hover:border-accent/40 transition-colors"
            >
              <span className="font-serif font-bold text-forest text-sm">{crop.cropName}</span>
              <span className="text-xs text-text-muted font-mono mt-1">
                {crop.conditionsCount} condiciones
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Limitaciones y Aviso Profesional */}
      <section className="bg-surface border border-border rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 text-forest font-serif font-bold text-lg">
          <AlertTriangle className="w-5 h-5 text-amber" />
          <h3>Limitaciones del Sistema</h3>
        </div>
        <div className="text-xs text-text-muted space-y-2 leading-relaxed max-w-3xl">
          <p>
            El modelo de visión artificial fue entrenado con fotografías de referencia de laboratorio (New Plant Diseases Dataset). Las condiciones de campo, tales como sombras pronunciadas, hojas mojadas o polvo sobre la superficie pueden alterar la certeza del análisis.
          </p>
          <p>
            Los diagnósticos son estrictamente <strong>orientativos</strong> y no reemplazan la inspección técnica presencial. Antes de aplicar pesticidas o tratamientos químicos, consulta a un <strong>ingeniero agrónomo</strong>.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-forest text-surface rounded-2xl p-8 md:p-12 space-y-4 shadow-sm">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-surface">
            Empieza a diagnosticar
          </h2>
          <p className="text-sm text-surface/80 leading-relaxed">
            Diagnostica cualquier hoja de forma anónima e inmediata, o ingresa para registrar las evaluaciones en tu cuaderno de campo digital.
          </p>
        </div>
        <div className="pt-2">
          <Link to={ROUTES.SCAN}>
            <Button variant="accent" size="lg" icon={ArrowRight} iconPosition="right">
              Diagnosticar hoja ahora
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
