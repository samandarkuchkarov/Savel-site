import { Fragment } from "react";

const HEART =
  "M12 20.5l-1.4-1.3C5.4 14.3 2 11.2 2 7.4 2 4.4 4.4 2 7.4 2c1.7 0 3.3.8 4.6 2.1C13.3 2.8 14.9 2 16.6 2 19.6 2 22 4.4 22 7.4c0 3.8-3.4 6.9-8.6 11.8L12 20.5z";

const HERO_WORDS: { t: string; delay: string; color?: string }[] = [
  { t: "Крепкие", delay: "0.15s" },
  { t: "отношения —", delay: "0.26s" },
  { t: "это", delay: "0.37s" },
  { t: "10 минут", delay: "0.48s", color: "#FD4F61" },
  { t: "в", delay: "0.59s" },
  { t: "неделю", delay: "0.68s" },
];

export default function Hero() {
  return (
    <section style={{ position: "relative" }}>
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(30px,5vw,70px) clamp(16px,4vw,28px) clamp(56px,7vw,96px)",
          display: "flex",
          alignItems: "center",
          gap: "clamp(28px,5vw,64px)",
          flexWrap: "wrap",
        }}
      >
        {/* ── copy ─────────────────────────────────────────── */}
        <div style={{ flex: "1 1 360px", minWidth: 290 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(253,79,97,0.10)",
              color: "#FD4F61",
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              padding: "8px 15px",
              borderRadius: 999,
              animation: "savelFadeUp 0.6s ease 0.1s both",
            }}
          >
            ♥ Приложение для двоих
          </span>

          <h1
            style={{
              fontSize: "clamp(34px,4.8vw,58px)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.8px",
              margin: "18px 0 0",
              perspective: "600px",
            }}
          >
            {HERO_WORDS.map((w, i) => (
              <Fragment key={i}>
                <span
                  style={{
                    display: "inline-block",
                    color: w.color,
                    animation: `savelWordIn 0.65s cubic-bezier(0.22,1,0.36,1) ${w.delay} both`,
                  }}
                >
                  {w.t}
                </span>
                {i < HERO_WORDS.length - 1 ? " " : ""}
              </Fragment>
            ))}
          </h1>

          <p
            style={{
              fontSize: "clamp(16px,1.6vw,19px)",
              lineHeight: 1.6,
              color: "#8a7672",
              fontWeight: 600,
              margin: "18px 0 0",
              maxWidth: 540,
              animation: "savelFadeUp 0.7s ease 0.8s both",
            }}
          >
            Savel помогает парам говорить о важном регулярно: еженедельный чек-ап, вопросы для
            двоих и ИИ-консультант, который знает контекст именно ваших отношений.
          </p>

          <div
            id="download"
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 28,
              animation: "savelFadeUp 0.7s ease 0.95s both",
            }}
          >
            <a
              href="#"
              data-magnet="1"
              style={{
                position: "relative",
                overflow: "hidden",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#FD4F61",
                color: "#fff",
                fontWeight: 800,
                fontSize: 16,
                padding: "15px 26px",
                borderRadius: 16,
                boxShadow: "0 16px 30px -12px rgba(253,79,97,0.65)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: "40%",
                  left: "-60%",
                  background:
                    "linear-gradient(105deg,transparent,rgba(255,255,255,0.35),transparent)",
                  animation: "savelSweep 3.6s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
              Скачать бесплатно
            </a>
            <a
              className="btnOutline"
              href="#how"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                background: "#fff",
                color: "#3B2C2A",
                fontWeight: 800,
                fontSize: 16,
                padding: "15px 24px",
                borderRadius: 16,
                border: "1.5px solid #EFE3DE",
              }}
            >
              Как это работает
            </a>
          </div>
        </div>

        {/* ── hero visual ──────────────────────────────────── */}
        <div
          data-hero-area="1"
          style={{
            flex: "1 1 300px",
            minWidth: 280,
            display: "flex",
            justifyContent: "center",
            position: "relative",
            perspective: "1100px",
            padding: "30px 0",
            animation: "savelFadeUp 0.9s ease 0.5s both",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "min(400px,90%)",
              aspectRatio: "1",
              borderRadius: "50%",
              background: "radial-gradient(circle,rgba(253,79,97,0.14),transparent 68%)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: "min(430px,96%)",
              aspectRatio: "1",
              borderRadius: "50%",
              border: "2px dashed rgba(253,79,97,0.28)",
              animation: "savelSpin 36s linear infinite",
              pointerEvents: "none",
            }}
          />
          <div
            className="orb"
            data-orb="0.06"
            style={{
              position: "absolute",
              top: "-3%",
              right: "-2%",
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: "radial-gradient(circle,rgba(243,137,156,0.5),rgba(243,137,156,0))",
              filter: "blur(2px)",
              animation: "savelOrb 7s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
          <div
            className="orb"
            data-orb="-0.09"
            style={{
              position: "absolute",
              bottom: "-2%",
              right: "14%",
              width: 70,
              height: 70,
              borderRadius: "50%",
              background: "radial-gradient(circle,rgba(253,79,97,0.35),rgba(253,79,97,0))",
              animation: "savelOrb 9s ease-in-out infinite 1.2s",
              pointerEvents: "none",
            }}
          />
          <svg
            data-depth="26"
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="rgba(253,79,97,0.30)"
            style={{ position: "absolute", top: "5%", left: "6%", pointerEvents: "none" }}
          >
            <path d={HEART} />
          </svg>
          <svg
            data-depth="14"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="rgba(243,137,156,0.45)"
            style={{ position: "absolute", top: "16%", right: "5%", pointerEvents: "none" }}
          >
            <path d={HEART} />
          </svg>
          <div
            data-depth="20"
            style={{
              position: "absolute",
              bottom: "8%",
              right: "-3%",
              zIndex: 5,
              background: "#fff",
              borderRadius: 14,
              padding: "9px 13px",
              boxShadow: "0 16px 32px -16px rgba(230,90,114,0.55)",
              display: "flex",
              alignItems: "center",
              gap: 7,
              animation: "savelFloat 6s ease-in-out infinite 1.4s",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: "#2FBE7E" }}>▲ Индекс +4</span>
          </div>

          <div
            data-hero-tilt="1"
            style={{
              position: "relative",
              transformStyle: "preserve-3d",
              willChange: "transform",
              animation: "savelSway 10s ease-in-out infinite",
            }}
          >
            <div
              style={{
                width: "min(290px,78vw)",
                borderRadius: 46,
                background: "#fff",
                boxShadow: "0 40px 80px -30px rgba(230,90,114,0.5)",
                padding: 12,
                animation: "savelFloat 6s ease-in-out infinite",
                transformStyle: "preserve-3d",
              }}
            >
              <div
                style={{
                  background: "#FEF8F3",
                  borderRadius: 36,
                  padding: "26px 20px 20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: 19, fontWeight: 800 }}>Пульс</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/savel-mark.png" alt="" style={{ height: 20, width: "auto" }} />
                </div>
                <div
                  style={{
                    position: "relative",
                    width: 150,
                    height: 150,
                    marginTop: 18,
                    transform: "translateZ(34px)",
                  }}
                >
                  <svg width="150" height="150" viewBox="0 0 150 150">
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
                    <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>82</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#2FBE7E" }}>
                      ▲ +4 за неделю
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#A6938E",
                    textTransform: "uppercase",
                    letterSpacing: "0.7px",
                    marginTop: 8,
                  }}
                >
                  Индекс отношений
                </span>
                <div
                  style={{
                    width: "100%",
                    marginTop: 16,
                    background: "#fff",
                    borderRadius: 16,
                    padding: "12px 14px",
                    boxShadow: "0 14px 30px -20px rgba(230,90,114,0.55)",
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    transform: "translateZ(48px)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/pulse.png" alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 800 }}>Чек-ап отношений</span>
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          animation: "savelFadeUp 0.7s ease 1.4s both",
        }}
      >
        <span
          style={{
            width: 24,
            height: 38,
            borderRadius: 999,
            border: "2px solid rgba(60,40,40,0.18)",
            display: "flex",
            justifyContent: "center",
            paddingTop: 7,
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              width: 4,
              height: 8,
              borderRadius: 999,
              background: "#FD4F61",
              animation: "savelScrollDot 1.8s ease-in-out infinite",
            }}
          />
        </span>
      </div>
    </section>
  );
}
