import HeroSection from '../components/home/HeroSection.jsx';
import DualIntelligenceSection from '../components/home/DualIntelligenceSection.jsx';
import WorkflowSection from '../components/home/WorkflowSection.jsx';
import ComparisonSection from '../components/home/ComparisonSection.jsx';
import MetricsPreviewSection from '../components/home/MetricsPreviewSection.jsx';
import SupportedClassesSection from '../components/home/SupportedClassesSection.jsx';
import CapstoneCtaSection from '../components/home/CapstoneCtaSection.jsx';
import Section from '../components/layout/Section.jsx';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      <HeroSection />
      <Section tint>
        <DualIntelligenceSection />
      </Section>
      <Section>
        <WorkflowSection />
      </Section>
      <Section tint>
        <ComparisonSection />
      </Section>
      <Section>
        <MetricsPreviewSection />
      </Section>
      <Section tint>
        <SupportedClassesSection />
      </Section>
      <Section>
        <CapstoneCtaSection />
      </Section>
    </div>
  );
}
