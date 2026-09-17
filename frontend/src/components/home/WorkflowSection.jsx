import { UploadCloud, Cpu, ScanSearch, Download } from 'lucide-react';
import { SectionHeading } from '../layout/Section.jsx';
import Card from '../ui/Card.jsx';

const STEPS = [
  {
    number: '01',
    icon: UploadCloud,
    title: 'Upload',
    body: 'Drag and drop any JPG, PNG, or WEBP image up to 25MB from your device.',
    footer: 'Client-side validation',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'Analyze',
    body: 'The dual pipeline runs YOLO11s detection followed by ResNet50 classification.',
    footer: 'Detection + classification',
  },
  {
    number: '03',
    icon: ScanSearch,
    title: 'Review',
    body: 'Inspect interactive bounding boxes, filter by class, and compare confidence scores.',
    footer: 'Interactive results canvas',
  },
  {
    number: '04',
    icon: Download,
    title: 'Export',
    body: 'Download the annotated image or the full structured JSON result for later use.',
    footer: 'Image / JSON export',
  },
];

export default function WorkflowSection() {
  return (
    <>
      <SectionHeading
        eyebrow="Inference Lifecycle"
        title="From image to insight"
        description="A simple four-step workflow takes a raw image to an audited, reviewable analysis."
        className="text-center [&>div:first-child]:mx-auto"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {STEPS.map((step) => (
          <Card key={step.number} className="flex flex-col justify-between" hover>
            <div>
              <span className="font-headline-lg text-headline-lg text-outline-variant/60 font-bold block mb-4">
                {step.number}
              </span>
              <div className="w-10 h-10 rounded-lg bg-surface-container-low text-primary flex items-center justify-center mb-3 shadow-sm">
                <step.icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h4 className="font-headline-sm text-headline-sm text-primary mb-1">{step.title}</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{step.body}</p>
            </div>
            <div className="mt-6 pt-3 text-xs font-code-sm text-code-sm text-on-surface-variant/70">
              {step.footer}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
