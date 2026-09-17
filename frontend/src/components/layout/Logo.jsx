import { ScanEye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ className }) {
  return (
    <Link to="/" className={`flex items-center gap-space-sm group ${className || ''}`}>
      <span className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm group-hover:bg-primary-container transition-colors">
        <ScanEye className="w-5 h-5" strokeWidth={2} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-headline-sm text-headline-sm text-primary tracking-tight">VisionAI</span>
        <span className="font-label-sm text-label-sm px-1.5 py-0.5 mt-1 rounded bg-surface-container-high text-on-surface-variant self-start">
          Capstone · CV
        </span>
      </span>
    </Link>
  );
}
