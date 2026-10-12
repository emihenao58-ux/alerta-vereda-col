import { forwardRef } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

export const SignalNoCoverageIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, strokeWidth = 1.9, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path className="signal-bar signal-bar-1" d="M4 20v-2" />
      <path className="signal-bar signal-bar-2" d="M9 20v-5" />
      <path className="signal-bar signal-bar-3" d="M14 20v-8" />
      <path className="signal-bar signal-bar-4" d="M19 20V8" />
      <path className="signal-slash" d="m3 3 18 18" />
    </svg>
  ),
);
SignalNoCoverageIcon.displayName = "SignalNoCoverageIcon";

export const SignalWeakIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, strokeWidth = 1.9, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path className="signal-bar signal-bar-1 signal-weak-active" d="M4 20v-2" />
      <path className="signal-bar signal-bar-2 signal-weak-active" d="M9 20v-5" />
      <path className="signal-bar signal-bar-3 signal-weak-muted" d="M14 20v-8" />
      <path className="signal-bar signal-bar-4 signal-weak-muted" d="M19 20V8" />
    </svg>
  ),
);
SignalWeakIcon.displayName = "SignalWeakIcon";
