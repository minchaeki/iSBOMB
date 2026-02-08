export function buildDraftPrompt(i: {
  modelName: string; modelVersion: string; developer: string;
  trainingSummary?: string; performance?: string; aibomCid?: string;
}) {
  return `
당신은 식약처(2025) 「생성형 인공지능 의료기기 허가·심사 가이드라인」에 따라
인허가 제출용 '초안 문서'를 작성하는 규제 전문가입니다.
오직 유효한 JSON만 출력하세요.

[입력]
- 모델명: ${i.modelName}
- 버전: ${i.modelVersion}
- 개발사: ${i.developer}
- 학습 개요: ${i.trainingSummary ?? "미제공"}
- 성능 요약: ${i.performance ?? "미제공"}
- AIBOM CID: ${i.aibomCid ?? "미제공"}

[작성 지침]
- 적용범위, 위험관리(데이터 품질/편향 등) 포함.
- 신청자료: 작용원리, 구조/정보통신체계도, 부분품/구성요소(버전/환경),
  성능특성(입출력·유효성항목·클라우드), 사용시주의사항(임상의 검토).
- 제출자료: 분석적 성능검증(지표·보안위협 대응), 임상적 유효성(평가/점수체계 예시).
- 한국어 존댓말, 사실 기반. 표/목록 허용.

[출력(JSON만, 추가 텍스트 금지)]
{
  "metadata": {
    "title": "${i.modelName} 인허가 제출 초안",
    "modelId": 0,
    "modelVersion": "${i.modelVersion}",
    "developer": "${i.developer}",
    "aibomCid": "${i.aibomCid ?? ""}",
    "generatedAt": "ISO-8601",
    "recommendedFileName": "AIBOM_Draft-${i.modelName.replace(/[^\w-]+/g,"_")}-YYYYMMDD.pdf"
  },
  "document": {
    "적용범위": "...",
    "위험관리": { "주요위해요인": ["..."], "완화전략": ["..."] },
    "신청자료": {
      "작용원리": "...",
      "구조/정보통신체계도": "...",
      "부분품및구성요소": "...",
      "성능특성": {
        "입출력정보": "...",
        "유효성확인항목": ["..."],
        "클라우드구성": "..."
      },
      "사용시주의사항": "..."
    },
    "제출자료": {
      "분석적성능검증": { "지표": ["AUC","F1"], "침해방지대책": ["..."] },
      "임상적유효성확인": { "방법": "...", "점수체계예시": "RADPEER 등" }
    },
    "결론": "..."
  }
}
`.trim();
}