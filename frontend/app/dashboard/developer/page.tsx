"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import RoleGate from "@/components/RoleGate";
import RoleDashboardLayout from "@/components/RoleDashboardLayout";
import { Section } from "@/components/ui";
import { uploadToPinata } from "@/lib/ipfs";
import { getContractWithWallet, getReadOnlyContract } from "@/lib/blockchain";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";

type AibomStatus = "Draft" | "Submitted" | "In Review" | "Approved" | "Rejected" | "Unknown";

type Model = {
  modelId: number;
  version: string;
  released: string;
  cid: string;
  aibom: AibomStatus;
  reason?: string;
};

type AdvisoryView = {
  cid: string;
  scope: string;
  action: string;
  timestamp: number;
  reporter: string;
};

export default function DeveloperPage() {
  const router = useRouter();

  const sidebar = [
    { id: "aibom", label: "AIBOM 등록" },
    { id: "docs", label: "인허가 문서 생성" },
    { id: "review", label: "심사 요청/상태" },
  ];

  const [file, setFile] = useState<File | null>(null);
  const [cid, setCid] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<number | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [advisories, setAdvisories] = useState<Record<number, AdvisoryView[]>>({});

  // Load models from chain
  async function loadModels() {
    try {
      const contract = getReadOnlyContract();
      const all: any[] = await contract.getAllAIBOMs();
      const parsed: Model[] = all.map((a: any, idx: number) => ({
        modelId: idx,
        version: `v1.${idx + 1}.0`,
        released: new Date(
          a.timestamp.toNumber ? a.timestamp.toNumber() * 1000 : Number(a.timestamp) * 1000
        )
          .toISOString()
          .split("T")[0],
        cid: a.cid,
        aibom:
          a.status === 0
            ? "Draft"
            : a.status === 1
            ? "Submitted"
            : a.status === 2
            ? "In Review"
            : a.status === 3
            ? "Approved"
            : a.status === 4
            ? "Rejected"
            : "Unknown",
        reason: a.reviewReason ?? "",
      }));
      setModels(parsed.reverse());
    } catch (err) {
      console.error("loadModels error", err);
    }
  }

  useEffect(() => {
    loadModels();
    const id = setInterval(loadModels, 10000);
    return () => clearInterval(id);
  }, []);

  // IPFS upload
  async function handleUpload() {
    if (!file) return alert("파일을 선택하세요!");
    try {
      setStatusMsg("📤 IPFS 업로드 중...");
      const uploadedCid = await uploadToPinata(file);
      setCid(uploadedCid);
      setStatusMsg(`✅ IPFS 업로드 완료 (CID: ${uploadedCid})`);
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ IPFS 업로드 실패");
    }
  }

  // Register on chain
  async function handleRegister() {
    if (!cid) return alert("CID가 없습니다.");
    try {
      setStatusMsg("⛓️ 온체인 등록 중...");
      const contract = await getContractWithWallet();
      const tx = await contract.registerAIBOM(cid);
      await tx.wait();
      setStatusMsg("✅ 온체인 등록 완료!");
      await loadModels();
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 온체인 등록 실패");
    }
  }

  // Submit selected PDF to regulator
  async function handleSendPDFToRegulator() {
    if (!pdfFile) return alert("PDF 파일을 선택하세요!");
    if (selectedModel === null) return alert("제출할 모델을 선택하세요!");
    try {
      setStatusMsg("📤 PDF IPFS 업로드 중...");
      const docCid = await uploadToPinata(pdfFile);
      setStatusMsg("⛓️ 온체인 제출 중...");
      const contract = await getContractWithWallet();
      const tx = await contract.submitReview(selectedModel, docCid);
      await tx.wait();
      setStatusMsg(`✅ 규제기관에 제출 완료 (modelId=${selectedModel}, CID=${docCid})`);
      await loadModels();
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 규제기관 제출 실패");
    }
  }

  // Load advisories
  async function loadAdvisoriesForModel(modelId: number) {
    try {
      const contract = getReadOnlyContract();
      const raw: any[] = await contract.getAdvisories(modelId);
      const parsed: AdvisoryView[] = raw.map((r: any) => ({
        cid: r.cid,
        scope: r.scope,
        action: r.action,
        timestamp: r.timestamp.toNumber ? r.timestamp.toNumber() : Number(r.timestamp),
        reporter: r.reporter,
      }));
      setAdvisories((prev) => ({ ...prev, [modelId]: parsed }));
    } catch (err) {
      console.error("loadAdvisories error", err);
    }
  }

  return (
    <RoleGate allow={["developer"]}>
      <RoleDashboardLayout roleTitle="Developer" sidebar={sidebar}>
        {/* AIBOM 등록 */}
        <Section
          id="aibom"
          title="AI 모델 및 AIBOM 등록"
          desc="IPFS 업로드 → CID 온체인 기록"
        >
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mb-3"
          />
          <div className="space-x-2">
            <button
              onClick={handleUpload}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Upload to IPFS
            </button>
            <button
              onClick={handleRegister}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Register (on-chain)
            </button>
          </div>
          <div className="mt-3 text-sm text-gray-700">{statusMsg}</div>
        </Section>

        {/* 문서 생성 / 제출 */}
        <Section
          id="docs"
          title="인허가 문서 생성"
          desc="LLM 기반 초안 생성 · PDF 제출 · 규제기관 전송"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* left: Generate */}
            <div className="rounded-2xl border p-6 shadow-md bg-white">
              <div className="text-base font-semibold mb-4">New draft</div>
              <p className="text-sm text-gray-600 mb-4">
                AIBOM을 기반으로 인허가 문서 초안을 자동 생성합니다.
              </p>
              <button
                onClick={() => router.push("/documents")}
                className="w-full rounded-xl bg-black text-white py-3 text-base font-medium hover:bg-gray-800 transition"
              >
                Generate from AIBOM
              </button>
            </div>

            {/* right: Send to Regulator */}
            <div className="rounded-2xl border p-6 shadow-md bg-white">
              <div className="text-base font-semibold mb-4">Send to Regulator</div>
              <p className="text-sm text-gray-600 mb-4">
                완성된 인허가 문서를 규제기관으로 제출합니다.
              </p>

              <select
                className="w-full rounded-lg border px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={selectedModel ?? ""}
                onChange={(e) =>
                  setSelectedModel(e.target.value === "" ? null : Number(e.target.value))
                }
              >
                <option value="">Select Model</option>
                {models.map((m) => (
                  <option key={m.modelId} value={m.modelId}>
                    {m.modelId} — {m.version} ({m.aibom})
                  </option>
                ))}
              </select>

              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                className="mb-4 w-full text-sm"
              />

              <button
                onClick={handleSendPDFToRegulator}
                className="w-full rounded-xl border border-gray-300 py-3 text-base font-medium bg-white text-black hover:bg-gray-50 transition"
              >
                Send PDF to Regulator
              </button>
            </div>
          </div>
        </Section>

        {/* 심사 요청/상태 */}
        <Section
          id="review"
          title="심사 요청/상태"
          desc="온체인 심사 상태 자동 동기화 (10초 주기)"
        >
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-600">
              DRAFT → SUBMITTED → IN_REVIEW → APPROVED/REJECTED
            </div>
            <button
              onClick={loadModels}
              className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Model ID</th>
                  <th className="py-2 pr-4">CID</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Reason</th>
                  <th className="py-2 pr-4">Updated</th>
                  <th className="py-2 pr-4">Advisories</th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.modelId} className="border-t">
                    <td className="py-2 pr-4">{m.modelId}</td>
                    <td className="py-2 pr-4 font-mono text-xs break-all">{m.cid}</td>
                    <td className="py-2 pr-4 font-medium">{m.aibom}</td>
                    <td className="py-2 pr-4 text-gray-600">
                      {m.reason && m.reason.length > 0 ? m.reason : "—"}
                    </td>
                    <td className="py-2 pr-4">{m.released}</td>
                    <td className="py-2 pr-4">
                      <button
                        className="rounded-lg border px-3 py-1 text-xs"
                        onClick={() => loadAdvisoriesForModel(m.modelId)}
                      >
                        Load Advisories
                      </button>
                      <div className="text-xs mt-1">
                        {advisories[m.modelId] && advisories[m.modelId].length > 0 ? (
                          advisories[m.modelId].map((a, i) => (
                            <div key={i} className="text-gray-700">
                              <div className="font-mono text-xs">{a.cid}</div>
                              <div className="text-xs">
                                Scope:{a.scope} Action:{a.action}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 text-xs">No advisories</div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </RoleDashboardLayout>
    </RoleGate>
  );
}
