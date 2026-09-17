import Card from './Card.jsx';

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <Card
      padding="xl"
      className={`flex flex-col items-center justify-center text-center py-16 ${className || ''}`}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center text-outline mb-space-md">
          <Icon className="w-8 h-8" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="font-headline-md text-headline-md text-primary mb-space-xs">{title}</h3>
      {description && (
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">
          {description}
        </p>
      )}
      {action}
    </Card>
  );
}
