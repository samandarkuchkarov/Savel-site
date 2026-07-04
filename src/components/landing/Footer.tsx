const HEART =
  "M12 20.5l-1.4-1.3C5.4 14.3 2 11.2 2 7.4 2 4.4 4.4 2 7.4 2c1.7 0 3.3.8 4.6 2.1C13.3 2.8 14.9 2 16.6 2 19.6 2 22 4.4 22 7.4c0 3.8-3.4 6.9-8.6 11.8L12 20.5z";

const linkStyle = {
  textDecoration: "none",
  color: "rgba(255,255,255,0.85)",
  fontWeight: 700,
  fontSize: 14.5,
} as const;

const colTitle = {
  fontSize: 12.5,
  fontWeight: 800,
  color: "rgba(255,255,255,0.45)",
  textTransform: "uppercase",
  letterSpacing: "0.7px",
} as const;

export default function Footer() {
  return (
    <footer style={{ background: "#3B2C2A" }}>
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(36px,5vw,56px) clamp(16px,4vw,28px) 28px",
          display: "flex",
          gap: "clamp(26px,5vw,64px)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "2 1 240px", minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/savel-mark.png" alt="" style={{ height: 26, width: "auto" }} />
            <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>Savel</span>
          </div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
              margin: "14px 0 0",
              maxWidth: 300,
            }}
          >
            Приложение для пар, которые хотят понимать друг друга глубже. 10 минут в неделю.
          </p>
        </div>

        <div style={{ flex: "1 1 150px" }}>
          <div style={colTitle}>Продукт</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            <a className="footerLink" href="#features" style={linkStyle}>
              Возможности
            </a>
            <a className="footerLink" href="#showcase" style={linkStyle}>
              Продукт
            </a>
            <a className="footerLink" href="#how" style={linkStyle}>
              Как это работает
            </a>
          </div>
        </div>

        <div style={{ flex: "1 1 150px" }}>
          <div style={colTitle}>Поддержка</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            <a className="footerLink" href="mailto:support@savel.love" style={linkStyle}>
              support@savel.love
            </a>
            <a className="footerLink" href="#" style={linkStyle}>
              Конфиденциальность
            </a>
            <a className="footerLink" href="#" style={linkStyle}>
              Условия
            </a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 clamp(16px,4vw,28px) 26px" }}>
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 18,
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>
            © 2026 Savel. Все права защищены.
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(255,255,255,0.55)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#F3899C">
              <path d={HEART} />
            </svg>
            Сделано для пар во всём мире
          </span>
        </div>
      </div>
    </footer>
  );
}
