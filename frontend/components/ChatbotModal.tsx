"use client";

import { useEffect, useRef, useState } from "react";
import type { Gap, GapAnswer } from "@/lib/llm/types";
import aibomDraft from "@/data/aibom_draft.json";

type Msg = { role: "user" | "assistant"; text: string };
const LS_KEY = "aibom_gap_answers";

export default function ChatbotModal({ onClose }: { onClose: () => void }) {
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [gapIdx, setGapIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answersByGap, setAnswersByGap] = useState<Record<string, string[]>>({});
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        "안녕하세요. 식약처 ‘생성형 인공지능 의료기기 허가·심사 가이드라인’에 맞춰 AIBOM을 점검하고 초안을 만들어 드릴게요.\n\n" +
        "업로드된 AIBOM을 우선 분석하고, 누락/부실 항목만 질문드릴게요. (/reset, /debug 가능)",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  // StrictMode에서도 **정말 한 번만** 실행되게 가드
  const analyzedOnceRef = useRef(false);

  useEffect(() => {
    if (analyzedOnceRef.current) return;
    analyzedOnceRef.current = true;

    // 답변 복구
    try {
      const prev = localStorage.getItem(LS_KEY);
      if (prev) {
        const parsed = JSON.parse(prev) as GapAnswer[];
        const obj: Record<string, string[]> = {};
        parsed.forEach((p) => (obj[p.gapId] = p.answers));
        setAnswersByGap(obj);
      }
    } catch {}

    (async () => {
      setBusy(true);
      try {
        const res = await fetch("/api/aibom/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aibom: aibomDraft }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "분석 실패");

        setGaps(data.gaps as Gap[]);
        post("assistant", `AIBOM 점검 결과, 보완이 필요한 항목이 ${data.gaps.length}건 확인됐어요.`);
        // ✅ 여기서 **단 한 번만** 첫 질문 출력
        setTimeout(() => askCurrentQuestion(data.gaps, 0, 0), 250);
      } catch (e: any) {
        post("assistant", `❌ 분석 실패: ${e?.message || e}`);
      } finally {
        setBusy(false);
      }
    })();
  }, []);

  const post = (role: "user" | "assistant", text: string) =>
    setMessages((prev) => [...prev, { role, text }]);

  function askCurrentQuestion(gs: Gap[], g: number, q: number) {
    const gap = gs[g];
    if (!gap) {
      generateDocument(); // 모든 질문 완료
      return;
    }
    const question = gap.followUps[q] ?? gap.followUps[0];
    post("assistant", `Q${g + 1}. ${question}`);
  }

  function goNext() {
    const gap = gaps[gapIdx];
    if (!gap) return;
    const isLastQ = qIdx >= gap.followUps.length - 1;
    if (!isLastQ) {
      const nextQ = qIdx + 1;
      setQIdx(nextQ);
      setTimeout(() => askCurrentQuestion(gaps, gapIdx, nextQ), 200);
      return;
    }
    // 다음 GAP
    const nextG = gapIdx + 1;
    setGapIdx(nextG);
    setQIdx(0);
    const ng = gaps[nextG];
    if (ng) {
      post("assistant", `좋아요. 다음 항목 “${ng.title}”에 대해 여쭤볼게요.`);
      setTimeout(() => askCurrentQuestion(gaps, nextG, 0), 250);
    } else {
      generateDocument();
    }
  }

  function saveAnswer(gapId: string, qi: number, text: string) {
    setAnswersByGap((prev) => {
      const arr = prev[gapId] ? [...prev[gapId]] : [];
      arr[qi] = text;
      const out: GapAnswer[] = Object.entries({ ...prev, [gapId]: arr }).map(([gid, answers]) => ({
        gapId: gid,
        answers,
      }));
      localStorage.setItem(LS_KEY, JSON.stringify(out));
      return { ...prev, [gapId]: arr };
    });
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || busy) return;

    if (text === "/reset") {
      localStorage.removeItem(LS_KEY);
      // StrictMode에 안전하게 재시작
      location.reload();
      return;
    }
    if (text === "/debug") {
      setInput("");
      post("assistant", JSON.stringify({ gapIdx, qIdx, answersByGap }, null, 2));
      return;
    }

    setInput("");
    post("user", text);

    const gap = gaps[gapIdx];
    if (!gap) return;
    saveAnswer(gap.id, qIdx, text);
    goNext();
  }

  async function generateDocument() {
    post("assistant", "⏳ 답변을 반영해 최종 문서를 구성하고 있어요…");
    setBusy(true);
    try {
      // 서버에 섹션 단위로 풍부하게 만들어 달라고 요청
      const patches: Record<string, any> = {};
      gaps.forEach((g) => {
        const A = answersByGap[g.id];
        if (!A?.length) return;
        patches[g.id] = g.followUps.map((q, i) => ({ question: q, answer: A[i] || "" }));
      });

      const res = await fetch("/api/documents/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aibom: aibomDraft, patches }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "생성 실패");

      // Documents에서 Export할 때 사용
      localStorage.setItem("draftDocument", JSON.stringify(data));

      post("assistant", "✅ 초안이 준비됐어요. /documents에서 ‘Export (MFDS Table)’로 PDF를 저장하세요.");
      setTimeout(() => (location.href = "/documents"), 400);
    } catch (e: any) {
      post("assistant", `❌ 생성 실패: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const composing = (e.nativeEvent as any).isComposing;
    if (e.key === "Enter" && !composing) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-2xl shadow-lg w-full max-w-lg h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">AI 인허가 문서 챗봇</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs whitespace-pre-wrap rounded-2xl px-3 py-2 ${
                  m.role === "user" ? "bg-black text-white rounded-br-none" : "bg-white border rounded-bl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2 border-t bg-white p-3">
          <input
            className="flex-1 border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300 disabled:opacity-60"
            value={input}
            placeholder={busy ? "처리 중…" : "답변을 입력하세요… (/reset, /debug)"}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy}
          />
          <button
            onClick={handleSend}
            className="rounded-xl bg-black text-white px-4 py-2 hover:bg-gray-800 disabled:opacity-60"
            disabled={busy}
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}