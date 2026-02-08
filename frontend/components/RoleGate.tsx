// frontend/components/RoleGate.tsx
"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Role = "developer" | "regulator" | "supervisor";

type Props = {
  allow: Role[];                // 허용된 역할
  children: ReactNode;          // 콘텐츠
  redirectTo?: string;          // 권한 없을 때 이동
  fallback?: ReactNode;         // 권한 없을 때 대체 UI
  enablePreviewParam?: boolean; // ?as=developer 허용 여부
  previewParamName?: string;    // 기본 "as"
};

// ✅ 쿠키 읽기
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const found = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.split("=")[1]) : null;
}

export default function RoleGate({
  allow,
  children,
  redirectTo = "/login",
  fallback,
  enablePreviewParam = true,
  previewParamName = "as",
}: Props) {
  const router = useRouter();
  const search = useSearchParams();

  const [ready, setReady] = useState(false);
  const [isAllowed, setIsAllowed] = useState<boolean>(false);

  // 1️⃣ URL 프리뷰 파라미터 (?as=developer)
  const previewRole = useMemo(() => {
    if (!enablePreviewParam) return null;
    const v = search.get(previewParamName);
    if (!v) return null;
    const low = v.toLowerCase();
    return (["developer", "regulator", "supervisor"].includes(low)
      ? low
      : null) as Role | null;
  }, [search, enablePreviewParam, previewParamName]);

  // 2️⃣ 쿠키 / localStorage / JWT 기반 역할 판정
  useEffect(() => {
    let role: Role | null = null;

    // ✅ 강제 통과 모드: JWT만 있으면 allow[0]으로 인정
    const token = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
    if (token && !role) {
      role = allow[0]; // 예: developer 페이지에서는 developer
    }

    // 🔹 프리뷰 파라미터 우선
    if (previewRole) {
      role = previewRole;
    } else {
      // 🔹 쿠키 확인
      const cookieRole = getCookie("role");
      if (cookieRole && ["developer", "regulator", "supervisor"].includes(cookieRole)) {
        role = cookieRole as Role;
      } else if (typeof window !== "undefined") {
        // 🔹 localStorage 확인
        const ls = localStorage.getItem("role");
        if (ls && ["developer", "regulator", "supervisor"].includes(ls)) {
          role = ls as Role;
        }
      }
    }

    // 판정 및 상태 설정
    const ok = !!role && allow.includes(role as Role);
    setIsAllowed(ok);
    setReady(true);

    // 권한 없고 fallback이 없으면 로그인으로 리다이렉트
    if (!ok && !fallback) {
      router.replace(redirectTo);
    }
  }, [allow, previewRole, redirectTo, fallback, router]);

  // 로딩 중
  if (!ready) {
    return <div className="p-6 text-sm text-gray-600">🔍 권한 확인 중…</div>;
  }

  // 권한 없음
  if (!isAllowed) {
    return (
      fallback ?? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="text-lg font-semibold text-gray-800">
            🚫 접근 권한이 없습니다.
          </div>
          <p className="mt-2 text-sm text-gray-600">로그인 후 다시 시도해주세요.</p>
          <a href={redirectTo} className="mt-3 rounded-xl border px-4 py-2">
            로그인으로 이동
          </a>
        </div>
      )
    );
  }

  // ✅ 통과
  return <>{children}</>;
}
