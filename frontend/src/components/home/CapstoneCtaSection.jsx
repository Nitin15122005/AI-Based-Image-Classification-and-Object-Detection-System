import { GraduationCap, ArrowRight } from 'lucide-react';
import Button from '../ui/Button.jsx';

const SPECS = ['React + Vite Client', 'FastAPI Service (planned)', 'YOLO11s Detection', 'COCO 2017 Weights'];

export default function CapstoneCtaSection() {
  return (
    <div className="p-8 md:p-12 rounded-3xl bg-primary text-on-primary relative overflow-hidden shadow-2xl">
      <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-highest/20 text-on-primary font-label-sm text-label-sm">
            <GraduationCap className="w-4 h-4" />
            Internship Machine Perception Specialization
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-primary tracking-tight">
            Bridging modern neural inference with accessible interactive interfaces.
          </h2>
          <p className="font-body-md text-body-md text-on-primary-container max-w-2xl leading-relaxed">
            Built as an evaluation capstone, VisionAI demonstrates an end-to-end computer-vision
            stack — from image upload through detection and classification to a reviewable,
            responsive result.
          </p>
          <div className="flex flex-wrap gap-4 pt-4 text-xs font-code-sm text-code-sm text-on-primary-container">
            {SPECS.map((spec) => (
              <span key={spec} className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed" /> {spec}
              </span>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
          <Button to="/analyze" variant="secondary" size="lg" className="w-full">
            Launch Live Analysis
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button to="/models" size="lg" className="w-full bg-primary-container hover:bg-primary-container/80">
            Read Technical Spec
          </Button>
        </div>
      </div>
    </div>
  );
}
