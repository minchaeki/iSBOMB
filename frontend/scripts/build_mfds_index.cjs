require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");  // ✅ 안정 버전에서는 함수로 옴
const OpenAI = require("openai");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const pdfPath = path.join(process.cwd(), "data", "mfds_guideline.pdf");
const outPath = path.join(process.cwd(), "data", "mfds_index.json");

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] ** 2;
    nb += b[i] ** 2;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function chunkText(text) {
  const raw = text.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  const maxLen = 1600;
  const chunks = [];
  for (const r of raw) {
    if (r.length <= maxLen) chunks.push(r);
    else for (let i = 0; i < r.length; i += maxLen) chunks.push(r.slice(i, i + maxLen));
  }
  return chunks.map((c, i) => ({
    id: `mfds-${i}`,
    title: c.split("\n")[0]?.slice(0, 60) || `section-${i}`,
    chunk: c,
  }));
}

async function main() {
  console.log("📄 Loading PDF:", pdfPath);
  const buf = fs.readFileSync(pdfPath);

  // ✅ 안정 버전에서는 바로 함수 호출
  const { text } = await pdfParse(buf);

  const chunks = chunkText(text);
  console.log("✂️  Chunks:", chunks.length);

  const result = [];
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const emb = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: c.chunk,
    });
    result.push({ ...c, embedding: emb.data[0].embedding });
    if ((i + 1) % 10 === 0) console.log(`... embedded ${i + 1}/${chunks.length}`);
  }

  fs.writeFileSync(outPath, JSON.stringify(result));
  console.log("✅ Wrote index:", outPath, "items:", result.length);

  // quick check
  const q = "성능 검증(AUC, 민감도, 특이도 등) 관련 요구사항 요약";
  const qe = await client.embeddings.create({ model: "text-embedding-3-small", input: q });
  const qv = qe.data[0].embedding;

  const scored = result
    .map(r => ({ ...r, score: cosine(qv, r.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  console.log("🔎 quick check:", scored.map(s => ({ id: s.id, score: s.score.toFixed(3), title: s.title })));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});