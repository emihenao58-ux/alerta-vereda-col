import { useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

type ModuleSectionHeadingProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  onBack?: () => void;
};

export function ModuleSectionHeading({
  title,
  eyebrow,
  description,
  onBack,
}: ModuleSectionHeadingProps) {
  const navigate = useNavigate();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (router.history.canGoBack()) {
      router.history.back();
      return;
    }

    void navigate({ to: "/" });
  };

  return (
    <header className="m4-section-heading">
      <button
        className="m4-section-heading-back"
        type="button"
        aria-label="Regresar a la sección anterior"
        title="Regresar"
        onClick={handleBack}
      >
        <ArrowLeft size={19} strokeWidth={2.2} aria-hidden="true" />
      </button>

      <div className="m4-section-heading-copy">
        {eyebrow && <p className="m4-section-heading-eyebrow">{eyebrow}</p>}
        <h1 id="m4-section-heading-title">{title}</h1>
        {description && <p className="m4-section-heading-description">{description}</p>}
      </div>

      <span className="m4-section-heading-spacer" aria-hidden="true" />
    </header>
  );
}
