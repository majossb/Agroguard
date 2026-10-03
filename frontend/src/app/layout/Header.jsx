import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Sprout, History, BookOpen, Camera } from 'lucide-react';
import { ROUTES } from '../../shared/config/routes.js';
import { COPY } from '../../shared/config/copy.es.js';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useToast } from '../providers/ToastProvider.jsx';
import { SystemChip } from '../../features/system/components/SystemChip.jsx';

/**
 * Encabezado de navegación responsive.
 */
export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    toast.info('Sesión cerrada correctamente.', 'Esperamos verte pronto en AgroGuard.');
    navigate(ROUTES.HOME, { replace: true });
  };

  const navLinkStyles = ({ isActive }) =>
    `text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
      isActive
        ? 'text-forest bg-forest/5 font-semibold'
        : 'text-text-main/80 hover:text-forest hover:bg-forest/5'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Logo y Nombre */}
          <Link to={ROUTES.HOME} className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-surface shadow-sm group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-surface" />
            </div>
            <div>
              <span className="font-serif text-xl md:text-2xl font-bold tracking-tight text-forest block leading-none">
                {COPY.app.name}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted block mt-1">
                Phyto-Diagnostics
              </span>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <NavLink to={ROUTES.HOME} className={navLinkStyles}>
              {COPY.nav.home}
            </NavLink>
            <NavLink to={ROUTES.SCAN} className={navLinkStyles}>
              {COPY.nav.scan}
            </NavLink>
            {isAuthenticated && (
              <NavLink to={ROUTES.DIAGNOSES} className={navLinkStyles}>
                {COPY.nav.history}
              </NavLink>
            )}
            <NavLink to={ROUTES.CATALOG} className={navLinkStyles}>
              {COPY.nav.catalog}
            </NavLink>
          </nav>

          {/* Chips y Acciones de Usuario */}
          <div className="hidden sm:flex items-center gap-3">
            <SystemChip />

            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-border text-sm font-medium text-forest hover:bg-cream transition-colors"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <User className="w-4 h-4 text-accent" />
                  <span className="max-w-[120px] truncate">{user?.fullName || 'Mi Cuenta'}</span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface-card rounded-xl shadow-modal border border-border py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <Link
                      to={ROUTES.ACCOUNT}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-main hover:bg-cream transition-colors"
                    >
                      <User className="w-4 h-4 text-text-muted" />
                      <span>{COPY.nav.account}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-granate hover:bg-granate-light transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{COPY.nav.logout}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-forest text-surface hover:bg-forest-dark text-sm font-medium transition-colors shadow-sm"
              >
                {COPY.nav.login}
              </Link>
            )}
          </div>

          {/* Botón Menú Móvil */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-forest hover:bg-forest/5 focus:outline-none focus:ring-2 focus:ring-accent"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="py-2 border-b border-border/60">
            <SystemChip />
          </div>

          <div className="flex flex-col space-y-1">
            <NavLink
              to={ROUTES.HOME}
              onClick={() => setMobileMenuOpen(false)}
              className={navLinkStyles}
            >
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4" />
                <span>{COPY.nav.home}</span>
              </div>
            </NavLink>
            <NavLink
              to={ROUTES.SCAN}
              onClick={() => setMobileMenuOpen(false)}
              className={navLinkStyles}
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span>{COPY.nav.scan}</span>
              </div>
            </NavLink>
            {isAuthenticated && (
              <NavLink
                to={ROUTES.DIAGNOSES}
                onClick={() => setMobileMenuOpen(false)}
                className={navLinkStyles}
              >
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <span>{COPY.nav.history}</span>
                </div>
              </NavLink>
            )}
            <NavLink
              to={ROUTES.CATALOG}
              onClick={() => setMobileMenuOpen(false)}
              className={navLinkStyles}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{COPY.nav.catalog}</span>
              </div>
            </NavLink>
          </div>

          <div className="pt-3 border-t border-border/60">
            {isAuthenticated ? (
              <div className="space-y-2">
                <Link
                  to={ROUTES.ACCOUNT}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-main rounded-lg hover:bg-cream"
                >
                  <User className="w-4 h-4 text-accent" />
                  <span>{COPY.nav.account} ({user?.fullName})</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-granate rounded-lg hover:bg-granate-light"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{COPY.nav.logout}</span>
                </button>
              </div>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg bg-forest text-surface font-medium text-sm shadow-sm"
              >
                {COPY.nav.login}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
