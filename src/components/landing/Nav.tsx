"use client";

import { useState } from "react";
import { APK_URL, APK_FILENAME } from "@/lib/appDownload";

const NAV_LINKS = [
  { href: "#features", label: "Возможности" },
  { href: "#showcase", label: "Продукт" },
  { href: "#how", label: "Как это работает" },
  { href: "#reviews", label: "Отзывы" },
];

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "rgba(254,248,243,0.86)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(60,40,40,0.06)",
        animation: "savelNavIn 0.6s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "14px clamp(16px,4vw,28px)",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <a
          href="#"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginRight: "auto",
            textDecoration: "none",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/savel-mark.png" alt="Savel" style={{ height: 28, width: "auto" }} />
          <span
            style={{ fontWeight: 800, fontSize: 21, color: "#FD4F61", letterSpacing: "0.2px" }}
          >
            Savel
          </span>
        </a>

        <div
          className="navLinks"
          style={{ display: "flex", alignItems: "center", gap: "clamp(16px,2.5vw,28px)" }}
        >
          {NAV_LINKS.map((l) => (
            <a key={l.href} className="navLink" href={l.href}>
              {l.label}
            </a>
          ))}
        </div>

        <a className="navCta" href={APK_URL} download={APK_FILENAME}>
          Скачать
        </a>

        <button
          className="hamb"
          aria-label="Меню"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            width: 42,
            height: 42,
            border: "none",
            borderRadius: 12,
            background: "#fff",
            boxShadow: "0 8px 18px -12px rgba(230,90,114,0.5)",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexDirection: "column",
            gap: 4.5,
          }}
        >
          <span style={{ width: 18, height: 2.4, borderRadius: 2, background: "#3B2C2A", display: "block" }} />
          <span style={{ width: 18, height: 2.4, borderRadius: 2, background: "#3B2C2A", display: "block" }} />
          <span style={{ width: 11, height: 2.4, borderRadius: 2, background: "#FD4F61", display: "block" }} />
        </button>
      </div>

      {menuOpen && (
        <div className="mobileMenu">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                textDecoration: "none",
                color: "#3B2C2A",
                fontWeight: 800,
                fontSize: 17,
                padding: "13px 15px",
                borderRadius: 14,
                background: "#fff",
                boxShadow: "0 10px 22px -18px rgba(230,90,114,0.5)",
              }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
