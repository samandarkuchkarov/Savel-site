const REVIEWS = [
  {
    text: "«Чек-ап стал нашим воскресным ритуалом. Раньше копили обиды неделями — теперь проговариваем за десять минут.»",
    initial: "А",
    bg: "rgba(253,79,97,0.14)",
    color: "#FD4F61",
    name: "Алина и Марк",
    meta: "вместе 3 года",
  },
  {
    text: "«ИИ подсказал, что мы по-разному понимаем „провести время вместе“. Один разговор — и половина споров исчезла.»",
    initial: "Д",
    bg: "rgba(232,113,138,0.16)",
    color: "#E8718A",
    name: "Дана и Тимур",
    meta: "женаты 5 лет",
  },
  {
    text: "«Серия „киновечер — 8 недель подряд“ держит нас лучше любых обещаний. Не хочется её прерывать.»",
    initial: "С",
    bg: "rgba(253,79,97,0.14)",
    color: "#FD4F61",
    name: "София и Ян",
    meta: "вместе 1,5 года",
  },
];

export default function Reviews() {
  return (
    <section
      id="reviews"
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
        Пары о Savel
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 18,
          marginTop: 38,
        }}
      >
        {REVIEWS.map((r) => (
          <div
            key={r.name}
            data-tilt="1"
            data-reveal="1"
            style={{
              background: "#fff",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 22px 44px -28px rgba(230,90,114,0.55)",
              display: "flex",
              flexDirection: "column",
              willChange: "transform",
            }}
          >
            <span style={{ color: "#FD4F61", letterSpacing: "2px", fontSize: 14 }}>★★★★★</span>
            <p
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#5a4a47",
                lineHeight: 1.6,
                margin: "12px 0 0",
              }}
            >
              {r.text}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                marginTop: "auto",
                paddingTop: 18,
              }}
            >
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: r.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 900,
                  color: r.color,
                }}
              >
                {r.initial}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{r.name}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#A6938E" }}>{r.meta}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
