// lib/chatbot.ts
import OpenAI from "openai";

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

const MODEL = "gpt-4o-mini"; // 나중에 쉽게 교체
const TEMPERATURE = 0.3;

function getClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

/** 기본 챗 완성 호출 (지금은 프록시 용도, 나중에 프롬프트 고도화 자리) */
export async function chatCompletion(messages: ChatMsg[]) {
  const client = getClient();
  const res = await client.chat.completions.create({
    model: MODEL,
    temperature: TEMPERATURE,
    messages,
  });
  return res.choices[0]?.message?.content ?? "";
}

/** (예시) 나중에 프롬프팅 고도화할 때 쓸 시스템 프롬프트 래퍼 */
export function withSystemPrompt(userMessages: ChatMsg[], systemContent: string): ChatMsg[] {
  return [{ role: "system", content: systemContent }, ...userMessages];
}