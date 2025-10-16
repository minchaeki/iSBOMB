"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import ChatbotModal from "@/components/ChatbotModal"; // ✅ 추가
import { Section } from "../../components/ui";

type Document = {
  id: string;
  regulator: string;
  status: string;
  content: string;
};

export default function DocumentsPage() {
  const [openDoc, setOpenDoc] = useState<Document | null>(null);
  const [showChatbot, setShowChatbot] = useState(false); // ✅ 챗봇 모달 상태

  const [docs] = useState<Document[]>([
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

  function handleExportPDF(doc: Document) {
    const pdf = new jsPDF();
    const lines = pdf.splitTextToSize(doc.content, 180);
    pdf.text(lines, 10, 10);
    pdf.save(`${doc.id}.pdf`);
  }

  return (
    <Section title="AI 문서 생성" desc="가이드라인 템플릿 기반 자동 작성/편집">
      <div className="mb-3 flex gap-2">
        <button
          className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800 transition"
          onClick={() => setShowChatbot(true)} // ✅ 챗봇 열기
        >
          Generate Draft
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
                    className="rounded-lg border px-2 py-1 hover:bg-gray-50"
                  >
                    Export
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 문서 보기 모달 */}
      {openDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">{openDoc.id}</h2>
              <button
                onClick={() => setOpenDoc(null)}
                className="text-gray-600 hover:text-black"
              >
                ✕
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-800">
              {openDoc.content}
            </pre>
          </div>
        </div>
      )}

      {/* 챗봇 모달 */}
      {showChatbot && <ChatbotModal onClose={() => setShowChatbot(false)} />}
    </Section>
  );
}
