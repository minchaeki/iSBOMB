"use client";

import { useState } from "react";
import RoleDashboardLayout from "@/components/RoleDashboardLayout";
import { Section } from "@/components/ui";
import {
  getReadOnlyContract,
  recordAdvisoryOnChain,
  reportVulnerabilityOnChain,
} from "@/lib/blockchain";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

type BroadcastLog = { ts: string; results?: any };

export default function SupervisorPage() {
  const sidebar = [
    { id: "vuln", label: "승인된 AI 문서 수신" },
    { id: "vulnerability", label: "취약점 분석 및 보고" },
    { id: "broadcast", label: "경고 전파 내역" },
  ];

  const [modelId, setModelId] = useState<string>("");
  const [aibomCid, setAibomCid] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<string>("");

  const [advisoryCid, setAdvisoryCid] = useState<string>("");
  const [advisoryScope, setAdvisoryScope] = useState<string>("");
  const [advisoryAction, setAdvisoryAction] = useState<string>("");

  const [vulnCid, setVulnCid] = useState<string>("");
  const [severity, setSeverity] = useState<string>("HIGH");

  const [broadcastLogs, setBroadcastLogs] = useState<BroadcastLog[]>([]);
  const [advisoriesList, setAdvisoriesList] = useState<any[]>([]);
  const [vulnerabilitiesList, setVulnerabilitiesList] = useState<any[]>([]);

  // ✅ 규제기관이 승인한 모델의 AIBOM 문서 조회
  async function handleLoadApprovedAIBOM() {
    if (!modelId) return alert("모델 ID를 입력하세요.");
    try {
      setStatusMsg("🔍 승인된 AIBOM 문서 조회 중...");
      const contract = getReadOnlyContract();
      const aibom = await contract.aiboms(Number(modelId));
      setAibomCid(aibom.cid);
      setStatusMsg(`✅ AIBOM 문서 조회 완료 (CID: ${aibom.cid})`);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.data?.message || err?.error?.message || err?.message || String(err);
      if (msg.includes("not approved")) {
        setStatusMsg("⚠️ 해당 모델은 아직 승인되지 않았습니다.");
      } else {
        setStatusMsg(`⚠️ 조회 실패: ${msg}`);
      }
    }
  }

  // ✅ 권고 온체인 등록
  async function handleSaveAdvisory() {
    if (!modelId) return alert("모델 ID를 입력하세요.");
    if (!advisoryCid && !advisoryAction)
      return alert("권고 내용 또는 CID를 입력하세요.");
    try {
      setStatusMsg("⛓️ 온체인 권고 등록 중...");
      const tx = await recordAdvisoryOnChain(
        Number(modelId),
        advisoryCid || "N/A",
        advisoryScope || "N/A",
        advisoryAction || "N/A"
      );
      setStatusMsg(`✅ 권고 등록 완료 (tx: ${tx.hash ?? "n/a"})`);
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 권고 등록 실패 (owner 권한 확인 필요)");
    }
  }

  // ✅ 취약점 온체인 보고
  async function handleReportVuln() {
    if (!modelId) return alert("모델 ID를 입력하세요.");
    if (!vulnCid) return alert("취약점 CID를 입력하세요.");
    try {
      setStatusMsg("⛓️ 취약점 보고 중...");
      const tx = await reportVulnerabilityOnChain(Number(modelId), vulnCid, severity);
      setStatusMsg(`✅ 취약점 보고 완료 (tx: ${tx.hash ?? "n/a"})`);
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ 취약점 보고 실패 (owner 권한인지 확인하세요)");
    }
  }

  // ✅ 온체인 권고/취약점 조회
  async function handleLoadAdvisoriesAndVulns() {
    if (!modelId) return alert("모델 ID를 입력하세요.");
    try {
      const provider = new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545"
      );
      const c = new ethers.Contract(
        CONTRACT_ADDRESS,
        (await import("@/data/AIBOMRegistry.json")).default.abi,
        provider
      );

      const advs = await c.getAdvisories(Number(modelId));
      const vulns = await c.getVulnerabilities(Number(modelId));

      const parsedAdvs = advs.map((a: any) => ({
        cid: a.cid,
        scope: a.scope,
        action: a.action,
        reporter: a.reporter,
      }));

      const parsedVulns = vulns.map((v: any) => ({
        cid: v.cid,
        severity: v.severity,
        active: Boolean(v.active),
        timestamp: Number(v.timestamp),
      }));

      setAdvisoriesList(parsedAdvs);
      setVulnerabilitiesList(parsedVulns);
      setStatusMsg("✅ 조회 완료");
    } catch (err) {
      console.error(err);
      setStatusMsg("⚠️ 조회 실패");
    }
  }

  // ✅ 모의 Broadcast
  async function handleBroadcast() {
    if (!advisoryCid) return alert("먼저 권고를 등록하세요.");
    const log: BroadcastLog = {
      ts: new Date().toLocaleString(),
      results: {
        advisoryCid,
        recipients: ["Developer"],
        status: "Sent (mock)",
      },
    };
    setBroadcastLogs((p) => [log, ...p]);
    setStatusMsg("📡 전파(모의) 완료");
  }

  return (
    <RoleDashboardLayout roleTitle="Supervisor" sidebar={sidebar}>
      {/* 1️⃣ 승인된 AIBOM 문서 수신 */}
      <Section
        id="vuln"
        title="승인된 AI 문서 수신"
        desc="규제기관이 승인한 모델의 AIBOM(CID)을 조회합니다."
      >
        <div className="rounded-2xl border p-6 shadow-sm bg-white mb-8">
          <div className="flex flex-wrap gap-3 mb-3">
            <input
              className="rounded-xl border px-3 py-2 focus:ring-2 focus:ring-gray-300"
              placeholder="Model ID"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
            />
            <button
              className="rounded-xl bg-black text-white px-4 py-2 font-medium hover:bg-gray-800 transition"
              onClick={handleLoadApprovedAIBOM}
            >
              AIBOM 조회
            </button>
          </div>

          <div className="text-sm text-gray-700 mb-2">{statusMsg}</div>

          {aibomCid ? (
            <div className="border-t py-3 text-sm">
              <div className="font-mono text-xs break-all">{aibomCid}</div>
              <a
                className="text-blue-600 hover:underline"
                href={`https://ipfs.io/ipfs/${aibomCid}`}
                target="_blank"
                rel="noreferrer"
              >
                Open AIBOM on IPFS
              </a>
            </div>
          ) : (
            <div className="text-sm text-gray-500">AIBOM 문서가 없습니다.</div>
          )}
        </div>
      </Section>

      {/* 2️⃣ 취약점 분석 및 권고 */}
      <Section
        id="vulnerability"
        title="취약점 분석 및 보고"
        desc="AIBOM 문서 분석 후 취약점 및 권고를 온체인에 등록합니다."
      >
        <div className="rounded-2xl border p-6 shadow-sm bg-white mb-8">
          {/* 취약점 보고 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              className="rounded-xl border px-3 py-2 focus:ring-2 focus:ring-gray-300"
              placeholder="모델 ID"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
            />
            <input
              className="rounded-xl border px-3 py-2 focus:ring-2 focus:ring-gray-300"
              placeholder="취약점 CID 또는 설명"
              value={vulnCid}
              onChange={(e) => setVulnCid(e.target.value)}
            />
            <select
              className="rounded-xl border px-3 py-2 focus:ring-2 focus:ring-gray-300"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              className="rounded-xl bg-black text-white px-4 py-2 font-medium hover:bg-gray-800 transition"
              onClick={handleReportVuln}
            >
              온체인 취약점 보고
            </button>
          </div>

          {/* 권고 작성 */}
          <div>
            <div className="text-base font-semibold mb-3">보안 권고 (Supervisor)</div>
            <input
              className="rounded-xl border px-3 py-2 w-full mb-2 focus:ring-2 focus:ring-gray-300"
              placeholder="권고 문서 CID 또는 요약"
              value={advisoryCid}
              onChange={(e) => setAdvisoryCid(e.target.value)}
            />
            <input
              className="rounded-xl border px-3 py-2 w-full mb-2 focus:ring-2 focus:ring-gray-300"
              placeholder="Scope (예: v1.3.x)"
              value={advisoryScope}
              onChange={(e) => setAdvisoryScope(e.target.value)}
            />
            <input
              className="rounded-xl border px-3 py-2 w-full mb-3 focus:ring-2 focus:ring-gray-300"
              placeholder="Action (예: 패치 권고)"
              value={advisoryAction}
              onChange={(e) => setAdvisoryAction(e.target.value)}
            />

            <div className="flex flex-wrap gap-3 mb-4">
              <button
                className="rounded-xl bg-black text-white px-4 py-2 font-medium hover:bg-gray-800 transition"
                onClick={handleSaveAdvisory}
              >
                Save Advisory (On-chain)
              </button>
              <button
                className="rounded-xl border px-4 py-2 font-medium hover:bg-gray-50"
                onClick={handleBroadcast}
              >
                Broadcast Advisory (mock)
              </button>
            </div>

            {/* 권고 목록 */}
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">온체인에 기록된 권고</div>
              {advisoriesList.length === 0 && (
                <div className="text-sm text-gray-500">권고 없음</div>
              )}
              {advisoriesList.map((a: any, i: number) => (
                <div key={i} className="py-1 border-t text-xs">
                  CID: {a.cid ?? "-"} — scope: {a.scope ?? "-"} — action:{" "}
                  {a.action ?? "-"} — by: {a.reporter ?? "-"}
                </div>
              ))}
            </div>

            {/* 취약점 목록 */}
            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">온체인에 기록된 취약점</div>
              {vulnerabilitiesList.length === 0 && (
                <div className="text-sm text-gray-500">기록 없음</div>
              )}
              {vulnerabilitiesList.map((v: any, i: number) => (
                <div key={i} className="py-1 border-t text-xs">
                  CID: {v.cid ?? "-"} — severity: {v.severity ?? "-"} — active:{" "}
                  {String(v.active)} — at:{" "}
                  {new Date(Number(v.timestamp) * 1000).toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 3️⃣ Broadcast 로그 */}
      <Section
        id="broadcast"
        title="경고 전파 내역"
        desc="Supervisor가 권고를 전파한 결과 로그 (모의)"
      >
        <div className="rounded-2xl border p-6 shadow-sm bg-white">
          {broadcastLogs.length === 0 && (
            <div className="text-sm text-gray-500">전파 로그 없음</div>
          )}
          {broadcastLogs.map((b, i) => (
            <div key={i} className="py-2 border-t">
              <div className="text-xs text-gray-500">{b.ts}</div>
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(b.results, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </Section>
    </RoleDashboardLayout>
  );
}
