"use client";

import { useState } from "react";

type Tab = "pulse" | "chat" | "boost";

const paneBase: React.CSSProperties = {
  background: "#FEF8F3",
  border: "1.5px solid #F3DDD6",
  borderRadius: 34,
  padding: "26px 22px",
  height: "100%",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 30px 60px -34px rgba(230,90,114,0.55)",
};

export default function Showcase() {
  const [tab, setTab] = useState<Tab>("pulse");
  const cls = (t: Tab) => `pane${tab === t ? " active" : ""}`;

  return (
    <section id="showcase" style={{ background: "#fff" }}>
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(48px,7vw,90px) clamp(16px,4vw,28px)",
        }}
      >
        <h2
          data-reveal="1"
          style={{
            fontSize: "clamp(26px,3.4vw,40px)",
            fontWeight: 900,
            letterSpacing: "-0.5px",
            margin: 0,
            textAlign: "center",
          }}
        >
          Посмотрите, как это устроено
        </h2>

        <div
          data-reveal="1"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 10,
            flexWrap: "wrap",
            marginTop: 26,
          }}
        >
          <button className={`tabBtn${tab === "pulse" ? " active" : ""}`} onClick={() => setTab("pulse")}>
            Пульс
          </button>
          <button className={`tabBtn${tab === "chat" ? " active" : ""}`} onClick={() => setTab("chat")}>
            Чат с ИИ
          </button>
          <button className={`tabBtn${tab === "boost" ? " active" : ""}`} onClick={() => setTab("boost")}>
            Буст
          </button>
        </div>

        <div
          data-reveal="1"
          style={{ position: "relative", maxWidth: 400, height: 490, margin: "30px auto 0" }}
        >
          {/* ── Пульс ─────────────────────────────────────── */}
          <div className={cls("pulse")}>
            <div style={{ ...paneBase, alignItems: "center" }}>
              <span style={{ alignSelf: "flex-start", fontSize: 18, fontWeight: 800 }}>Пульс</span>
              <div style={{ position: "relative", width: 158, height: 158, marginTop: 20 }}>
                <svg width="158" height="158" viewBox="0 0 150 150">
                  <circle cx="75" cy="75" r="60" fill="none" stroke="rgba(253,79,97,0.15)" strokeWidth="13" />
                  <circle
                    cx="75"
                    cy="75"
                    r="60"
                    fill="none"
                    stroke="#FD4F61"
                    strokeWidth="13"
                    strokeLinecap="round"
                    strokeDasharray="309 380"
                    transform="rotate(-90 75 75)"
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 42, fontWeight: 900, lineHeight: 1 }}>82</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#2FBE7E" }}>▲ +4 за неделю</span>
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#A6938E",
                  textTransform: "uppercase",
                  letterSpacing: "0.7px",
                  marginTop: 10,
                }}
              >
                Индекс отношений
              </span>
              <div
                style={{
                  width: "100%",
                  marginTop: 18,
                  background: "#fff",
                  borderRadius: 16,
                  padding: "13px 15px",
                  boxShadow: "0 14px 30px -20px rgba(230,90,114,0.55)",
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/pulse.png" alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 800 }}>Чек-ап отношений</span>
                <span
                  style={{
                    background: "#FD4F61",
                    color: "#fff",
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: "7px 12px",
                    borderRadius: 10,
                  }}
                >
                  Начать
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  marginTop: 10,
                  background: "rgba(253,79,97,0.07)",
                  borderRadius: 16,
                  padding: "13px 15px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#5a4a47",
                  lineHeight: 1.5,
                  boxSizing: "border-box",
                }}
              >
                Ответы откроются, когда ответите вы оба — это честнее.
              </div>
            </div>
          </div>

          {/* ── Чат с ИИ ──────────────────────────────────── */}
          <div className={cls("chat")}>
            <div style={paneBase}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>Чат</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#FD4F61",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "8px 14px",
                    borderRadius: 999,
                  }}
                >
                  ✦ Анализ ИИ
                </span>
              </div>
              <div
                style={{
                  alignSelf: "flex-start",
                  maxWidth: "85%",
                  background: "#fff",
                  borderRadius: "16px 16px 16px 5px",
                  padding: "11px 14px",
                  marginTop: 18,
                  boxShadow: "0 10px 24px -18px rgba(230,90,114,0.5)",
                  fontSize: 13.5,
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                Давай обсудим отпуск этим летом?
              </div>
              <div
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "85%",
                  background: "#FD4F61",
                  color: "#fff",
                  borderRadius: "16px 16px 5px 16px",
                  padding: "11px 14px",
                  marginTop: 10,
                  fontSize: 13.5,
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                Давай! Я мечтаю о море.
              </div>
              <div
                style={{
                  background: "#fff",
                  border: "1.5px solid rgba(253,79,97,0.28)",
                  borderRadius: 16,
                  padding: "13px 15px",
                  marginTop: 14,
                }}
              >
                <div
                  style={{
                    color: "#FD4F61",
                    fontWeight: 800,
                    fontSize: 11,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  ✦ Анализ ИИ
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#5a4a47", lineHeight: 1.5, marginTop: 6 }}>
                  Вы оба открыто делитесь желаниями. Совет: заранее обсудите бюджет поездки —
                  планирование пройдёт без стресса.
                </div>
              </div>
              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 9 }}>
                <span
                  style={{
                    flex: 1,
                    background: "#fff",
                    border: "1.5px solid #EFE3DE",
                    borderRadius: 999,
                    padding: "12px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#BBA9A3",
                  }}
                >
                  Сообщение…
                </span>
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "#FD4F61",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 18.5V5.8M5.9 11.9L12 5.8l6.1 6.1"
                      stroke="#fff"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* ── Буст ──────────────────────────────────────── */}
          <div className={cls("boost")}>
            <div style={paneBase}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>Буст отношений</span>
              <div
                style={{
                  borderRadius: 20,
                  padding: 16,
                  background: "linear-gradient(135deg,#FD4F61,#F3899C)",
                  marginTop: 16,
                  boxShadow: "0 16px 34px -16px rgba(253,79,97,0.55)",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    background: "rgba(255,255,255,0.22)",
                    color: "#fff",
                    fontSize: 10.5,
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    borderRadius: 999,
                  }}
                >
                  Челлендж
                </span>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", marginTop: 8 }}>
                  Вечер без телефонов
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.85)",
                    marginTop: 3,
                  }}
                >
                  Сегодня, 19:00 · ждёт подтверждения
                </div>
              </div>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  padding: "14px 15px",
                  marginTop: 12,
                  boxShadow: "0 14px 30px -22px rgba(230,90,114,0.5)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800 }}>Пятничный киновечер</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#A6938E", marginTop: 1 }}>
                    Традиция · каждую пятницу
                  </div>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    background: "rgba(253,79,97,0.10)",
                    color: "#FD4F61",
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: "5px 11px",
                    borderRadius: 999,
                  }}
                >
                  серия · 6 нед
                </span>
              </div>
              <div
                style={{
                  background: "#fff",
                  borderRadius: 18,
                  padding: "14px 15px",
                  marginTop: 10,
                  boxShadow: "0 14px 30px -22px rgba(230,90,114,0.5)",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800 }}>Пикник на закате</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#A6938E", marginTop: 1 }}>
                    Свидание · суббота, 19:30
                  </div>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    background: "rgba(47,190,126,0.12)",
                    color: "#1F9962",
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: "5px 11px",
                    borderRadius: 999,
                  }}
                >
                  принято
                </span>
              </div>
              <div
                style={{
                  marginTop: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  border: "2px dashed rgba(253,79,97,0.35)",
                  borderRadius: 16,
                  padding: 13,
                  color: "#FD4F61",
                  fontSize: 14,
                  fontWeight: 800,
                }}
              >
                ＋ Новая активность
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
