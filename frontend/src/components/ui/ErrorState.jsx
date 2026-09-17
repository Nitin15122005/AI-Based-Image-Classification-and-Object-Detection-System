import { AlertTriangle, WifiOff } from 'lucide-react';
import Card from './Card.jsx';
import Button from './Button.jsx';

export default function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again.',
  onRetry,
  retryLabel = 'Try again',
  variant = 'error',
  className,
}) {
  const Icon = variant === 'offline' ? WifiOff : AlertTriangle;

  return (
    <Card
      padding="xl"
      className={`flex flex-col items-center justify-center text-center py-16 ${className || ''}`}
      role="alert"
    >
      <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center text-error mb-space-md">
        <Icon className="w-7 h-7" strokeWidth={1.75} />
      </div>
      <h3 className="font-headline-md text-headline-md text-primary mb-space-xs">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
        {description}
      </p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </Card>
  );
}
