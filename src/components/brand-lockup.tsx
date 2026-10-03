import { Link } from "@tanstack/react-router";

export function BrandLockup({ to = "/" }: { to?: "/" | "/mi-vereda" }) {
  return (
    <Link to={to} className="brand-lockup" aria-label="AlertaVereda">
      <span className="brand-mark" aria-hidden="true">
        <img src="/images/branding/alertavereda-icono.png" alt="" width="36" height="36" />
      </span>
      <span className="brand-wordmark">AlertaVereda</span>
    </Link>
  );
}
