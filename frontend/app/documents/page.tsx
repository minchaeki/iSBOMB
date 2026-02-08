// app/documents/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ChatbotModal from "@/components/ChatbotModal";
import { Section } from "../../components/ui";

type Sections = {
  scope?: string;
  examples?: string;
  risk?: string;
  applicationDocs?: string;
  performance?: string;
};

type DocumentRow = {
  id: string;
  regulator: string;
  status: string;
  content: string;
  metadata?: any;                   // ⬅︎ 추가
  sections?: Record<string, string>; // ⬅︎ 추가
};

function extractMetaFromContent(text: string) {
  const safe = typeof text === "string" ? text : "";
  const get = (re: RegExp) => text.match(re)?.[1]?.trim();
  return {
    modelName: get(/모델명:\s*([^\n]+)/),
    modelVersion: get(/버전:\s*([^\n]+)/),
    developer: get(/개발사:\s*([^\n]+)/) || get(/Developer:\s*([^\n]+)/),
  };
}

export default function DocumentsPage() {
  const [openDoc, setOpenDoc] = useState<DocumentRow | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);

  // 섹션 없는 더미 예시(Export 제한)
  const [docs, setDocs] = useState<DocumentRow[]>([
    {
      id: "MFDS-2025-08-01-001",
      regulator: "MFDS",
      status: "Draft",
      content:
        "이 문서는 MFDS(식약처) 인허가 초안 문서입니다.\n\n- 모델명: LungVision v1.4.0\n- 버전: 1.0\n- 작성일: 2025-08-01\n\n본 문서는 iSBOMB 플랫폼을 통해 자동 생성되었습니다.",
    },
    {
      id: "FDA-510k-2025-07-20-003",
      regulator: "FDA",
      status: "Ready to review",
      content:
        "이 문서는 FDA 510(k) 인허가 문서 초안입니다.\n\n- 모델명: SmartScan 2.0\n- 제출일: 2025-07-20\n\n본 문서는 LLM 기반 자동화 문서 생성 기능을 통해 작성되었습니다.",
    },
  ]);

  // ✅ ChatbotModal이 저장한 draftDocument를 그대로 병합(섹션 유지)
  const draftFromStorage = useMemo<DocumentRow | null>(() => {
    try {
      const raw = localStorage.getItem("draftDocument");
      if (!raw) return null;
      const json = JSON.parse(raw);

      const title =
        json?.metadata?.title ||
        `생성형 AI 의료기기 인허가 문서 초안 (${json?.metadata?.modelName ?? "Model"})`;

      const id =
        json?.metadata?.documentId ||
        `AIBOM-${json?.metadata?.modelName ?? "MODEL"}-${new Date()
          .toISOString()
          .slice(0, 10)}`;

      // 보기용 텍스트(미리보기)
      const body =
        json?.sections && typeof json.sections === "object"
          ? Object.entries(json.sections)
              .map(([k, v]) => `■ ${k}\n${String(v ?? "")}`)
              .join("\n\n")
          : (json?.content as string) ?? "문서 본문을 불러올 수 없습니다.";

      const content = `${title}\n\n${body}`;
      const regulator = json?.metadata?.regulator ?? "MFDS";
      const status = json?.metadata?.status ?? "Draft";

      // ⬇︎ 목록 행에 sections/metadata를 같이 보관
      return {
        id,
        regulator,
        status,
        content,
        metadata: json?.metadata ?? {},
        sections: json?.sections ?? undefined,
      };
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!draftFromStorage) return;
    setDocs((prev) => {
      if (prev.some((d) => d.id === draftFromStorage.id)) return prev;
      return [draftFromStorage, ...prev];
    });
  }, [draftFromStorage]);

  // ✅ Export: 섹션 문서만 PDF 생성 (없으면 안내)
  async function handleExportPDF(doc: DocumentRow) {
    try {
      const raw = localStorage.getItem("draftDocument");
      const parsed = raw ? JSON.parse(raw) : null;

      const payload =
        parsed?.sections
          ? { metadata: parsed.metadata, sections: parsed.sections } // ✅ sections 우선
          : (() => {
              alert("이 문서는 섹션 데이터가 없습니다. Generate Draft로 다시 생성해 주세요.");
              throw new Error("no sections");
            })();

      const res = await fetch("/api/documents/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${payload.metadata?.title || "mfds_document"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("PDF 생성 중 오류: " + (e?.message || e));
    }
  }

  // 미리보기 텍스트(섹션 → 보기 좋게)
  function previewText(doc: DocumentRow) {
    if (doc.sections) {
      const { scope, examples, risk, applicationDocs, performance } = doc.sections;
      return [
        "◆ 적용범위\n" + (scope || "-"),
        "\n◆ 해당 의료기기 예시\n" + (examples || "-"),
        "\n◆ 위험관리\n" + (risk || "-"),
        "\n◆ 신청자료\n" + (applicationDocs || "-"),
        "\n◆ 제출자료\n" + (performance || "-"),
      ].join("\n");
    }
    return doc.content ?? "(본문 없음)";
  }

  return (
    <Section title="AI 문서 생성" desc="가이드라인 템플릿 기반 자동 작성/편집">
      <div className="mb-3 flex gap-2">
        <button
          className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 transition"
          onClick={() => setShowChatbot(true)}
        >
          Generate Draft
        </button>
        <button
          className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 transition"
          onClick={() => {
            // 최신 draftDocument 반영
            location.reload();
          }}
        >
          Reload Drafts
        </button>
      </div>

      <table className="min-w-full border text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-3 py-2 border-b">Document ID</th>
            <th className="px-3 py-2 border-b">Regulator</th>
            <th className="px-3 py-2 border-b">Status</th>
            <th className="px-3 py-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => (
            <tr key={doc.id} className="border-b hover:bg-gray-50">
              <td className="px-3 py-2">{doc.id}</td>
              <td className="px-3 py-2">{doc.regulator}</td>
              <td className="px-3 py-2">{doc.status}</td>
              <td className="px-3 py-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setOpenDoc(doc)}
                    className="rounded-lg border px-2 py-1 hover:bg-gray-50"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleExportPDF(doc)}
                    className="rounded-lg border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                    disabled={!doc.sections}
                    title={
                      doc.sections ? "MFDS 표로 내보내기" : "섹션 없음(Generate Draft 필요)"
                    }
                  >
                    Export (MFDS Table)
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {docs.length === 0 && (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                문서가 없습니다. 상단의 <b>Generate Draft</b> 버튼으로 생성해 보세요.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {openDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full">
            <button
              onClick={() => setOpenDoc(null)}
              className="absolute right-4 top-4 text-gray-600 hover:text-black"
              aria-label="close"
            >
              ✕
            </button>
            <h2 className="text-lg font-semibold mb-3">{openDoc.id}</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-800 max-h-[70vh] overflow-auto">
              {previewText(openDoc)}
            </pre>
          </div>
        </div>
      )}

      {showChatbot && <ChatbotModal onClose={() => setShowChatbot(false)} />}
    </Section>
  );
}