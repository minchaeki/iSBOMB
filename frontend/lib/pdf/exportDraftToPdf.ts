// frontend/lib/pdf/exportDraftToPdf.ts
// jsPDF가 이미 설치되어 있어야 합니다: yarn add jspdf
import jsPDF from "jspdf";

type DraftDoc = {
  metadata?: {
    title?: string;
    modelId?: number | string;
    modelName?: string;
    modelVersion?: string;
    developer?: string;
    aibomCid?: string;
    generatedAt?: string;
    recommendedFileName?: string;
  };
  document?: Record<string, any>;
};

function drawHeading(doc: jsPDF, text: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(text, 20, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
}

function multilineText(doc: jsPDF, text: string, y: number, lineHeight = 6) {
  const lines = doc.splitTextToSize(text, 170) as string[]; // ← string[] 타입 단언 추가
  (lines as string[]).forEach((line: string, i: number) => {
    doc.text(String(line), 20, y + i * lineHeight);
  });
  return y + lines.length * lineHeight;
}

export function exportDraftToPdf(draft: DraftDoc) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });

  let y = 20;

  // 제목
  const title =
    draft?.metadata?.title ??
    `생성형 AI 의료기기 인허가 문서 초안 (${draft?.metadata?.modelName || "Model"})`;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(title, 20, y);
  y += 10;

  // 메타데이터
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  const metaLines = [
    draft?.metadata?.modelName ? `모델명: ${draft.metadata.modelName}` : undefined,
    draft?.metadata?.modelVersion ? `버전: ${draft.metadata.modelVersion}` : undefined,
    draft?.metadata?.developer ? `개발사: ${draft.metadata.developer}` : undefined,
    draft?.metadata?.aibomCid ? `AIBOM CID: ${draft.metadata.aibomCid}` : undefined,
    draft?.metadata?.generatedAt ? `작성일: ${new Date(draft.metadata.generatedAt).toLocaleString()}` : undefined,
  ].filter(Boolean) as string[];

  metaLines.forEach((line) => {
    pdf.text(line, 20, y);
    y += 6;
  });

  y += 4;
  pdf.line(20, y, 190, y);
  y += 10;

  // 본문 섹션
  const sections = draft?.document || {};
  const order = Object.keys(sections); // 이미 LLM이 가이드라인 순서로 내려줬다고 가정
  for (const key of order) {
    const val = sections[key];
    drawHeading(pdf, `■ ${key}`, y);
    y += 8;

    const text =
      typeof val === "string"
        ? val
        : Array.isArray(val)
        ? val.map((v) => `- ${v}`).join("\n")
        : Object.entries(val || {})
            .map(([k, v]) => `- ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
            .join("\n");

    y = multilineText(pdf, text || "-", y);
    y += 10;

    // 페이지 넘김 처리
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }
  }

  const fileName =
    draft?.metadata?.recommendedFileName ??
    `AIBOM_Draft_${draft?.metadata?.modelName || "Model"}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;

  pdf.save(fileName);
}