import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';

export default function RootLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-surface font-body-md text-on-surface">
      <Navbar />
      <main key={location.pathname} className="flex-grow w-full pt-20 animate-fade-in">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
