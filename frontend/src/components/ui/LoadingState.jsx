import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'w-5 h-5' }) {
  return <Loader2 className={`${className} animate-spin text-secondary`} strokeWidth={2.5} />;
}

export default function LoadingState({ title = 'Loading…', description, className }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 gap-space-md ${className || ''}`}>
      <Spinner className="w-8 h-8" />
      <div>
        <h3 className="font-headline-sm text-headline-sm text-primary">{title}</h3>
        {description && (
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
