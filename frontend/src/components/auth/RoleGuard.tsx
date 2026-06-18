"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRoleFromCookie, hasAccess } from "@/lib/auth/roleGuard";

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const role = getRoleFromCookie();
    if (!hasAccess(pathname, role)) {
      router.replace("/unauthorized");
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  if (!checked) return null;

  return <>{children}</>;
}
