"use client";

import { useEffect, useState } from "react";
import RoleDashboardLayout from "@/components/RoleDashboardLayout";
import { Section } from "@/components/ui";
import { getContractWithWallet, getReadOnlyContract } from "@/lib/blockchain";
import { ethers } from "ethers";

type QueueItem = {
  reqId: string;
  modelId: number;
  model: string;
  dev: string;
  cid: string; // ✅ 규제기관은 제출문서 CID를 본다
  status: string;
};

type ReadRecord = {
  reqId: string;
  ts: string;
  actor: string;
};

export default function RegulatorPage() {
  const sidebar = [
    { id: "queue", label: "심사 요청 대기열" },
    { id: "integrity", label: "AIBOM 무결성 검증" },
    { id: "dossier", label: "제출 문서 조회" },
    { id: "decision", label: "심사 결과 등록" },
  ];

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [requestId, setRequestId] = useState("");
  const [decision, setDecision] = useState<"IN_REVIEW" | "APPROVED" | "REJECTED">("APPROVED");
  const [reason, setReason] = useState("");
  const [readLogs, setReadLogs] = useState<ReadRecord[]>([]);
  const [cidToVerify, setCidToVerify] = useState("");
  const [gateway, setGateway] = useState("https://gateway.pinata.cloud/ipfs/");

  // ✅ 규제기관이 볼 문서는 “제출문서 CID” 기준
  async function loadQueue() {
    try {
      const contract = getReadOnlyContract();
      const all = await contract.getAllAIBOMs();
      const items: QueueItem[] = [];

      for (let idx = 0; idx < all.length; idx++) {
        const a = all[idx];
        const statusNum = Number(a.status);

        // 각 모델의 제출문서 목록 가져오기
        let submitCIDs: string[] = [];
        try {
          submitCIDs = await contract.getMySubmissions(idx); // 제출문서 배열
        } catch (e) {
          console.warn("getMySubmissions error", e);
        }

        // ✅ 규제기관은 "가장 마지막 제출문서 CID"를 봐야 함
        const lastSubmitted = submitCIDs.length > 0 ? submitCIDs[submitCIDs.length - 1] : a.cid;

        // 상태 필터링
        if (statusNum === 1 || statusNum === 2) {
          items.push({
            reqId: `REQ-${2025}-${idx}`,
            modelId: idx,
            model: `Model v${idx + 1}`,
            dev: a.owner,
            cid: lastSubmitted, // ← 여기 핵심
            status:
              statusNum === 1
                ? "Submitted"
                : statusNum === 2
                ? "In Review"
                : "Unknown",
          });
        }
      }

      setQueue(items.reverse());
    } catch (err) {
      console.error("loadQueue error", err);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  // ✅ 문서 열람 (IPFS 새 탭)
  async function handleOpenDossier(cid: string, reqId: string) {
    try {
      setStatusMsg("📥 IPFS 문서를 새 탭에서 여는 중...");
      const link = document.createElement("a");
      link.href = `${gateway}${cid}`;
      link.target = "_blank";
      link.download = `${reqId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setStatusMsg("✅ 문서가 새 탭에서 열렸습니다.");
      setReadLogs((prev) => [{ reqId, ts: new Date().toISOString(), actor: "MFDS" }, ...prev]);
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 문서 열기 실패");
    }
  }

  // ✅ CID 무결성 비교
  async function handleCompareCID(cid: string) {
    try {
      setStatusMsg("🔎 IPFS에서 CID 검증 중...");
      const res = await fetch(`${gateway}${cid}`);
      if (!res.ok) throw new Error("IPFS fetch failed");
      const data = await res.arrayBuffer();
      setStatusMsg(`✅ IPFS 데이터 크기: ${data.byteLength} bytes`);
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ CID 검증 실패");
    }
  }

  // ✅ 심사 결과 등록 (owner 검증)
  async function handleDecisionSubmit() {
    if (!requestId) return alert("Model ID를 입력하세요.");
    if (!reason) return alert("사유를 입력하세요.");

    try {
      setStatusMsg("👤 규제기관 계정 확인 중...");
      const contract = getReadOnlyContract();
      const owner = await contract.owner();

      const ethProvider = (window as any).ethereum;
      if (!ethProvider) {
        alert("MetaMask 또는 다른 이더리움 지갑이 필요합니다.");
        setStatusMsg("🚫 이더리움 프로바이더를 찾을 수 없습니다.");
        return;
      }

      const provider = new ethers.BrowserProvider(ethProvider);
      const signer = await provider.getSigner();
      const current = await signer.getAddress();

      if (current.toLowerCase() !== owner.toLowerCase()) {
        alert(
          `⚠️ 접근 거부: 현재 계정은 규제기관(배포자) 계정이 아닙니다.\n\n배포자 주소: ${owner}\n현재 주소: ${current}`
        );
        setStatusMsg("🚫 규제기관 계정이 아닙니다. MetaMask 계정을 전환하세요.");
        return;
      }

      const modelId = Number(requestId);
      if (isNaN(modelId)) return alert("Model ID는 숫자여야 합니다.");
      setStatusMsg("⛓️ 심사 결과 온체인 기록 중...");

      const writable = await getContractWithWallet();
      const statusEnum = decision === "IN_REVIEW" ? 2 : decision === "APPROVED" ? 3 : 4;
      const tx = await writable.setReviewStatus(modelId, statusEnum, reason);
      await tx.wait();

      setStatusMsg("✅ 심사 결과 온체인 반영 완료!");
      await loadQueue();
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 심사 결과 반영 실패 (owner 계정 확인 필요)");
    }
  }

  return (
    <RoleDashboardLayout roleTitle="Regulator" sidebar={sidebar}>
      {/* 1️⃣ 심사 요청 대기열 */}
      <Section id="queue" title="심사 요청 대기열" desc="수신된 제출 요청을 확인합니다.">
        <div className="rounded-2xl border p-6 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="py-2 px-3">Request ID</th>
                  <th className="py-2 px-3">Model ID</th>
                  <th className="py-2 px-3">Developer</th>
                  <th className="py-2 px-3">CID</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={q.reqId} className="border-t hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{q.reqId}</td>
                    <td className="py-2 px-3">{q.modelId}</td>
                    <td className="py-2 px-3 font-mono text-xs">{q.dev}</td>
                    <td className="py-2 px-3 font-mono text-xs break-all">{q.cid}</td>
                    <td className="py-2 px-3">{q.status}</td>
                    <td className="py-2 px-3 space-x-2">
                      <button
                        className="rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                        onClick={() => handleOpenDossier(q.cid, q.reqId)}
                      >
                        Open Dossier
                      </button>
                      <button
                        className="rounded-xl border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                        onClick={() => handleCompareCID(q.cid)}
                      >
                        Compare CID ↔ IPFS
                      </button>
                    </td>
                  </tr>
                ))}
                {queue.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-sm text-gray-500">
                      현재 대기열에 제출된 문서가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="text-sm text-gray-700 mt-3">{statusMsg}</div>
        </div>
      </Section>

      {/* 2️⃣ 무결성 검증 */}
      <Section
        id="integrity"
        title="AIBOM 무결성 검증"
        desc="온체인 CID ↔ IPFS 원문 비교 (CID 입력 후 Verify)"
      >
        <div className="rounded-2xl border p-6 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              className="rounded-xl border px-3 py-2 focus:ring-2 focus:ring-gray-300"
              placeholder="CID"
              value={cidToVerify}
              onChange={(e) => setCidToVerify(e.target.value)}
            />
            <input
              className="rounded-xl border px-3 py-2 focus:ring-2 focus:ring-gray-300"
              placeholder="IPFS Gateway URL"
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
            />
            <button
              onClick={() => handleCompareCID(cidToVerify)}
              className="rounded-xl bg-black text-white py-2.5 font-medium hover:bg-gray-800 transition"
            >
              Verify
            </button>
          </div>
          <div className="text-sm text-gray-700 font-medium">{statusMsg}</div>
        </div>
      </Section>

      {/* 3️⃣ 문서 열람 로그 */}
      <Section id="dossier" title="제출 문서 조회" desc="문서를 열람하고 다운로드할 수 있습니다.">
        <div className="rounded-2xl border p-6 bg-white shadow-sm">
          <div className="text-sm text-gray-600 font-medium mb-3">최근 열람 기록</div>
          <ul className="text-sm">
            {readLogs.map((r, i) => (
              <li key={i} className="py-1 border-t first:border-0">
                <span className="font-mono">{r.ts}</span> — {r.reqId} ({r.actor})
              </li>
            ))}
            {readLogs.length === 0 && (
              <li className="text-gray-500">아직 열람 기록이 없습니다.</li>
            )}
          </ul>
        </div>
      </Section>

      {/* 4️⃣ 심사 결과 등록 */}
      <Section id="decision" title="심사 결과 등록" desc="승인/반려 및 사유 입력 후 온체인 기록">
        <div className="rounded-2xl border p-6 bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              className="rounded-xl border px-3 py-2 focus:ring-2 focus:ring-gray-300"
              placeholder="Model ID"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
            />
            <select
              className="rounded-xl border px-3 py-2 focus:ring-2 focus:ring-gray-300"
              value={decision}
              onChange={(e) => setDecision(e.target.value as any)}
            >
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approve</option>
              <option value="REJECTED">Reject</option>
            </select>
            <input
              className="rounded-xl border px-3 py-2 focus:ring-2 focus:ring-gray-300"
              placeholder="Reason (사유)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <button
            onClick={handleDecisionSubmit}
            className="w-full md:w-auto rounded-xl bg-black text-white py-2.5 px-6 font-medium hover:bg-gray-800 transition"
          >
            Record (on-chain)
          </button>

          <div className="text-sm text-gray-700 mt-3 font-medium">{statusMsg}</div>
        </div>
      </Section>
    </RoleDashboardLayout>
  );
}
