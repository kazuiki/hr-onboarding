import Link from 'next/link';
import {
  Shield,
  Users,
  ClipboardCheck,
  ArrowRight,
  Building2,
  FileText,
  Camera,
  Stethoscope,
  Lock,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-[#011f4b] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#005b96] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight">HR Onboarding</span>
                <span className="text-[#b3cde0] text-xs ml-2 hidden sm:inline">Portal</span>
              </div>
            </div>
            <Link
              href="/login"
              className="bg-[#005b96] hover:bg-[#03396c] text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#011f4b] via-[#03396c] to-[#005b96] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#b3cde0] rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-[#6497b1] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-medium text-[#b3cde0] mb-6">
              <Shield className="w-3.5 h-3.5" />
              Secure & Compliant Onboarding Platform
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Employee Onboarding
              <span className="block text-[#b3cde0] mt-1">Made Simple</span>
            </h1>
            <p className="mt-6 text-lg text-[#b3cde0]/90 leading-relaxed max-w-xl">
              A streamlined, secure workspace for new employees to complete
              requirements, submit documents, and prepare for their first day — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="bg-white text-[#011f4b] font-semibold px-8 py-3.5 rounded-xl hover:bg-[#b3cde0] transition-all duration-200 text-sm flex items-center gap-2 shadow-lg shadow-black/10"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login?role=hr"
                className="border border-white/30 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all duration-200 text-sm"
              >
                HR Admin Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-[#011f4b]">
              Complete onboarding in one guided portal
            </h2>
            <p className="mt-3 text-[#6497b1] max-w-2xl mx-auto">
              Every form, document, and requirement your new hires need — organized, tracked, and reviewed securely.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: 'Employment Forms',
                desc: 'Complete and submit tax forms, payroll enrollment, and personal data sheets digitally.',
              },
              {
                icon: Camera,
                title: 'ID Photo Upload',
                desc: 'Upload formal company identification photos with guided requirements and validation.',
              },
              {
                icon: ClipboardCheck,
                title: 'Document Requirements',
                desc: 'Submit government IDs, clearances, professional licenses, and certifications securely.',
              },
              {
                icon: Stethoscope,
                title: 'Medical Clearance',
                desc: 'Access clinic referral instructions, schedules, and upload fit-to-work clearance documents.',
              },
              {
                icon: Lock,
                title: 'Data Privacy',
                desc: 'Review and acknowledge corporate privacy policies with timestamped consent records.',
              },
              {
                icon: Users,
                title: 'HR Dashboard',
                desc: 'Manage templates, review submissions, track compliance, and access immutable audit logs.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-6 hover:border-[#b3cde0] hover:shadow-md transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-[#eaf2f8] flex items-center justify-center mb-4 group-hover:bg-[#b3cde0]/30 transition-colors">
                  <feature.icon className="w-5 h-5 text-[#005b96]" />
                </div>
                <h3 className="font-semibold text-[#011f4b] text-base">{feature.title}</h3>
                <p className="mt-2 text-sm text-[#6497b1] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#011f4b] text-[#b3cde0] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">HR Onboarding Portal</span>
          </div>
          <p className="text-xs text-[#6497b1]">
            © {new Date().getFullYear()} Configurable Company Name. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
