import { Compass } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import Button from '../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <PageContainer className="py-24 flex flex-col items-center text-center gap-space-md min-h-[60vh] justify-center">
      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary mb-space-sm">
        <Compass className="w-8 h-8" strokeWidth={1.5} />
      </div>
      <span className="font-code-sm text-code-sm text-secondary font-semibold uppercase tracking-widest">
        Error 404
      </span>
      <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight">Page not found</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved. Let&rsquo;s get you back on track.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-space-sm pt-space-sm">
        <Button to="/" variant="primary">
          Back to Home
        </Button>
        <Button to="/analyze" variant="secondary">
          Analyze an Image
        </Button>
      </div>
    </PageContainer>
  );
}
