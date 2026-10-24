"use client";

import type { ReactNode } from "react";
import { Copyright } from "@/components/ui/Copyright";

interface AuthSplitProps {
  headline: string;
  features: { icon: string; title: string; text: string }[];
  quote: string;
  children: ReactNode;
}

export function AuthSplit({
  headline,
  features,
  quote,
  children,
}: AuthSplitProps) {
  return (
    <div className="auth-page">
      {/* Panel del formulario */}
      <div className="auth-panel">
        <div className="auth-panel-content">
          <div className="auth-logo-mobile">
            <span className="text-2xl" aria-hidden="true">
              🤖
            </span>
            <span className="text-xl font-bold text-slate-900">TurisBot</span>
          </div>
          {children}
          <Copyright />
        </div>
      </div>

      {/* Panel de marca */}
      <aside className="auth-brand">
        <div className="auth-brand-header">
          <span className="text-3xl" aria-hidden="true">
            🤖
          </span>
          <span className="auth-brand-title">TurisBot</span>
        </div>

        <div className="space-y-10">
          <p className="auth-brand-headline">{headline}</p>
          <div className="space-y-5">
            {features.map((f) => (
              <div key={f.title} className="auth-brand-feature">
                <div className="auth-brand-feature-icon">
                  <span aria-hidden="true">{f.icon}</span>
                </div>
                <div>
                  <p className="auth-brand-feature-title">{f.title}</p>
                  <p className="auth-brand-feature-text">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="auth-brand-quote">{`"${quote}"`}</p>
          <p className="auth-brand-author">Equipo TurisBot</p>
        </div>
      </aside>
    </div>
  );
}

/** Loader overlay para redirecciones después de login/registro */
export function AuthLoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[100] bg-white/95 flex flex-col items-center justify-center gap-6">
      <div className="w-[4.5rem] h-[4.5rem] rounded-full border-[5px] border-[var(--primary-100)] border-t-[var(--primary-600)] animate-spin" />
      <p className="font-semibold text-slate-700">{message}</p>
    </div>
  );
}
