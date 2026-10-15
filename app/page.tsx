import Link from "next/link";
import Image from "next/image";
import { User, UserCheck, ArrowRight } from "lucide-react";
import { apiUrl } from "@/lib/onboarding";

/** Onboarding system landing: branding + entry points (no auto-redirect). */
export default function Home() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8 px-4">
        <div className="inline-flex flex-col items-center gap-2">
          <Image
            src={apiUrl('/PKII-LOGO.png')}
            alt="Philkoei International, Inc."
            width={400}
            height={50}
            className="h-14 sm:h-16 w-auto object-contain shrink-0"
            priority
          />
          <div className="text-xs text-[#6497b1] font-medium tracking-wide">
            Employee Onboarding System
          </div>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-[#e2e8f0] shadow-lg shadow-[#011f4b]/5 text-center">
          <h1 className="text-xl font-bold text-[#011f4b]">Welcome to PKII Onboarding</h1>
          <p className="text-xs text-[#6497b1] mt-1 mb-6">
            New hires complete requirements here; HR reviews submissions and manages onboarding.
          </p>
          <div className="space-y-3">
            <Link
              href="/onboardingSys?tab=employee"
              className="w-full bg-[#005b96] hover:bg-[#03396c] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-[#005b96]/20"
            >
              <User className="w-4 h-4" />
              <span>Continue as New Employee</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/onboardingSys?tab=hr"
              className="w-full bg-white hover:bg-[#eaf2f8] text-[#011f4b] font-semibold py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 border border-[#b3cde0]"
            >
              <UserCheck className="w-4 h-4" />
              <span>HR Portal Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
