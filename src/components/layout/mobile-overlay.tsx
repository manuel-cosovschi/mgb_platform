"use client";

import { useSidebar } from "./sidebar-context";

export function MobileOverlay() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  if (!mobileOpen) return null;
  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 md:hidden"
      onClick={() => setMobileOpen(false)}
    />
  );
}
