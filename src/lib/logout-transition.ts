export const LOGOUT_TRANSITION_EVENT = "alertavereda:logout-transition";

export type LogoutRole = "admin_vereda" | "superadmin";
export type LogoutTransitionPhase = "start" | "success" | "error";

export type LogoutTransitionDetail = {
  phase: LogoutTransitionPhase;
  role: LogoutRole;
  message?: string;
};

export function dispatchLogoutTransition(detail: LogoutTransitionDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<LogoutTransitionDetail>(LOGOUT_TRANSITION_EVENT, { detail }),
  );
}
