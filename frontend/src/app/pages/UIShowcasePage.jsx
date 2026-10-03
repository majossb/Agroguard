import { Badge } from '../../shared/ui/Badge.jsx';
import { Button } from '../../shared/ui/Button.jsx';
import { Card } from '../../shared/ui/Card.jsx';
import { Field } from '../../shared/ui/Field.jsx';
import { Alert } from '../../shared/ui/Alert.jsx';
import { ProgressBar } from '../../shared/ui/ProgressBar.jsx';
import { Spinner } from '../../shared/ui/Spinner.jsx';
import { Skeleton } from '../../shared/ui/Skeleton.jsx';
import { MonoLabel } from '../../shared/ui/MonoLabel.jsx';
import { CornerFrame } from '../../shared/ui/CornerFrame.jsx';
import { Camera, Leaf } from 'lucide-react';

/**
 * Página de catálogo de componentes — Solo visible en desarrollo (/_ui).
 */
export function UIShowcasePage() {
  return (
    <div className="space-y-12 py-6">
      <div>
        <MonoLabel className="text-accent font-bold">Entorno de Desarrollo</MonoLabel>
        <h1 className="text-3xl font-serif font-bold text-forest mt-1">
          Catálogo de Componentes Base
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Vista de desarrollo para validar el sistema de diseño contra las maquetas visuales.
        </p>
      </div>

      {/* Tokens de Color */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-forest border-b border-border pb-2">Tokens de Color</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: 'Crema (Fondo)', bg: 'bg-cream', text: '#F8F4E6' },
            { name: 'Superficie', bg: 'bg-surface', text: '#FFFCF3' },
            { name: 'Borde', bg: 'bg-border', text: '#E4DDC8' },
            { name: 'Bosque (Primario)', bg: 'bg-forest', text: '#1E3B2C' },
            { name: 'Acento (Verde)', bg: 'bg-accent', text: '#2F7A45' },
            { name: 'Granate (Enfermo)', bg: 'bg-granate', text: '#7A1F14' },
            { name: 'Ámbar (Dudoso)', bg: 'bg-amber', text: '#B7791F' },
            { name: 'Texto Principal', bg: 'bg-text-main', text: '#1F2A24' },
          ].map((token) => (
            <div key={token.name} className="space-y-1.5">
              <div className={`h-14 rounded-xl border border-border ${token.bg} shadow-sm`} />
              <p className="text-xs font-medium text-text-main">{token.name}</p>
              <p className="text-xs font-mono text-text-muted">{token.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tipografía */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-forest border-b border-border pb-2">Tipografía</h2>
        <div className="space-y-3">
          <div className="font-serif text-5xl font-bold text-forest">Titular Editorial H1 (Newsreader)</div>
          <div className="font-serif text-3xl font-bold text-forest">Encabezado de sección H2</div>
          <div className="font-serif text-xl font-bold text-forest">Subtítulo de tarjeta H3</div>
          <div className="font-sans text-base text-text-main">Texto de cuerpo Sans-Serif. Legible en dispositivos móviles a 360 px.</div>
          <div className="font-mono text-sm text-text-muted uppercase tracking-wider">MONO LABEL — ETIQUETA TÉCNICA</div>
        </div>
      </section>

      {/* Botones */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-forest border-b border-border pb-2">Botones</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="accent">Acento</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Eliminar</Button>
          <Button isLoading>Cargando...</Button>
          <Button disabled>Desactivado</Button>
          <Button icon={Camera}>Con icono</Button>
          <Button size="sm">Pequeño</Button>
          <Button size="lg">Grande</Button>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-forest border-b border-border pb-2">Badges de Estado</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Badge status="HEALTHY" />
          <Badge status="DISEASED" />
          <Badge status="INCONCLUSIVE" />
          <Badge label="PENDING_REVIEW" variant="amber" />
          <Badge label="Catálogo" variant="neutral" />
          <Badge label="Verificado" variant="forest" />
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-forest border-b border-border pb-2">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-serif text-lg font-bold text-forest mb-2">Card Normal</h3>
            <p className="text-sm text-text-muted">Tarjeta con borde fino y esquinas redondeadas. Se usa para agrupar contenido relacionado.</p>
          </Card>
          <Card withCorners cornerColor="#2F7A45">
            <MonoLabel className="mb-2">Con Marcos Decorativos</MonoLabel>
            <h3 className="font-serif text-lg font-bold text-forest mb-2">Card con CornerFrame</h3>
            <p className="text-sm text-text-muted">Inspirada en el marco técnico de las maquetas de captura y resultado.</p>
          </Card>
        </div>
      </section>

      {/* Alerts */}
      <section className="space-y-3">
        <h2 className="text-xl font-serif font-bold text-forest border-b border-border pb-2">Alertas</h2>
        <Alert type="info" title="Información">
          Modo demostración activo: los diagnósticos generados son simulados.
        </Alert>
        <Alert type="success" title="Guardado exitoso">
          El diagnóstico se guardó correctamente en tu historial.
        </Alert>
        <Alert type="warning" title="Contenido Pendiente">
          Las recomendaciones de manejo están pendientes de validación por un ingeniero agrónomo.
        </Alert>
        <Alert type="error" title="Error de imagen">
          El formato de la imagen no es compatible. Usa JPEG, PNG o WebP.
        </Alert>
      </section>

      {/* ProgressBar */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-forest border-b border-border pb-2">Barras de Progreso</h2>
        <div className="space-y-4 max-w-md">
          <ProgressBar value={0.942} showLabel label="Confianza — DISEASED" status="DISEASED" />
          <ProgressBar value={0.65} showLabel label="Confianza — INCONCLUSIVE" status="INCONCLUSIVE" />
          <ProgressBar value={0.98} showLabel label="Confianza — HEALTHY" status="HEALTHY" />
        </div>
      </section>

      {/* Fields */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-forest border-b border-border pb-2">Campos de Formulario</h2>
        <div className="max-w-sm space-y-4">
          <Field id="email-demo" label="Correo Electrónico" type="email" placeholder="juan@ejemplo.com" required />
          <Field id="notes-demo" label="Notas de Campo" as="textarea" rows={3} placeholder="Manchas amarillas en hojas inferiores..." helperText="Máximo 500 caracteres." />
          <Field id="error-demo" label="Contraseña" type="password" error="La contraseña debe tener al menos 8 caracteres." />
        </div>
      </section>

      {/* Spinners y Skeleton */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-forest border-b border-border pb-2">Carga</h2>
        <div className="flex gap-6 items-center">
          <Spinner size="sm" className="text-accent" />
          <Spinner size="md" className="text-forest" />
          <Spinner size="lg" className="text-granate" />
        </div>
        <div className="max-w-sm space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton variant="rectangular" className="h-32 w-full" />
        </div>
      </section>

      {/* CornerFrame */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-forest border-b border-border pb-2">Marco Decorativo (CornerFrame)</h2>
        <CornerFrame className="bg-cream-light border border-border rounded-xl p-8" cornerSize="18px" cornerColor="#1E3B2C">
          <div className="text-center py-8">
            <Leaf className="w-10 h-10 text-accent mx-auto mb-3" />
            <p className="text-sm text-text-muted font-mono">Marco de encuadre técnico</p>
            <p className="text-xs text-text-subtle mt-1">Inspirado en los diseños de captura de las maquetas</p>
          </div>
        </CornerFrame>
      </section>
    </div>
  );
}
