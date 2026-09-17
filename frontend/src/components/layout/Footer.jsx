import Logo from './Logo.jsx';

const FOOTER_COLUMNS = [
  {
    title: 'Dataset & Pipeline',
    items: ['COCO 2017 (80 object classes)', 'ImageNet-1K pretrained weights', 'Confidence threshold: adjustable', 'NMS IoU overlap: 0.50'],
  },
  {
    title: 'Architecture Stack',
    items: ['FastAPI inference service (planned)', 'React + Vite client shell', 'YOLO11s object detection', 'ResNet50 classification'],
  },
  {
    title: 'Capstone Governance',
    items: ['Machine Perception Specialization', 'Internship Evaluation Panel'],
  },
];

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low mt-auto">
      <div className="w-full px-margin-mobile md:px-margin py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-space-xl mb-space-xl">
          <div className="space-y-space-sm md:col-span-1">
            <Logo />
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              An internship capstone combining YOLO11s object detection and ResNet50 image
              classification into one computer-vision product.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div className="space-y-space-sm" key={col.title}>
              <h4 className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider font-semibold">
                {col.title}
              </h4>
              <ul className="space-y-space-xs font-body-sm text-body-sm text-on-surface-variant">
                {col.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-space-md border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-space-sm text-on-surface-variant font-body-sm text-body-sm">
          <p>&copy; {new Date().getFullYear()} VisionAI Capstone Project. Mock evaluation data shown until models are trained.</p>
          <div className="flex gap-space-md">
            <span>Frontend v0.1</span>
            <span>Backend: Not yet connected</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
