const HEART =
  "M12 20.5l-1.4-1.3C5.4 14.3 2 11.2 2 7.4 2 4.4 4.4 2 7.4 2c1.7 0 3.3.8 4.6 2.1C13.3 2.8 14.9 2 16.6 2 19.6 2 22 4.4 22 7.4c0 3.8-3.4 6.9-8.6 11.8L12 20.5z";

const stores = [
  { icon: "/assets/apple.png", small: "Загрузите в", big: "App Store" },
  { icon: "/assets/google.png", small: "Скачайте в", big: "Google Play" },
];

export default function CTA() {
  return (
    <section
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "0 clamp(16px,4vw,28px) clamp(48px,7vw,90px)",
      }}
    >
      <div
        data-reveal="1"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg,#FD4F61,#F3899C)",
          borderRadius: 32,
          padding: "clamp(34px,5vw,60px) clamp(22px,4vw,56px)",
          display: "flex",
          alignItems: "center",
          gap: 26,
          flexWrap: "wrap",
          boxShadow: "0 30px 60px -26px rgba(253,79,97,0.6)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            pointerEvents: "none",
          }}
        />
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="rgba(255,255,255,0.35)"
          style={{
            position: "absolute",
            bottom: "14%",
            left: "6%",
            animation: "savelFloat 5s ease-in-out infinite",
          }}
        >
          <path d={HEART} />
        </svg>
        <div style={{ flex: "1 1 300px", position: "relative" }}>
          <div
            style={{
              fontSize: "clamp(24px,3vw,36px)",
              fontWeight: 900,
              color: "#fff",
              letterSpacing: "-0.4px",
            }}
          >
            Первый чек-ап — сегодня вечером
          </div>
          <div
            style={{
              fontSize: 15.5,
              fontWeight: 600,
              color: "rgba(255,255,255,0.88)",
              marginTop: 10,
              lineHeight: 1.55,
              maxWidth: 470,
            }}
          >
            Скачайте Savel, назовите партнёру код — и узнайте, как вы оба на самом деле
            чувствуете эту неделю.
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", position: "relative" }}>
          {stores.map((s) => (
            <a
              key={s.big}
              href="#"
              data-magnet="1"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 11,
                background: "#1B1B1F",
                borderRadius: 15,
                padding: "11px 20px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.icon} alt="" style={{ height: 24, width: "auto" }} />
              <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                <span
                  style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}
                >
                  {s.small}
                </span>
                <span style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{s.big}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
