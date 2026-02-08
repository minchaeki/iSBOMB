// frontend/lib/rag/mfds.ts
// MFDS 가이드라인 임베딩 인덱스로부터 top-k 문단을 찾는 간단한 RAG 헬퍼

import mfdsIndex from "@/data/mfds_index.json"; // scripts/build_mfds_index.cjs가 만든 파일을 읽습니다.

type MfdsItem = {
  id: string;
  title: string;
  chunk: string;
  embedding: number[];
};

// 코사인 유사도
function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] ** 2;
    nb += b[i] ** 2;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * 쿼리 임베딩(queryEmbedding)과 인덱스를 비교해 상위 k개 반환
 * - 이 함수는 "임베딩 벡터"를 받아서 검색만 수행합니다.
 * - 임베딩 생성은 서버(route.ts)에서 OpenAI로 만들고, 여기엔 숫자 배열을 넘기세요.
 */
export function ragSearchByVector(
  queryEmbedding: number[],
  k = 3,
  minScore = 0.2
): Array<MfdsItem & { score: number }> {
  const items = mfdsIndex as unknown as MfdsItem[];
  return items
    .map((it) => ({ ...it, score: cosine(queryEmbedding, it.embedding) }))
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}