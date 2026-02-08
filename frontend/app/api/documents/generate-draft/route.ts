import { NextResponse } from "next/server";
import aibomDraft from "@/data/aibom_draft.json";
import { ragSearchByVector } from "@/lib/llm/rag/mfds";

export const runtime = "nodejs";

type QA = { question: string; answer: string };
type Patches = Record<string, QA[]>;

type Sections = {
  scope: string;
  examples: string;
  risk: string;
  applicationDocs: string;
  performance: string;
};

// ------------------------
// 텍스트 정규화 / 문서체 변환
// ------------------------
const stripLeading = (s = "") =>
  s
    .replace(/^\s*네[, ]*\s*/i, "")
    .replace(/^\s*(예|예\.)[, ]*\s*/i, "")
    .replace(/^\s*-\s*/, "")
    .replace(/^\s*[•·]\s*/, "");

const toDeclarative = (s = "") =>
  s
    .replace(/합니다(\.)?/g, "한다$1")
    .replace(/됩니다(\.)?/g, "된다$1")
    .replace(/있습니다(\.)?/g, "있다$1")
    .replace(/계획입니다(\.)?/g, "계획이다$1")
    .replace(/수행하고 있습니다(\.)?/g, "수행하고 있다$1")
    .replace(/적용하고 있습니다(\.)?/g, "적용하고 있다$1")
    .replace(/적용하고자 합니다(\.)?/g, "적용하고자 한다$1")
    .replace(/\s+/g, " ")
    .trim();

const cleanse = (s = "") => toDeclarative(stripLeading(s));

const bullets = (items: (string | undefined | false | null)[]) =>
  items
    .map((x) => (x ? cleanse(String(x)) : ""))
    .filter(Boolean)
    .map((x) => `• ${x}`)
    .join("\n");

// patches 에서 특정 키워드가 들어간 질문의 답들을 뽑아오기
function pick(patches: Patches, substrs: string[]) {
  return Object.values(patches)
    .flat()
    .filter((p) => substrs.some((s) => p.question.toLowerCase().includes(s.toLowerCase())))
    .map((p) => cleanse(p.answer))
    .filter(Boolean);
}

// =================================================================
// ✅ [수정] AIBOM 원본 값과 사용자 답변(patch)을 지능적으로 결합하는 함수
// =================================================================
/**
 * 레이블, 원본값, 패치(사용자 답변)를 받아 포맷팅된 문자열을 반환합니다.
 * @param label - (예: "데이터 품질")
 * @param originalValue - (예: AIBOM의 "수행 안 함")
 * @param patchValues - (예: 챗봇 답변 ["블록체인... 계획이다"])
 * @returns - "• 레이블: [내용]"
 */
function mergeOrReplaceWithLabel(
  label: string,
  originalValue: string | undefined | false | null,
  patchValues: string[]
) {
  let content = "";
  
  if (patchValues.length > 0) {
    // 1. 사용자 답변(patch)이 있으면, 원본을 무시하고 사용자 답변으로 대체
    content = patchValues.join('; '); 
  } else {
    // 2. 사용자 답변이 없으면, AIBOM 원본 값을 사용
    content = cleanse(String(originalValue || "계획 없음")); // (원본이 null이면 "계획 없음"으로)
  }
  
  // 3. "레이블: 내용" 형태의 단일 문자열로 반환
  return `${label}: ${content}`;
}


export async function POST(req: Request) {
  const { aibom = aibomDraft, patches = {} as Patches } = await req.json();

  // 1) 원본 AIBOM
  const g = aibom?.generalInfo ?? {};
  const t = aibom?.trainingData ?? {};
  const e = aibom?.ethicsAndBias ?? {};
  const perf = aibom?.performance ?? {};
  const sec = aibom?.security ?? {};
  const sc = aibom?.supplyChain ?? {};

  // 2) 사용자 입력(패치) - 키워드 세분화
  const purpose          = pick(patches, ["사용 목적", "의료적 상황", "대상 환자군", "치료"]);
  const biasPlan         = pick(patches, ["편향", "윤리", "공정성"]);
  const dataQualityPlan  = pick(patches, ["데이터 품질", "오류 라벨", "노이즈 샘플"]);
  const dataPoisonPlan   = pick(patches, ["오염 방지", "Data Poisoning", "검증 프로토콜"]);
  const modelEvasionPlan = pick(patches, ["모델 회피", "Evasion Attack", "적대적 공격"]);
  const integrityPlan    = pick(patches, ["무결성", "블록체인", "해시", "로그 관리"]);
  const analyticMetrics  = pick(patches, ["성능 검증 지표", "민감도", "특이도", "AUC", "F1", "Accuracy"]);
  const validationSet    = pick(patches, ["검증 데이터셋", "외부 검증", "교차 검증", "재현성"]);
  const clinicalPlan     = pick(patches, ["임상적 유효성", "업무 효율", "작성 시간", "RADPEER", "임상시험"]);

  // 3) RAG 참고(타이틀만 사용)
  const refs = ragSearchByVector(new Array(1536).fill(0.01), 4, 0.2);
  const refHints = refs.map((r) => `• ${r.title}`);

  // 4) 누락 항목 체크(챗봇이 재질문할 수 있도록)
  const missingFields: string[] = [];
  if (!purpose.length && !g.purposeOfUse) missingFields.push("구체적 사용 목적");
  if ((e.analysisPerformed === false || String(e.analysisPlan).includes("수행 안 함")) && !biasPlan.length) missingFields.push("윤리/편향 분석 및 완화 계획");
  if ((!sec.dataPoisoningDefense || String(sec.dataPoisoningDefense).includes("수행 안 함")) && !dataPoisonPlan.length) missingFields.push("데이터 오염 방지 계획");
  if ((!sec.modelEvasionCheck || String(sec.modelEvasionCheck).includes("수행 안 함")) && !modelEvasionPlan.length) missingFields.push("모델 회피 검사 계획");
  if ((!perf.metrics?.accuracy) && !analyticMetrics.length) missingFields.push("분석적 성능 지표 (Accuracy, AUC 등)");
  if (!perf.validationDataset && !validationSet.length) missingFields.push("검증 데이터셋 구성");
  if (!clinicalPlan.length) missingFields.push("임상적 유효성 확인 계획");


  // 5) 섹션 구성
  const scope = bullets([
    g.modelName && `모델명: ${g.modelName}`,
    `모델 유형: ${g.modelType || "생성형 의료기기 소프트웨어"}`,
    (purpose.length ? `구체적 사용 목적: ${purpose.join("; ")}` : (g.purposeOfUse && `구체적 사용 목적: ${g.purposeOfUse}`)),
    "의료진 입력을 바탕으로 생성 결과를 제공하여 판독을 보조한다.",
    "파운데이션 모델을 기반으로 다중 의료 도메인에 적용 가능하다.", // 예시 반영
  ]);

  const examples = bullets([
    "영상 판독 리포트 초안/요약 생성",
    "병리 슬라이드 기반 진단보조 보고서 생성", // 예시 반영
    "임상 메모·소견 초안 생성",
    "임상 대화 녹취를 구조화 문서로 변환", // 예시 반영
    "의료 목적과 무관한 일반 문서 생성은 제외한다.",
    "순수 창작·번역 목적의 사용은 제외한다.",
  ]);

  // =================================================================
  // ✅ [수정] 위험 관리: mergeOrReplaceWithLabel 함수를 사용해 재구성
  // =================================================================
  const risk = bullets([
    // 1. AIBOM 원본 항목 (데이터 출처 등)
    t.dataSource && `데이터 출처: ${t.dataSource}`,
    t.dataType && `데이터 유형: ${t.dataType}`,
    (t.dataSize || t.preprocessing) &&
      `규모/전처리: ${t.dataSize || "-"} / ${t.preprocessing || "-"}`,
    
    // 2. AIBOM/Patch 결합 항목 (목표 예시 PDF 구조 반영)
    // (데이터 품질 항목은 AIBOM draft에 없어, 예시 PDF의 기본값 사용)
    mergeOrReplaceWithLabel(
      "데이터 품질",
      t.qualityControl || "의료기관별·인구집단별 편향, 오류 라벨, 노이즈 샘플 검출 및 제거", 
      dataQualityPlan
    ),
    mergeOrReplaceWithLabel(
      "편향 완화",
      e.analysisPlan || (e.analysisPerformed === false ? "미수행" : null),
      biasPlan
    ),
    // (보안 관리는 2개 항목을 합쳐서 표현)
    mergeOrReplaceWithLabel(
      "보안 관리",
      `입력 공격(Evasion Attack) 대응: ${sec.modelEvasionCheck || "수행 안 함"}; 데이터 오염(Data Poisoning) 대응: ${sec.dataPoisoningDefense || "수행 안 함"}`,
      [...dataPoisonPlan, ...modelEvasionPlan] // 두 개의 사용자 답변을 하나로 합침
    ),
    mergeOrReplaceWithLabel(
      "기록 관리",
      sec.blockchainHash || "모든 학습·추론 로그를 블록체인 기반 해시로 관리하여 무결성 보장",
      integrityPlan
    ),
  ]);
  // =================================================================

  // 4번(모양 및 구조): 마커 포함
  const principle = bullets([
    "입력(영상·텍스트) → 생성 모델(프롬프트·파라미터) → 출력(임상 문구·요약)으로 동작한다.",
    "임상적 타당성 근거와 의사결정 흐름을 명확히 기술한다.",
  ]);
  const ioStruct = bullets([
    "클라우드 기반 백엔드 서버와 의료기관 내 PACS/HIS 연동",
    "PACS/HIS 연동 및 DICOM/HL7-FHIR 인터페이스를 지원한다.",
    "로그·감사 추적 및 접근통제를 제공한다.",
  ]);
  const components = bullets([
    `AI 모델 엔진(${g.modelName || "Engine"}-v${g.version || "1.0"}), 프롬프트 처리 모듈, UI`,
    (sc.environment &&
      `운영환경: Python ${sc.environment?.pythonVersion || "-"}, PyTorch ${sc.environment?.pytorchVersion || "-"}, CUDA ${sc.environment?.cudaVersion || "-"}`) || "운영환경: Ubuntu 22.04, NVIDIA CUDA 12.1, PyTorch 2.1",
    (sc.dependencies &&
      `주요 종속성: ${(sc.dependencies || [])
        .map((d: any) => `${d.name}@${d.version}`)
        .join(", ")}`) || "",
  ]);
  const caution = bullets([
    "사용자 검토를 필수로 하며 자동 승인은 허용하지 않는다.",
    "훈련 데이터 편향에 따른 제한사항을 고지한다.",
    "최종 진단·판단은 반드시 의료진의 전문 지식에 근거해야 한다.",
  ]);
  
  const applicationDocs = [
    `작용원리:`, principle,
    `구조/정보통신:`, ioStruct,
    `부분품 또는 구성요소 등:`, components,
    `사용 시 주의사항:`, caution,
  ].join("\n\n");

  // =================================================================
  // ✅ [수정] 제출 자료: mergeOrReplaceWithLabel 함수를 사용해 재구성
  // =================================================================
  
  // (성능 검증 지표는 여러 개일 수 있으므로 AIBOM 원본과 사용자 답변을 모두 합침)
  const analyticMetricsContent = [
    perf.metrics?.accuracy ? `Accuracy: ${perf.metrics.accuracy}` : null,
    ...analyticMetrics
  ].filter(Boolean).join('; ');
  
  const analytic = bullets([
    mergeOrReplaceWithLabel(
      "분석적 성능 검증",
      analyticMetricsContent || "Accuracy, AUC, F1, 민감도, 특이도 등",
      [] // 이미 위에서 analyticMetrics를 처리했으므로 patch는 빈 배열
    ),
    mergeOrReplaceWithLabel(
      "검증 데이터셋",
      perf.validationDataset,
      validationSet
    ),
    "혼동행렬(ROC·PR)과 임상적 타당성 요약을 포함한다.",
    "동일 조건의 재현성 확인을 위해 교차 검증을 적용한다.",
  ]);

  const clinical = bullets([
    mergeOrReplaceWithLabel(
      "임상적 유효성 확인",
      null, // AIBOM에 원본 값 없음
      clinicalPlan
    ),
    "임상시험 결과를 통해 의료진의 업무 효율성(예: 보고서 작성 시간 단축) 및 진단 정확도 향상 효과 입증.",
    "라드피어(RADPEER) 평가 기준 또는 이에 준하는 임상평가 점수 획득.",
  ]);
  
  const performance = [
    analytic,
    clinical,
  ].join("\n\n");
  // =================================================================

  const sections: Sections = {
    scope,
    examples,
    risk,
    applicationDocs,
    performance,
  };

  // 6) 메타 + 섹션 반환
  const metadata = {
    title: `AIBOM 인허가 문서 초안`,
    modelName: g.modelName || "MODEL",
    modelVersion: g.version || "-",
    developer: g.developer || "-",
    regulator: "MFDS",
    status: "Draft",
    missingFields,     // ← 프론트가 있으면 이어서 질문
    refs: refHints,    // (선택) 참고 텍스트
  };

  return NextResponse.json({ metadata, sections });
}
