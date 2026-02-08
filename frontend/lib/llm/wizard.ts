export type AnswerMap = Record<string, string>;

export const QUESTIONS = [
  {
    id: "applicability",
    label: "이 모델의 적용 범위를 구체적으로 설명해주세요. (예: 의료영상 분석용 생성형 AI 등)",
    validate: (text: string) =>
      text.length > 20 || /AI|의료|분석|생성/.test(text),
    feedback:
      "답변이 조금 짧아요. 모델의 목적, 대상(예: 진단, 치료보조), 사용환경(병원, 연구소 등)을 포함해 주세요.",
  },
  {
    id: "riskManagement",
    label:
      "이 모델의 위험 요인은 무엇이며, 데이터 품질·보안·편향을 어떻게 관리하셨나요?",
    validate: (text: string) =>
      text.includes("보안") || text.includes("데이터") || text.length > 40,
    feedback:
      "가이드라인에 따르면 데이터 품질과 보안, 편향성까지 언급해야 합니다. 예시: '환자정보 비식별화, 보안 암호화 적용, 데이터 편향 검증 수행' 등",
  },
  {
    id: "submissionData",
    label:
      "AI 모델의 작용 원리, 구조, 입출력 흐름을 기술해주세요. (예: Transformer 기반, 의료영상 입력 → 판독문 생성)",
    validate: (text: string) =>
      text.includes("입력") || text.includes("출력") || text.length > 30,
    feedback:
      "입력 형태(예: 영상, 텍스트), 출력 형태(예: 판독문, 요약), 모델 구조(예: LLM, CNN 등)를 구체적으로 설명하면 좋아요.",
  },
  {
    id: "performanceValidation",
    label:
      "이 모델의 성능 검증 결과를 요약해주세요. (예: AUC, F1-score, 민감도 등)",
    validate: (text: string) => /\d/.test(text) || text.includes("score"),
    feedback:
      "성능지표(AUC, F1-score 등 수치)를 포함하면 좋아요. 임상평가 결과가 있다면 간단히 덧붙여주세요.",
  },
  {
    id: "precautions",
    label:
      "모델 사용 시 주의사항이나 한계를 알려주세요. (예: 특정 질환에만 적용, 임상 검토 필요 등)",
    validate: (text: string) =>
      text.length > 10 || text.includes("주의") || text.includes("한계"),
    feedback:
      "‘임상 전문가 검토 필요’, ‘특정 조건 하에서만 사용 권장’ 등 실제 사용상의 한계를 언급해 주세요.",
  },
];

// 가이드라인 요구 형식으로 payload 변환
export function toGeneratePayload(ans: AnswerMap) {
  return {
    modelId: 1,
    document: {
      적용범위: ans.applicability,
      위험관리: ans.riskManagement,
      신청자료: ans.submissionData,
      성능검증: ans.performanceValidation,
      사용시주의사항: ans.precautions,
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      reviewer: "식약처 가이드라인 기반 LLM 챗봇 v0.9",
    },
  };
}