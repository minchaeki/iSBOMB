export type Gap = {
  id: string;               // "ethics.bias", "security.poison" 등
  title: string;            // 사람이 보기 쉬운 항목 이름
  reason: string;           // 왜 부족/누락인지 (가이드라인 근거 요약)
  followUps: string[];      // 이 gap을 채우기 위한 구체 질문들
};

export type GapAnswer = {
  gapId: string;
  answers: string[];        // followUps 순서대로 저장
};