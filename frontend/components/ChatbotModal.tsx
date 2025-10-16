"use client";

import { useState, useRef, useEffect } from "react";

type ChatbotModalProps = {
  onClose: () => void;
};

export default function ChatbotModal({ onClose }: ChatbotModalProps) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    {
      role: "assistant",
      text: "안녕하세요 👋 인허가 문서 초안을 생성을 도와드리겠습니다.\n어떤 모델의 문서를 생성할까요?",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: "AI 모델 정보가 확인되었습니다. 문서를 생성 중입니다..." },
    ]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `✅ 초안이 생성되었습니다!\n\n📄 문서명: Draft-${Date.now()}\n- 버전: 1.0\n- 작성일: ${new Date().toLocaleDateString()}\n\n이 문서를 기반으로 인허가 문서를 작성할 수 있습니다.`,
        },
      ]);
    }, 1500);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      {/* ✅ 모달 전체 크기 고정 및 내부 스크롤 분리 */}
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg h-[80vh] flex flex-col overflow-hidden">
        {/* 고정 헤더 */}
        <div className="flex justify-between items-center border-b p-4 flex-shrink-0 bg-white sticky top-0 z-10">
          <h2 className="font-semibold text-lg">AI Draft Chatbot</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black transition"
          >
            ✕
          </button>
        </div>

        {/* 스크롤 가능한 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-3 py-2 rounded-2xl max-w-xs whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-black text-white rounded-br-none"
                    : "bg-white border rounded-bl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력창 (하단 고정) */}
        <div className="flex border-t p-3 gap-2 bg-white flex-shrink-0">
          <input
            className="flex-1 rounded-xl border px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300"
            placeholder="메시지를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            className="rounded-xl bg-black text-white px-4 py-2 hover:bg-gray-800 transition"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
