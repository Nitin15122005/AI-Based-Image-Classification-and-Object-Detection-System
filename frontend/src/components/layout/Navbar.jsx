import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Cpu } from 'lucide-react';
import Logo from './Logo.jsx';
import Button from '../ui/Button.jsx';
import StatusIndicator from '../ui/StatusIndicator.jsx';
import { classNames } from '../../utils/format.js';
import { isRealApiConfigured } from '../../services/api.js';

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/analyze', label: 'Analyze' },
  { to: '/history', label: 'History' },
  { to: '/models', label: 'Models & Metrics' },
];

function NavLinkItem({ to, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        classNames(
          'px-space-md py-space-xs rounded-lg font-label-lg text-label-lg transition-colors',
          isActive
            ? 'bg-primary-container text-on-primary shadow-sm'
            : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
        )
      }
    >
      {label}
    </NavLink>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-20 w-full px-margin-mobile md:px-margin flex items-center justify-between gap-space-lg">
        <div className="flex items-center gap-space-lg min-w-0">
          <Logo />
          <nav className="hidden xl:flex items-center gap-space-xs ml-space-md" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLinkItem key={link.to} {...link} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-space-md">
          <div className="hidden md:flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-low">
            <StatusIndicator
              tone="online"
              label={isRealApiConfigured ? 'API: Connected' : 'API: Ready'}
            />
          </div>
          <div className="hidden lg:flex items-center gap-1.5 px-space-sm py-space-xs rounded-full bg-surface-container-highest">
            <Cpu className="w-3.5 h-3.5 text-on-surface-variant" />
            <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
              YOLO11s + ResNet50
            </span>
          </div>
          <Button to="/analyze" size="md" className="hidden sm:inline-flex">
            Analyze Image
          </Button>

          <button
            type="button"
            className="xl:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-primary hover:bg-surface-container-high transition-colors"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div
        className={classNames(
          'xl:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out border-t border-surface-container',
          mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <nav className="flex flex-col gap-1 p-space-md bg-surface" aria-label="Mobile">
          {NAV_LINKS.map((link) => (
            <NavLinkItem key={link.to} {...link} onClick={() => setMobileOpen(false)} />
          ))}
          <Button to="/analyze" size="md" className="mt-space-sm" onClick={() => setMobileOpen(false)}>
            Analyze Image
          </Button>
        </nav>
      </div>
    </header>
  );
}
