import OpenAI from "openai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

type Row = { id: string; title: string; chunk: string; embedding: number[] };

// ── 0) 인덱스 로딩 (서버 시작 시 1회)
let INDEX: Row[] = [];
(function loadIndex() {
  try {
    const idxPath = path.join(process.cwd(), "data", "mfds_index.json");
    const raw = fs.readFileSync(idxPath, "utf-8");
    INDEX = JSON.parse(raw) as Row[];
    console.log("📚 MFDS index loaded:", INDEX.length);
  } catch (e) {
    console.warn("⚠️ MFDS index not found. Run scripts/build_mfds_index.cjs first.");
    INDEX = [];
  }
})();

// ── 1) 유틸: 코사인 유사도
function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i]**2; nb += b[i]**2; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ── 2) 검색 함수
async function retrieve(client: OpenAI, query: string, k = 4, minScore = 0.2) {
  if (!INDEX.length) return [];
  const emb = await client.embeddings.create({ model: "text-embedding-3-small", input: query });
  const qv = emb.data[0].embedding;
  return INDEX
    .map(r => ({ ...r, score: cosine(qv, r.embedding) }))
    .filter(s => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json(); // [{role, content}, ...]
    const userMsg = Array.isArray(messages) ? messages.findLast((m: any) => m?.role === "user") : null;
    const userQ: string = userMsg?.content ?? "";

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });

    // ── 3) RAG 검색
    const hits = await retrieve(client, userQ, 4, 0.2);
    const context = hits.map(h => `### ${h.title}\n${h.chunk}`).join("\n\n---\n\n");

    // ── 4) LLM 호출 (근거 포함)
    const system = [
      "너는 식약처 ‘생성형 인공지능 의료기기 허가·심사 가이드라인’ 보조원이다.",
      "반드시 아래 컨텍스트(가이드라인 발췌)에 근거해서 한국어로 답해라.",
      "근거가 없으면 보수적으로 답하고, 단정적 표현을 피하라.",
      "답변 끝에 '근거' 섹션으로 참고 문단(제목/쪽)을 bullet로 요약하라.",
    ].join(" ");

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "system", content: `컨텍스트(가이드라인 발췌):\n${context || "(검색 결과 없음)"}` },
        ...(Array.isArray(messages) ? messages : []),
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({
      content,
      retrieved: hits.map(h => ({
        id: h.id,
        title: h.title,
        score: Number(h.score.toFixed(3)),
      })),
    });
  } catch (err: any) {
    console.error("/api/chat error:", err?.message || err);
    return NextResponse.json({ error: "Chat API error" }, { status: 500 });
  }
}