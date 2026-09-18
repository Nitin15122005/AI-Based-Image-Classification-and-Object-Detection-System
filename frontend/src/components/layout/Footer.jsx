import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import StatusIndicator from '../ui/StatusIndicator.jsx';
import { isRealApiConfigured } from '../../services/api.js';

const NAV_LINKS = [
  { to: '/analyze', label: 'Analyze' },
  { to: '/history', label: 'History' },
  { to: '/models', label: 'Models & Metrics' },
];

const MODEL_INFO_ITEMS = [
  'YOLO11s object detection',
  'ResNet50 classification',
  'COCO 2017 (80 object classes)',
  'Adjustable confidence threshold',
];

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low mt-auto">
      <div className="w-full px-margin-mobile md:px-margin py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-space-xl mb-space-xl">
          <div className="space-y-space-sm md:col-span-1">
            <Logo />
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Intelligent image understanding through computer vision — detect objects and
              classify what's in your images in seconds.
            </p>
          </div>

          <div className="space-y-space-sm">
            <h4 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider font-semibold">
              Navigation
            </h4>
            <ul className="space-y-space-xs font-body-sm text-body-sm text-on-surface-variant">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-on-surface transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-space-sm">
            <h4 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider font-semibold">
              Models
            </h4>
            <ul className="space-y-space-xs font-body-sm text-body-sm text-on-surface-variant">
              {MODEL_INFO_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-space-sm">
            <h4 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider font-semibold">
              System
            </h4>
            <div className="space-y-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <StatusIndicator
                tone="online"
                label={isRealApiConfigured ? 'API Status: Connected' : 'API Status: Ready'}
              />
              <div>
                <StatusIndicator tone="online" pulse={false} label="Models Status: Loaded" />
              </div>
            </div>
          </div>
        </div>
        <div className="pt-space-md border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
          <p>&copy; {new Date().getFullYear()} VisionAI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
