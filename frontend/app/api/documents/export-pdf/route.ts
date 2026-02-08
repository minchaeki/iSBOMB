import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

type Sections = {
  scope?: string;
  examples?: string;
  risk?: string;
  applicationDocs?: string;
  performance?: string;
};

function b64Font(abs: string) {
  return fs.readFileSync(abs).toString("base64");
}
function has(v?: string) {
  return !!(v && v.trim().length);
}
function esc(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
// 개행·불릿 기호를 <ul><li>로 변환
function toBulletsBlock(text?: string) {
  if (!text) return "<ul class='bullet'><li>-</li></ul>";
  const items = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^[-•·]\s*/, ""))  // 선행 bullet 제거
    .map((l) => `<li>${l}</li>`)
    .join("");
  return `<ul class="bullet">${items || "<li>-</li>"}</ul>`;
  }

/** applicationDocs(문자) → {원리,구조통신,구성요소,주의사항}  */
function splitApplicationDocs(src?: string) {
  const text = src || "";
  const sections = {
    principle: "", // 작용원리
    ioStruct: "",  // 구조/정보통신체계도(연동/통신)
    components: "",// 부분품/구성요소/운영환경
    caution: "",   // 사용 시 주의사항
  };

  // =================================================================
  // ✅ [수정] 'components'의 정규식(re)을 'generate-draft'의 마커와 일치하도록 수정
  // =================================================================
  const markers = [
    { key: "principle", re: /(작용원리|모양\s*및\s*구조)\s*[:：]?\s*/i }, 
    { key: "ioStruct", re: /(구조[\/\s]*정보통신[^\n]*|구조[\/\s]*통신|구조\s*\/\s*통신)\s*[:：]?\s*/i },
    { key: "components", re: /(부분품\s*또는\s*구성요소\s*등)\s*[:：]?\s*/i }, // [수정] /(구성요소|부분품|운영환경)/i -> /(부분품\s*또는\s*구성요소\s*등)/i
    { key: "caution", re: /(사용\s*시\s*주의사항)\s*[:：]?\s*/i },
  ];
  // =================================================================

  // 구간 추출
  let pos: number[] = [];
  let tags: { key: keyof typeof sections; idx: number }[] = [];
  for (const m of markers) {
    const match = text.match(m.re);
    if (match && match.index !== undefined) {
      pos.push(match.index);
      tags.push({ key: m.key as any, idx: match.index });
    }
  }
  if (!pos.length) {
    // 마커 없으면 전체를 '원리'에 넣어둠
    sections.principle = text.trim();
    return sections;
  }
  // 마커 위치로 구간 슬라이스
  tags = tags.sort((a, b) => a.idx - b.idx);
  for (let i = 0; i < tags.length; i++) {
    const start = tags[i].idx;
    const end = i + 1 < tags.length ? tags[i + 1].idx : text.length;
    const slice = text.slice(start, end);
    // 마커가 포함된 제목줄을 제거
    const stripped = slice.replace(markers.find(m => m.key === tags[i].key)!.re, "").trim();
    sections[tags[i].key] = stripped.trim();
  }
  return sections;
}

/** performance(문자) → {분석적 성능검증, 임상적 유효성} */
function splitPerformance(src?: string) {
  const text = src || "";
  const out = {
    analytic: "",
    clinical: "",
  };
  // 간단 분리 규칙: "검증 지표|정량|AUC|F1|민감|특이" → 분석적, "임상|임상적|RAPDEER|임상평가" → 임상
  const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const a: string[] = [];
  const c: string[] = [];
  for (const l of lines) {
    if (/(임상|RAPDEER|임상평가|임상적|clinical|업무 효율|작성 시간)/i.test(l)) c.push(l);
    else if (/(AUC|F1|정밀|재현|민감|특이|혼동|ROC|PR|정량|성능|Accuracy)/i.test(l)) a.push(l);
    else a.push(l); // 애매하면 분석적에 (키워드 없는 기본 AIBOM 내용 등)
  }
  out.analytic = a.join("\n");
  out.clinical = c.join("\n");
  return out;
}


function htmlTemplate(meta: any, sections: Sections, fontDataUrl: string) {
  const appSplit = splitApplicationDocs(sections.applicationDocs);
  const perfSplit = splitPerformance(sections.performance);

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: 'NotoSansKR';
    src: url(${fontDataUrl}) format('opentype');
    font-weight: 400;
    font-style: normal;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    font-family: 'NotoSansKR', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
    color: #111827; -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .page { width: 210mm; min-height: 297mm; padding: 18mm 16mm; }
  /* h1 가운데 정렬 */
  h1 { margin: 0 0 10mm; font-size: 22pt; font-weight: 700; letter-spacing: 0; text-align: center; }
  /* .meta 가운데 정렬 */
  .meta { font-size: 11.5pt; margin-bottom: 8mm; text-align: center; }
  .meta b { font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5pt; table-layout: fixed; }
  th, td { border: 1px solid #111; padding: 8pt 9pt; vertical-align: top; word-break: keep-all; }
  thead th { background: #eef2f7; text-align: center; font-weight: 700; }
  
  .no { text-align: center; }
  .cat { font-weight: 700; text-align: center; }
  .subcat { background:#f7fafc; font-weight:700; text-align:center; }
  
  .bullet { margin: 2pt 0 0 16pt; padding: 0; }
  .bullet li { margin: 0 0 2pt 0; }
  .para { margin: 0; white-space: pre-wrap; }
  .muted { color:#6b7280; }
  .right { text-align:right; font-size:9.5pt; margin-top:8mm; color:#6b7280; }
</style>
</head>
<body>
  <div class="page">
    <h1>식약처 제출용 AIBOM 인허가 기술 문서</h1>
    <div class="meta"><b>모델명:</b> ${esc(meta?.modelName || "-")}
      &nbsp;|&nbsp; <b>버전:</b> ${esc(meta?.modelVersion || "-")}
      &nbsp;|&nbsp; <b>개발사:</b> ${esc(meta?.developer || "-")}</div>

    <table>
      <!-- colgroup으로 너비 강제 (18mm, 28mm) -->
      <colgroup>
        <col style="width: 12mm;"> <!-- 1. 번호 -->
        <col style="width: 18mm;"> <!-- 2. 개발 항목 (cat) -->
        <col style="width: 28mm;"> <!-- 3. 세부 항목 (subcat) -->
        <col>                <!-- 4. 주요 내용 (자동으로 나머지 모두 차지) -->
      </colgroup>
    
      <thead>
        <tr>
          <th class="no">번호</th>
          <th colspan="2">개발 항목</th>
          <th>주요 내용</th>
        </tr>
      </thead>
      <tbody>
        <!-- 1 -->
        <tr>
          <td class="no">1</td>
          <td class="cat" colspan="2">적용 범위</td>
          <td>${toBulletsBlock(sections.scope)}</td>
        </tr>

        <!-- 2 -->
        <tr>
          <td class="no">2</td>
          <td class="cat" colspan="2">해당 의료기기 예시</td>
          <td>${toBulletsBlock(sections.examples)}</td>
        </tr>

        <!-- 3 -->
        <tr>
          <td class="no">3</td>
          <td class="cat" colspan="2">위험 관리</td>
          <td>${toBulletsBlock(sections.risk)}</td>
        </tr>

        <!-- 4 그룹 (rowspan=4) -->
        <tr>
          <td class="no" rowspan="4">4</td>
          <td class="cat" rowspan="4">신청 자료</td>
          <td class="subcat">모양 및 구조</td>
          <td>${toBulletsBlock(appSplit.principle)}</td> 
        </tr>
        <tr>
          <td class="subcat">구조 / 정보통신 체계도</td>
          <td>${toBulletsBlock(appSplit.ioStruct)}</td>
        </tr>
        <tr>
          <td class="subcat">부분품 또는 구성요소 등</td>
          <td>${toBulletsBlock(appSplit.components)}</td>
        </tr>
        <tr>
          <td class="subcat">사용 시 주의사항</td>
          <td>${toBulletsBlock(appSplit.caution)}</td>
        </tr>

        <!-- 5 그룹 (rowspan=2) -->
        <tr>
          <td class="no" rowspan="2">5</td>
          <td class="cat" rowspan="2">제출 자료</td>
          <td class="subcat">분석적 성능 검증</td>
          <td>${toBulletsBlock(perfSplit.analytic)}</td> 
        </tr>
        <tr>
          <td class="subcat">임상적 유효성 확인</td>
          <td>${toBulletsBlock(perfSplit.clinical)}</td> 
        </tr>
      </tbody>
    </table>

    <div class="right">${esc(meta?.title || "AIBOM Draft")}</div>
  </div>
</body>
</html>`;
}
// =================================================================
// (이하 동일)
// =================================================================

export async function POST(req: Request) {
  try {
    const { metadata = {}, sections = {} as Sections } = await req.json();

    if (!sections || Object.keys(sections).length === 0) {
      return new NextResponse("이 문서는 섹션 데이터가 없습니다. Generate Draft로 다시 생성해 주세요.", { status: 400 });
    }

    // 폰트(OTF/TTF 중 존재하는 것 사용)
    const fOtf = path.join(process.cwd(), "public", "fonts", "NotoSansKR-Regular.otf");
    const fTtf = path.join(process.cwd(), "public", "fonts", "NotoSansKR-Regular.ttf");
    let fontMime = "font/otf";
    let b64 = "";
    if (fs.existsSync(fOtf)) { b64 = b64Font(fOtf); fontMime = "font/otf"; }
    else if (fs.existsSync(fTtf)) { b64 = b64Font(fTtf); fontMime = "font/ttf"; }
    else {
      return new NextResponse("폰트가 없습니다. public/fonts/NotoSansKR-Regular.otf|.ttf를 넣어주세요.", { status: 500 });
    }
    const fontDataUrl = `data:${fontMime};base64,${b64}`;

    const html = htmlTemplate(metadata, sections, fontDataUrl);

    // HTML → PDF
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "12mm", left: "10mm" },
    });
    await browser.close();

    const fileName = (metadata?.title || "mfds_document").replace(/[^\w.-]+/g, "_");
    const bytes = new Uint8Array(pdfBuffer); // Buffer → Uint8Array
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
      },
    });
  } catch (e: any) {
    console.error("export-pdf error:", e);
    return NextResponse.json({ error: e?.message || "PDF 생성 실패" }, { status: 500 });
  }
}
