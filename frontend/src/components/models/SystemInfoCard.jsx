import Card from '../ui/Card.jsx';

export default function SystemInfoCard({ system }) {
  const rows = [
    { label: 'Dataset', value: system.dataset },
    { label: 'Number of Classes', value: system.numClasses },
    { label: 'Framework', value: system.framework },
    { label: 'Training Hardware', value: system.trainingHardware },
    { label: 'Serving Device', value: system.servingDevice },
    { label: 'Batch Size', value: system.batchSize },
    { label: 'Optimizer', value: system.optimizer },
    { label: 'Epochs', value: system.epochs },
  ];

  return (
    <Card className="flex flex-col gap-space-md">
      <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">Model &amp; System Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
        {rows.map((row) => (
          <div key={row.label} className="p-space-sm rounded-lg bg-surface-container-low">
            <span className="font-label-sm text-label-sm text-on-surface-variant block">{row.label}</span>
            <span className="font-body-sm text-body-sm font-semibold text-on-surface">{row.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
