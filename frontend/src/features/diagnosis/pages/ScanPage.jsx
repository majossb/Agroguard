import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, ChevronDown, ChevronUp, Image as ImageIcon, X, Sun, Frame, Sparkles, UserCheck } from 'lucide-react';
import { ROUTES } from '../../../shared/config/routes.js';
import { COPY } from '../../../shared/config/copy.es.js';
import { ENV } from '../../../shared/config/env.js';
import { Button } from '../../../shared/ui/Button.jsx';
import { Card } from '../../../shared/ui/Card.jsx';
import { Field } from '../../../shared/ui/Field.jsx';
import { Alert } from '../../../shared/ui/Alert.jsx';
import { MonoLabel } from '../../../shared/ui/MonoLabel.jsx';
import { CornerFrame } from '../../../shared/ui/CornerFrame.jsx';
import { validateImageFile, getImageDimensions } from '../lib/imageProcessor.js';
import { useCreateDiagnosis } from '../hooks/useCreateDiagnosis.js';
import { useCrops } from '../../catalog/hooks/useCrops.js';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { formatBytes } from '../../../shared/lib/formatters.js';

export function ScanPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Campos opcionales
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [plotName, setPlotName] = useState('');
  const [cropHint, setCropHint] = useState('');
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const navigate = useNavigate();

  const { crops } = useCrops();
  const { user, isAuthenticated } = useAuth();
  const { diagnose, cancel, isLoading, error: apiError } = useCreateDiagnosis();

  // Limpiar object URL al desmontar o cambiar de foto
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleProcessFile = async (file) => {
    setValidationError(null);

    // Validar tipo y peso
    const validation = validateImageFile(file, ENV.MAX_UPLOAD_MB);
    if (!validation.valid) {
      setValidationError(validation.error);
      return;
    }

    try {
      // Validar dimensiones mínimas (224 px)
      const dims = await getImageDimensions(file);
      const url = URL.createObjectURL(file);

      if (previewUrl) URL.revokeObjectURL(previewUrl);

      setSelectedFile(file);
      setPreviewUrl(url);
      setImageMeta({
        width: dims.width,
        height: dims.height,
        sizeBytes: file.size,
        name: file.name,
      });
    } catch (err) {
      setValidationError(err.message);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleRemovePhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageMeta(null);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setValidationError('Debes adjuntar o tomar una foto antes de analizar.');
      return;
    }

    try {
      const diagnosis = await diagnose({
        imageFile: selectedFile,
        plotName,
        cropHint,
        notes,
      });

      if (diagnosis) {
        navigate(ROUTES.RESULT, {
          state: {
            diagnosis,
            previewUrl,
          },
        });
      }
    } catch {
      // El error es capturado en apiError
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <MonoLabel>Módulo de Adquisición Foliar</MonoLabel>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest mt-1">
            Escanear Hoja de Cultivo
          </h1>
          <p className="text-sm text-text-muted mt-1 leading-relaxed">
            Sube o toma una fotografía clara del haz o envés de la hoja afectada para iniciar la evaluación fitosanitaria.
          </p>
        </div>

        {isAuthenticated && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-forest/5 border border-forest/20 text-xs font-mono text-forest shrink-0">
            <UserCheck className="w-4 h-4 text-accent" />
            <span>Sesión activa: {user?.fullName}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Zona de Captura / Arrastre */}
        <CornerFrame cornerColor="#1E3B2C" cornerSize="16px">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-10 transition-colors text-center ${
              isDragging
                ? 'border-accent bg-accent/5'
                : selectedFile
                  ? 'border-forest/30 bg-surface'
                  : 'border-border bg-surface hover:border-forest/40'
            }`}
          >
            {previewUrl && imageMeta ? (
              <div className="space-y-4">
                <div className="relative inline-block max-w-full">
                  <img
                    src={previewUrl}
                    alt="Vista previa de la hoja a diagnosticar"
                    className="max-h-72 sm:max-h-80 mx-auto rounded-lg object-contain shadow-sm border border-border"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isLoading}
                    className="absolute -top-2 -right-2 p-1.5 bg-granate text-white rounded-full shadow hover:bg-granate-dark transition-colors"
                    aria-label="Eliminar fotografía"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-cream border border-border text-xs font-mono text-text-muted">
                  <span>{imageMeta.width} × {imageMeta.height} px</span>
                  <span>•</span>
                  <span>{formatBytes(imageMeta.sizeBytes)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="w-14 h-14 rounded-2xl bg-cream border border-border mx-auto flex items-center justify-center text-forest">
                  <ImageIcon className="w-7 h-7 text-forest/70" />
                </div>

                <div className="space-y-1">
                  <p className="font-serif font-bold text-lg text-forest">
                    Arrastra la fotografía aquí
                  </p>
                  <p className="text-xs text-text-muted">
                    Formatos soportados: JPEG, PNG o WebP (hasta {ENV.MAX_UPLOAD_MB} MB)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {/* Botón Tomar Foto (Cámara Móvil) */}
                  <Button
                    type="button"
                    variant="primary"
                    icon={Camera}
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    Tomar foto
                  </Button>

                  {/* Botón Elegir Archivo */}
                  <Button
                    type="button"
                    variant="secondary"
                    icon={Upload}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Elegir archivo
                  </Button>
                </div>
              </div>
            )}

            {/* Inputs de archivo ocultos */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleFileInputChange}
              className="sr-only"
              aria-label="Tomar foto con cámara móvil"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="sr-only"
              aria-label="Seleccionar archivo de imagen"
            />
          </div>
        </CornerFrame>

        {/* Alertas de error */}
        {validationError && (
          <Alert type="error" onClose={() => setValidationError(null)}>
            {validationError}
          </Alert>
        )}

        {apiError && apiError.code === 'IMAGE_REJECTED' && (
          <Alert type="error" title="Imagen rechazada por el filtro visual (CLIP)">
            <div className="space-y-3">
              <p>{apiError.detail}</p>
              {apiError.clipTopLabels && apiError.clipTopLabels.length > 0 && (
                <div className="p-3 bg-granate/5 rounded-lg border border-granate/20 text-xs font-mono space-y-1">
                  <span className="font-semibold text-granate block">Detecciones principales del filtro:</span>
                  {apiError.clipTopLabels.map((lbl, idx) => (
                    <div key={idx} className="flex justify-between text-text-muted">
                      <span>• {lbl.label}</span>
                      <span className="font-semibold">{(lbl.score * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePhoto}
                >
                  Seleccionar otra imagen
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {apiError && apiError.code === 'IMAGE_REVIEW_REQUIRED' && (
          <Alert type="warning" title="Validación foliar ambigua (CLIP)">
            <div className="space-y-3">
              <p>{apiError.detail}</p>
              {apiError.clipTopLabels && apiError.clipTopLabels.length > 0 && (
                <div className="p-3 bg-amber/5 rounded-lg border border-amber/20 text-xs font-mono space-y-1">
                  <span className="font-semibold text-amber-dark block">Detecciones principales del filtro:</span>
                  {apiError.clipTopLabels.map((lbl, idx) => (
                    <div key={idx} className="flex justify-between text-text-muted">
                      <span>• {lbl.label}</span>
                      <span className="font-semibold">{(lbl.score * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePhoto}
                >
                  Reintentar con una foto más nítida
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {apiError && apiError.code !== 'IMAGE_REJECTED' && apiError.code !== 'IMAGE_REVIEW_REQUIRED' && (
          <Alert type="error" title="Error en el análisis">
            {apiError.detail || COPY.errors.generic}
          </Alert>
        )}


        {/* Sección Colapsable: Datos Opcionales de Campo */}
        <Card className="space-y-4">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="w-full flex items-center justify-between text-left text-sm font-semibold text-forest focus:outline-none"
            aria-expanded={showOptionalFields}
          >
            <span>Datos opcionales de campo (Lote, Cultivo y Notas)</span>
            {showOptionalFields ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
          </button>

          {showOptionalFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              <Field
                id="plotName"
                label="Nombre del lote o parcela"
                placeholder="Ej. Lote Norte, Invernadero 2"
                maxLength={100}
                value={plotName}
                onChange={(e) => setPlotName(e.target.value)}
                disabled={isLoading}
              />

              <Field
                id="cropHint"
                label="Cultivo sospechado"
                as="select"
                value={cropHint}
                onChange={(e) => setCropHint(e.target.value)}
                disabled={isLoading}
              >
                <option value="">Seleccionar cultivo (opcional)...</option>
                {crops.map((c) => (
                  <option key={c.cropKey} value={c.cropKey}>
                    {c.cropName} ({c.cropKey})
                  </option>
                ))}
              </Field>

              <div className="sm:col-span-2">
                <Field
                  id="notes"
                  label="Notas u observaciones de campo"
                  as="textarea"
                  rows={2}
                  placeholder="Ej. Síntomas observados en hojas basales tras temporada de lluvias..."
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isLoading}
                  helperText={`${notes.length} / 500 caracteres`}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Botón de Envío y Cancelación */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              type="submit"
              size="lg"
              variant="accent"
              isLoading={isLoading}
              disabled={!selectedFile || isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Analizando imagen...' : 'Analizar hoja'}
            </Button>

            {isLoading && (
              <Button type="button" variant="outline" size="lg" onClick={cancel}>
                Cancelar análisis
              </Button>
            )}
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            {isAuthenticated
              ? 'La fotografía se procesará en el servidor y quedará registrada automáticamente en tu cuaderno de campo.'
              : 'La foto se envía al servidor para analizarla. Si no inicias sesión, el diagnóstico no se guardará en tu historial.'}
          </p>
        </div>
      </form>

      {/* Consejos para una buena foto */}
      <section className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-serif font-bold text-lg text-forest">
          Consejos para una buena foto
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="space-y-2 p-4">
            <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-forest">
              <Sun className="w-4 h-4 text-amber-dark" />
            </div>
            <h4 className="font-sans font-bold text-xs text-forest uppercase tracking-wider">
              Luz natural difusa
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Evita sombras fuertes o sol directo perpendicular que cree reflejos brillantes sobre el haz foliar.
            </p>
          </Card>

          <Card className="space-y-2 p-4">
            <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-forest">
              <Frame className="w-4 h-4 text-forest" />
            </div>
            <h4 className="font-sans font-bold text-xs text-forest uppercase tracking-wider">
              Fondo neutro
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Apoya la hoja sobre una hoja de papel, cuaderno o superficie plana para aislar el tejido afectado.
            </p>
          </Card>

          <Card className="space-y-2 p-4">
            <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-forest">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <h4 className="font-sans font-bold text-xs text-forest uppercase tracking-wider">
              Hoja centrada
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Enfoca con nitidez la lesión y asegúrate de que la hoja ocupe la mayor parte del encuadre.
            </p>
          </Card>
        </div>
      </section>
    </div>
  );
}
