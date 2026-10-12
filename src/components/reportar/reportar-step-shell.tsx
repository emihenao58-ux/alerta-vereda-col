import type { ReactNode } from "react";

export function ReportarStepShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="reportar-step carta" aria-labelledby="reportar-step-title">
      <p className="reportar-step-eyebrow">{eyebrow}</p>
      <h2 id="reportar-step-title" className="reportar-step-title">
        {title}
      </h2>
      <p className="reportar-step-description">{description}</p>
      <div className="reportar-step-content">{children}</div>
    </section>
  );
}

export function ReportarStepActions({ children }: { children: ReactNode }) {
  return <div className="reportar-step-actions">{children}</div>;
}
