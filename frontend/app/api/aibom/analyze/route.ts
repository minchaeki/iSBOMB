import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";

import { ragSearchByVector } from "@/lib/llm/rag/mfds";
import aibomDraft from "@/data/aibom_draft.json";

export const runtime = "nodejs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const EMB_MODEL = process.env.OPENAI_EMB_MODEL ?? "text-embedding-3-small";

/* ------------------ 유틸 ------------------ */
async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({ model: EMB_MODEL, input: text });
  return res.data[0].embedding;
}

// 코드블록 안의 JSON만 뽑아 안전 파싱
function safeParseJsonFromText(text: string) {
  try {
    const m = text.match(/```json\s*([\s\S]*?)```/i);
    const raw = m ? m[1] : text;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* ------------------ GET: 점검용 ------------------ */
export async function GET() {
  const indexPath = path.join(process.cwd(), "data", "mfds_index.json");
  const hasIndex = fs.existsSync(indexPath);
  return NextResponse.json({
    ok: true,
    hasIndex,
    aibomKeys: Object.keys(aibomDraft ?? {}),
    sample: {
      modelName: aibomDraft?.generalInfo?.modelName ?? null,
      ethicsAndBias: aibomDraft?.ethicsAndBias ?? null,
    },
  });
}

/* ------------------ POST: AIBOM 분석 ------------------ */
export async function POST(req: Request) {
  try {
    // 1) AIBOM 입력 받기 (없으면 로컬 초안 사용)
    let incoming: any = null;
    try {
      incoming = await req.json();
    } catch {}
    const aibom = incoming?.aibom ?? aibomDraft;

    // 2) 분석용 텍스트 만들기
    const sections = Object.entries(aibom)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join("\n\n");

    // =================================================================
    // ✅ [수정] userQuery (프롬프트)를 훨씬 더 구체적으로 변경
    // =================================================================
    const userQuery = [
      "아래는 사용자의 AIBOM 초안입니다.",
      "--- AIBOM START ---",
      sections,
      "--- AIBOM END ---",
      "",
      "이 내용을 '식약처 생성형 AI 의료기기 허가·심사 가이드라인'의 핵심 요구사항과 비교하여, **부족한 항목을 모두** 찾아주세요.",
      "**'부족한 항목'이란 다음을 의미합니다:**",
      "1. **값이 없는(null/빈 문자열) 항목** (예: `performance.validationDataset`가 비어있음)",
      "2. **'수행 안 함', '없음', '미수행', '계획 없음'** 등 부정적인 키워드가 포함된 항목.",
      "",
      "**핵심 요구사항 (이것들을 중점적으로 검사):**",
      "- **위험 관리 (Risk Management):**",
      "  - `ethicsAndBias.analysisPlan`: 편향 완화 계획 (가중치 조정, 공정성 지표 모니터링 등)",
      "  - `security.dataPoisoningDefense`: 데이터 오염 방지 계획 (탐지 모듈, 검증 프로토콜 등)",
      "  - `security.modelEvasionCheck`: 모델 회피(입력 공격) 방어 계획 (적대적 공격 학습 등)",
      "  - `security.blockchainHash`: 기록 관리 및 무결성 보장 계획 (블록체인, 해시 관리 등)",
      "- **성능 검증 (Performance):**",
      "  - `performance.metrics`: 분석적 성능 지표 (Accuracy 외 AUC, F1, 민감도, 특이도 포함 여부)",
      "  - `performance.validationDataset`: 외부 검증 데이터셋 및 교차 검증 수행 여부",
      "- **임상적 유효성 (Clinical Validity):** (AIBOM에 항목이 없더라도, 이것이 누락되었음을 지적해야 함)",
      "  - 내용: 임상시험, 업무 효율성(시간 단축), 진단 정확도 향상, RADPEER 평가 계획 등",
      "",
      "**출력:**",
      "검사 후, **부족한 항목 각각에 대해** 다음 JSON 구조를 따르는 `gaps` 배열을 생성하세요.",
      "- `title`: 항목 이름 (예: '데이터 오염 방지 계획')",
      "- `reason`: 부족한 이유 (예: 'AIBOM에 '수행 안 함'으로 기재됨', '임상적 유효성 확인 계획이 누락됨')",
      "- `followUps`: 이 항목을 **보완하기 위한 상세 계획**을 묻는 구체적인 질문 1~2개.",
      "  (예: '데이터 오염(Data Poisoning) 방지를 위한 구체적인 대응 및 탐지 모듈 계획을 알려주세요.')",
      "",
      "반드시 JSON 형식으로만 응답하세요. 아래 구조를 그대로 따르세요.",
      '{"summary":"AIBOM 검토 결과, 가이드라인 대비 보완이 필요한 X건의 항목을 발견했습니다.","gaps":[{"title":"","reason":"","followUps":[""]}]}',
      "추가 설명 텍스트 없이 순수 JSON만 출력하세요."
    ].join("\n");
    // =================================================================

    // 3) RAG: 가이드라인 관련 문단 검색
    const qv = await embed(userQuery);
    const refs = ragSearchByVector(qv, 4, 0.25);

    const systemPrompt = [
      "당신은 식약처 인허가 심사 전문가입니다.",
      "AIBOM의 내용이 '수행 안 함'이거나 '없음'으로 되어 있다면, 그것은 '부족한 항목'입니다. 반드시 사용자가 보완 계획을 입력하도록 질문을 생성해야 합니다.",
      "다음은 식약처 '생성형 인공지능 의료기기 가이드라인'에서 검색된 관련 내용입니다:",
      "",
      refs.map(r => `- (${r.id}) ${r.title}\n${r.chunk}`).join("\n\n"),
    ].join("\n");

    // 4) LLM 호출
    const chat = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.1, // [수정] 더 명확한 지시를 따르도록 온도를 낮춤
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
      ],
    });

    const content = chat.choices[0]?.message?.content ?? "";
    const parsed = safeParseJsonFromText(content);

    // 5) 실패 대비: 최소 형태 보장
    const result = parsed ?? {
      summary: "분석 결과를 구조화하지 못했습니다.",
      gaps: [
        {
          title: "구조화 실패",
          reason: "LLM 응답 파싱 실패: " + content, // [수정] 디버깅을 위해 원본 content 포함
          followUps: ["다시 요청해 주세요."],
        },
      ],
    };

    // 6) refs(근거 문단)도 함께 반환
    return NextResponse.json({ ok: true, ...result, refs });
  } catch (err: any) {
    console.error("[/api/aibom/analyze] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "analyze failed" },
      { status: 500 }
    );
  }
}
