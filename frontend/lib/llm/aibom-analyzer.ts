// frontend/lib/llm/aibom-analyzer.ts
export type Aibom = {
  generalInfo: {
    modelName: string
    developer: string
    version: string
    modelType?: string
    purposeOfUse?: string | null
  }
  trainingData?: {
    dataSource?: string
    dataType?: string
    dataSize?: string
    preprocessing?: string
    collectionPeriod?: string
    demographics?: string
  }
  ethicsAndBias?: {
    analysisPerformed?: boolean
    mitigationSteps?: string | null
    fairnessMetrics?: string | null
  }
  performance?: {
    metrics?: Record<string, number> // { accuracy: 0.92, auc: 0.97, ... }
    validationDataset?: string
    notes?: string
  }
  security?: {
    dataPoisoningDefense?: string | null
    modelEvasionCheck?: string | null
    blockchainHash?: string | null
  }
  supplyChain?: {
    environment?: Record<string, string>
    dependencies?: Array<{ name: string; version: string }>
  }
}

export type Gap = {
  id: string
  label: string
  feedback: string
  // 답변을 어디에 반영할지 지정
  apply: (draft: Aibom, answer: string) => Aibom
}

// 부실/누락 판단 유틸
const isEmpty = (v: any) =>
  v === null || v === undefined || (typeof v === "string" && v.trim().length === 0)

// 분석해서 질문 리스트 반환
export function analyzeGaps(a: Aibom): Gap[] {
  const gaps: Gap[] = []

  // 1) 목적(Purpose of Use)
  if (isEmpty(a.generalInfo?.purposeOfUse)) {
    gaps.push({
      id: "purposeOfUse",
      label:
        "모델의 사용 목적을 구체적으로 작성해 주세요. (예: 흉부 CT에서 결절 탐지 보조, 임상의 판독 보조, 사용 환경: 상급종합병원 판독실 등)",
      feedback: "목적, 대상(진단/치료보조 등), 사용환경(병원/연구소)을 포함해 주세요.",
      apply: (d, ans) => ({
        ...d,
        generalInfo: { ...d.generalInfo, purposeOfUse: ans },
      }),
    })
  }

  // 2) 윤리·편향
  if (!a.ethicsAndBias?.analysisPerformed || isEmpty(a.ethicsAndBias.mitigationSteps)) {
    gaps.push({
      id: "ethicsAndBias.mitigationSteps",
      label:
        "데이터 편향성/윤리적 검토 및 완화 방안을 기술해 주세요. (소수 집단 가중치, 리샘플링, 민감특이도 그룹별 비교 등)",
      feedback: "완화전략과 검증방법(집단별 성능 비교, 균형 재조정 등)을 포함해 주세요.",
      apply: (d, ans) => ({
        ...d,
        ethicsAndBias: {
          analysisPerformed: true,
          fairnessMetrics: d.ethicsAndBias?.fairnessMetrics ?? "집단별 민감도/특이도 비교",
          mitigationSteps: ans,
        },
      }),
    })
  }

  // 3) 성능지표(accuracy만 있으면 부실)
  const m = a.performance?.metrics || {}
  const onlyAccuracy = Object.keys(m).length === 1 && "accuracy" in m
  if (onlyAccuracy) {
    gaps.push({
      id: "performance.metrics",
      label:
        "성능 지표를 보강해 주세요. (AUC, F1, 민감도/특이도, PPV/NPV 등 수치와 평가셋 규모/출처)",
      feedback: "핵심 지표 수치와 평가셋 설명을 추가해 주세요.",
      apply: (d, ans) => {
        // 간단 파서: 'AUC:0.96,F1:0.88,민감도:0.90' 형태도 허용
        const metrics: Record<string, number> = { ...(d.performance?.metrics || {}) }
        ans.split(/[,\n]/).forEach((kv) => {
          const [k, v] = kv.split(/[:=]/).map(s => s.trim())
          const num = Number(v)
          if (k && !Number.isNaN(num)) metrics[k.toLowerCase()] = num
        })
        return {
          ...d,
          performance: {
            ...d.performance,
            metrics,
            validationDataset:
              d.performance?.validationDataset || "독립 검증셋(규모/출처 명시)",
          },
        }
      },
    })
  }

  // 4) 보안(ISBOMB 핵심)
  const sec = a.security || {}
  const needsSecurity =
    sec.dataPoisoningDefense === "수행 안 함" ||
    sec.modelEvasionCheck === "수행 안 함" ||
    isEmpty(sec.blockchainHash)
  if (needsSecurity) {
    gaps.push({
      id: "security",
      label:
        "보안/공급망 방어 조치를 기술해 주세요. (데이터 중독 방지, Evasion 테스트, 해시기반 변경감지 등)",
      feedback: "시나리오와 점검 결과/정책(탐지·차단·모니터링)을 포함해 주세요.",
      apply: (d, ans) => ({
        ...d,
        security: {
          dataPoisoningDefense: "중독 샘플 탐지 및 데이터 버전관리",
          modelEvasionCheck: "역적대 샘플로 Evasion 테스트 수행",
          blockchainHash: d.security?.blockchainHash || "sha256:... (배포물 해시)",
          ...d.security,
          // 자유 서술을 notes로 넣고 싶다면 performance.notes 처럼 필드 추가도 가능
        },
      }),
    })
  }

  // 5) 훈련데이터 보완(기간/인구통계)
  if (!a.trainingData?.collectionPeriod || !a.trainingData?.demographics) {
    gaps.push({
      id: "trainingData.more",
      label:
        "훈련 데이터 수집 기간 및 환자 인구통계를 적어주세요. (예: 2018–2023, 성별/연령 분포, 다기관 여부)",
      feedback: "기간과 주요 인구통계(연령/성별/기관 수)를 포함해 주세요.",
      apply: (d, ans) => ({
        ...d,
        trainingData: {
          ...d.trainingData,
          collectionPeriod: d.trainingData?.collectionPeriod || "YYYY–YYYY",
          demographics: ans,
        },
      }),
    })
  }

  return gaps
}