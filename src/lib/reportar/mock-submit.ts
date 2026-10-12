import type { ReporteDraft } from "@/lib/reportar/types";

export type MockSubmissionResult = {
  mode: "local-preview";
  publicId: null;
  submittedAt: string;
};

export async function confirmarReporteLocal(_draft: ReporteDraft): Promise<MockSubmissionResult> {
  await Promise.resolve();
  return {
    mode: "local-preview",
    publicId: null,
    submittedAt: new Date().toISOString(),
  };
}
