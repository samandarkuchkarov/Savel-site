const FEATURES = [
  {
    icon: "/assets/pulse.png",
    size: 30,
    title: "Пульс",
    text: "Еженедельный чек-ап из 9 вопросов. Ответы открываются, только когда ответили оба, — честно и без подглядываний.",
  },
  {
    icon: "/assets/ai_chat.png",
    size: 28,
    title: "Чат с ИИ",
    text: "Консультант, который помнит ваши чек-апы и ответы. Помогает сформулировать сложное — до того, как оно станет ссорой.",
  },
  {
    icon: "/assets/boost.png",
    size: 29,
    title: "Буст отношений",
    text: "Челленджи, свидания и традиции, которые вы подтверждаете вдвоём. Серия «6 недель подряд» мотивирует лучше напоминаний.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
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
        Всё для вашей пары — в одном месте
      </h2>
      <p
        data-reveal="1"
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#8a7672",
          margin: "14px auto 0",
          maxWidth: 520,
          textAlign: "center",
          lineHeight: 1.55,
        }}
      >
        Три инструмента, которые превращают заботу об отношениях в привычку.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: 18,
          marginTop: 38,
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            data-tilt="1"
            data-reveal="1"
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: "26px 24px",
              boxShadow: "0 22px 44px -28px rgba(230,90,114,0.55)",
              willChange: "transform",
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: "rgba(253,79,97,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.icon}
                alt=""
                style={{ width: f.size, height: f.size, objectFit: "contain" }}
              />
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>
              {f.title}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#8a7672",
                lineHeight: 1.55,
                marginTop: 8,
              }}
            >
              {f.text}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
