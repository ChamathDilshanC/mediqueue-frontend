"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useLanguage } from "./providers";

export function Error403() {
  const router = useRouter();
  const { language } = useLanguage();
  const si = language === "si";

  return (
    <div className="min-h-screen bg-white dark:bg-[#121619] text-[#17191C] dark:text-gray-100 flex flex-col justify-between transition-colors">
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-24 w-full flex-1 flex items-center justify-center">
        <div className="w-full text-center space-y-6">
          {/* Ultra-thin single stroke line icon */}
          <div className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500 flex items-center justify-center">
            <svg
              className="w-16 h-16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase text-slate-400 dark:text-slate-500 tracking-widest">
              Error 403
            </div>
            <h1 className="text-xl font-light text-slate-900 dark:text-gray-100 tracking-tight">
              {si ? "ප්‍රවේශය සීමා කර ඇත" : "Access restricted"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light max-w-xs mx-auto leading-relaxed">
              {si
                ? "මෙම පිටුවට පිවිසීම සඳහා අවශ්‍ය අවසර ඔබගේ ගිණුමට නොමැත."
                : "This document requires credentials not present on this session key."}
            </p>
          </div>

          <div className="pt-4 flex items-center justify-center gap-4 text-xs font-mono">
            <button
              onClick={() => router.push("/account")}
              className="px-4 py-2 border border-slate-900 dark:border-gray-100 text-slate-900 dark:text-gray-100 hover:bg-slate-900 dark:hover:bg-gray-100 hover:text-white dark:hover:text-[#121619] transition-colors"
            >
              {si ? "ගිණුමට යන්න" : "Request Clearance"}
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-gray-100 transition-colors"
            >
              {si ? "ආපසු" : "Return"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
