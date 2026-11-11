export const ADMIN_PHONE_CODE_EXPIRY_MS = 5 * 60 * 1000;
export const ADMIN_PHONE_RESEND_DELAY_MS = 30 * 1000;

export const ADMIN_PHONE_DIAL_CODES = [
  { country: "Colombia", code: "+57" },
  { country: "Argentina", code: "+54" },
  { country: "Bolivia", code: "+591" },
  { country: "Brasil", code: "+55" },
  { country: "Chile", code: "+56" },
  { country: "Costa Rica", code: "+506" },
  { country: "Cuba", code: "+53" },
  { country: "Ecuador", code: "+593" },
  { country: "El Salvador", code: "+503" },
  { country: "Estados Unidos / Canadá", code: "+1" },
  { country: "Guatemala", code: "+502" },
  { country: "Honduras", code: "+504" },
  { country: "México", code: "+52" },
  { country: "Nicaragua", code: "+505" },
  { country: "Panamá", code: "+507" },
  { country: "Paraguay", code: "+595" },
  { country: "Perú", code: "+51" },
  { country: "España", code: "+34" },
  { country: "Uruguay", code: "+598" },
  { country: "Venezuela", code: "+58" },
] as const;

export type AdminPhoneChallenge = {
  id: string;
  phone: string;
  expiresAt: number;
  resendAvailableAt: number;
};

export type AdminPhoneChallengeIssue = {
  challenge: AdminPhoneChallenge;
  developmentCode: string;
};

export type AdminPhoneVerificationResult =
  | { verified: true }
  | { verified: false; reason: "expired" | "number-changed" | "invalid-code" | "missing" };

/**
 * Contrato intercambiable para una futura verificación real del servidor.
 * Esta implementación es deliberadamente local, temporal y exclusiva de desarrollo.
 */
export interface AdminPhoneVerificationAdapter {
  request(phone: string, now?: number): AdminPhoneChallengeIssue;
  verify(
    challenge: AdminPhoneChallenge,
    phone: string,
    code: string,
    now?: number,
  ): AdminPhoneVerificationResult;
  clear(challengeId: string): void;
}

function generateSixDigitCode() {
  const values = new Uint32Array(1);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(values);
    return String((values[0] ?? 0) % 1_000_000).padStart(6, "0");
  }
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

function createChallengeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

const activeCodes = new Map<string, string>();

export const simulatedAdminPhoneVerification: AdminPhoneVerificationAdapter = {
  request(phone, now = Date.now()) {
    if (!import.meta.env.DEV) {
      throw new Error("La verificación simulada está deshabilitada fuera de desarrollo.");
    }
    const id = createChallengeId();
    const developmentCode = generateSixDigitCode();
    activeCodes.set(id, developmentCode);

    return {
      challenge: {
        id,
        phone,
        expiresAt: now + ADMIN_PHONE_CODE_EXPIRY_MS,
        resendAvailableAt: now + ADMIN_PHONE_RESEND_DELAY_MS,
      },
      developmentCode,
    };
  },

  verify(challenge, phone, code, now = Date.now()) {
    if (!import.meta.env.DEV) return { verified: false, reason: "missing" };
    if (!activeCodes.has(challenge.id)) return { verified: false, reason: "missing" };
    if (challenge.phone !== phone) return { verified: false, reason: "number-changed" };
    if (now >= challenge.expiresAt) return { verified: false, reason: "expired" };
    if (activeCodes.get(challenge.id) !== code) return { verified: false, reason: "invalid-code" };

    activeCodes.delete(challenge.id);
    return { verified: true };
  },

  clear(challengeId) {
    activeCodes.delete(challengeId);
  },
};
