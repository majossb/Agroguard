import { Outlet } from 'react-router-dom';
import { Header } from './Header.jsx';
import { Footer } from './Footer.jsx';

/**
 * Layout principal de la aplicación.
 */
export function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-cream text-text-main">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
