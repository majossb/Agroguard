import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, UserPlus, Eye, EyeOff, ShieldCheck, Leaf, CheckCircle2 } from 'lucide-react';
import { loginSchema, registerSchema } from '../validators/authSchemas.js';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { useToast } from '../../../app/providers/ToastProvider.jsx';
import { ROUTES } from '../../../shared/config/routes.js';
import { COPY } from '../../../shared/config/copy.es.js';
import { sanitizeReturnTo } from '../../../shared/lib/sanitize.js';
import { Button } from '../../../shared/ui/Button.jsx';
import { Card } from '../../../shared/ui/Card.jsx';
import { Field } from '../../../shared/ui/Field.jsx';
import { Alert } from '../../../shared/ui/Alert.jsx';
import { MonoLabel } from '../../../shared/ui/MonoLabel.jsx';
import { CornerFrame } from '../../../shared/ui/CornerFrame.jsx';

export function LoginPage() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);

  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const destination = sanitizeReturnTo(location.state?.returnTo, ROUTES.HOME);

  // Formulario de Inicio de Sesión con validación onBlur y revalidación onChange
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  // Formulario de Registro con validación onBlur y revalidación onChange
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  if (isAuthenticated && !authLoading && !loginForm.formState.isSubmitting) {
    return <Navigate to={destination} replace />;
  }

  const handleLoginSubmit = async (values) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      toast.success('¡Inicio de sesión exitoso!', 'Bienvenido/a nuevamente a AgroGuard.');
      navigate(destination, { replace: true });
    } catch (err) {
      if (err.status === 401 || err.code === 'INVALID_CREDENTIALS') {
        setServerError('Correo o contraseña incorrectos. Por favor, verifica tus datos.');
      } else if (err.status === 429) {
        setServerError('Demasiados intentos. Por favor, espera un momento antes de volver a intentar.');
      } else {
        setServerError(err.detail || COPY.errors.generic);
      }
    }
  };

  const handleRegisterSubmit = async (values) => {
    setServerError(null);
    try {
      const user = await register(values.email, values.password, values.fullName);
      setRegistrationSuccess({
        fullName: user?.fullName || values.fullName,
        email: values.email,
      });
      registerForm.reset();
      loginForm.setValue('email', values.email);
    } catch (err) {
      if (err.status === 409 || err.code === 'EMAIL_ALREADY_EXISTS') {
        setServerError('Ya existe una cuenta registrada con este correo electrónico. Intenta iniciar sesión.');
      } else {
        setServerError(err.detail || COPY.errors.generic);
      }
    }
  };

  const handleConfirmRegistration = () => {
    setRegistrationSuccess(null);
    setActiveTab('login');
    setServerError(null);
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-cream border border-border mx-auto flex items-center justify-center text-forest">
          <Leaf className="w-6 h-6 text-accent" />
        </div>
        <MonoLabel>Identificación de Usuario</MonoLabel>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest">
          Cuaderno de Campo AgroGuard
        </h1>
        <p className="text-xs text-text-muted max-w-sm mx-auto">
          Inicia sesión para registrar y monitorear tus evaluaciones fitosanitarias en tu historial.
        </p>
      </div>

      <CornerFrame cornerColor="#1E3B2C" cornerSize="16px">
        <Card className="p-6 space-y-6 bg-surface-card">
          {/* Pantalla de Confirmación de Registro Exitoso */}
          {registrationSuccess ? (
            <div className="text-center space-y-5 py-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-accent-light border border-accent/30 mx-auto flex items-center justify-center text-accent">
                <CheckCircle2 className="w-8 h-8 text-accent" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-serif font-bold text-forest">
                  ¡Cuenta creada exitosamente!
                </h2>
                <p className="text-sm text-text-muted leading-relaxed">
                  Hola <strong className="text-forest">{registrationSuccess.fullName}</strong>, tu cuenta con correo{' '}
                  <strong className="text-forest break-all">{registrationSuccess.email}</strong> ha sido creada correctamente.
                </p>
                <p className="text-xs text-text-muted pt-1">
                  Inicia sesión con tus credenciales para acceder a tu cuaderno de campo digital.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                icon={LogIn}
                onClick={handleConfirmRegistration}
                className="w-full"
              >
                Iniciar sesión
              </Button>
            </div>
          ) : (
            <>
              {/* Selector de Pestañas */}
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setServerError(null);
                  }}
                  className={`flex-1 pb-3 text-sm font-serif font-bold text-center border-b-2 transition-colors ${
                    activeTab === 'login'
                      ? 'border-forest text-forest'
                      : 'border-transparent text-text-muted hover:text-text-main'
                  }`}
                >
                  Iniciar sesión
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setServerError(null);
                  }}
                  className={`flex-1 pb-3 text-sm font-serif font-bold text-center border-b-2 transition-colors ${
                    activeTab === 'register'
                      ? 'border-forest text-forest'
                      : 'border-transparent text-text-muted hover:text-text-main'
                  }`}
                >
                  Crear cuenta
                </button>
              </div>

              {/* Error del Servidor */}
              {serverError && (
                <Alert type="error" onClose={() => setServerError(null)}>
                  {serverError}
                </Alert>
              )}

              {/* Formulario de Inicio de Sesión */}
              {activeTab === 'login' ? (
                <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4" noValidate>
                  <Field
                    id="login-email"
                    label="Correo Electrónico"
                    type="email"
                    placeholder="ejemplo@agroguard.dev"
                    autoComplete="email"
                    error={loginForm.formState.errors.email?.message}
                    {...loginForm.register('email')}
                    disabled={loginForm.formState.isSubmitting}
                  />

                  <div className="space-y-1.5">
                    <div className="relative">
                      <Field
                        id="login-password"
                        label="Contraseña"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        error={loginForm.formState.errors.password?.message}
                        {...loginForm.register('password')}
                        disabled={loginForm.formState.isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-text-muted hover:text-text-main p-1"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    icon={LogIn}
                    className="w-full"
                    isLoading={loginForm.formState.isSubmitting}
                    disabled={loginForm.formState.isSubmitting}
                  >
                    {loginForm.formState.isSubmitting ? 'Iniciando sesión...' : 'Ingresar al Cuaderno'}
                  </Button>
                </form>
              ) : (
                /* Formulario de Creación de Cuenta */
                <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4" noValidate>
                  <Field
                    id="register-fullname"
                    label="Nombre Completo"
                    type="text"
                    placeholder="Juan Pérez"
                    autoComplete="name"
                    error={registerForm.formState.errors.fullName?.message}
                    {...registerForm.register('fullName')}
                    disabled={registerForm.formState.isSubmitting}
                  />

                  <Field
                    id="register-email"
                    label="Correo Electrónico"
                    type="email"
                    placeholder="ejemplo@agroguard.dev"
                    autoComplete="email"
                    error={registerForm.formState.errors.email?.message}
                    {...registerForm.register('email')}
                    disabled={registerForm.formState.isSubmitting}
                  />

                  <div className="space-y-1.5">
                    <div className="relative">
                      <Field
                        id="register-password"
                        label="Contraseña (mínimo 8 caracteres)"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        error={registerForm.formState.errors.password?.message}
                        {...registerForm.register('password')}
                        disabled={registerForm.formState.isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-text-muted hover:text-text-main p-1"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="relative">
                      <Field
                        id="register-confirmPassword"
                        label="Confirmar Contraseña"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        error={registerForm.formState.errors.confirmPassword?.message}
                        {...registerForm.register('confirmPassword')}
                        disabled={registerForm.formState.isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-9 text-text-muted hover:text-text-main p-1"
                        aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Ver confirmación de contraseña'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    icon={UserPlus}
                    className="w-full"
                    isLoading={registerForm.formState.isSubmitting}
                    disabled={registerForm.formState.isSubmitting}
                  >
                    {registerForm.formState.isSubmitting ? 'Creando cuenta...' : 'Registrar Cuenta'}
                  </Button>
                </form>
              )}

              {/* Aviso de Privacidad y Seguridad */}
              <div className="pt-2 border-t border-border flex items-start gap-2 text-xs text-text-muted">
                <ShieldCheck className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Tus credenciales y diagnósticos viajan cifrados. El token de acceso se mantiene estrictamente en memoria y nunca se almacena en el disco de tu navegador.
                </p>
              </div>
            </>
          )}
        </Card>
      </CornerFrame>
    </div>
  );
}
