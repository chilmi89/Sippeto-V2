"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2 jam tanpa aktivitas

export default function SessionGuard({
  children,
}: {
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const logout = () => {
      // biome-ignore lint/suspicious/noDocumentCookie: standard cookie clearing
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      // biome-ignore lint/suspicious/noDocumentCookie: standard cookie clearing
      document.cookie =
        "role_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      // biome-ignore lint/suspicious/noDocumentCookie: standard cookie clearing
      document.cookie =
        "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      router.push("/login");
    };

    const resetInactivity = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(logout, INACTIVITY_TIMEOUT);
    };

    const events = [
      "mousedown",
      "mousemove",
      "click",
      "scroll",
      "keydown",
      "touchstart",
      "wheel",
    ];
    const onActivity = () => resetInactivity();
    for (const event of events) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    resetInactivity();

    return () => {
      for (const event of events) {
        window.removeEventListener(event, onActivity);
      }
      if (timer.current) clearTimeout(timer.current);
    };
  }, [router]);

  return <>{children}</>;
}
