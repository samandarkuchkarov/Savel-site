const STEPS = [
  {
    n: "1",
    title: "Создайте аккаунт",
    text: "Вход через Apple или Google — за минуту, без анкет.",
  },
  {
    n: "2",
    title: "Соедините профили",
    text: "Назовите партнёру 6-значный код — аккаунты объединятся в общий профиль.",
  },
  {
    n: "3",
    title: "Растите вместе",
    text: "10 минут в неделю на чек-ап и вопросы — и вы видите динамику на графике.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how"
      style={{
        maxWidth: 1180,
        margin: "0 auto",
        padding: "clamp(48px,7vw,90px) clamp(16px,4vw,28px)",
        position: "relative",
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
        Как это работает
      </h2>
      <div style={{ position: "relative", marginTop: 44 }}>
        <div
          className="howLine"
          style={{
            position: "absolute",
            top: 26,
            left: "16%",
            right: "16%",
            borderTop: "2px dashed rgba(253,79,97,0.3)",
          }}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
            gap: 28,
            position: "relative",
          }}
        >
          {STEPS.map((s) => (
            <div key={s.n} data-reveal="1" style={{ textAlign: "center", padding: "0 8px" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#FD4F61",
                  color: "#fff",
                  fontSize: 21,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto",
                  boxShadow: "0 14px 26px -10px rgba(253,79,97,0.6)",
                  border: "5px solid #FEF8F3",
                  boxSizing: "content-box",
                }}
              >
                {s.n}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 14 }}>{s.title}</div>
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: "#8a7672",
                  lineHeight: 1.55,
                  marginTop: 7,
                }}
              >
                {s.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
