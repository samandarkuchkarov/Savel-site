// Реестр юридических документов. Один источник для страниц, футера и /legal.
export type LegalDoc = { slug: string; title: string; description: string; updated: string };

export const LEGAL_DOCS: LegalDoc[] = [
  { slug: "privacy", title: "Политика конфиденциальности", description: "Как ISAVEL собирает, использует, хранит и удаляет персональные данные.", updated: "2 сентября 2026" },
  { slug: "terms", title: "Условия использования", description: "Правила использования платформы ISAVEL.", updated: "2 сентября 2026" },
  { slug: "offer", title: "Публичная оферта", description: "Условия договора между ISAVEL и пользователем.", updated: "2 сентября 2026" },
  { slug: "ai", title: "Политика использования ИИ", description: "Как в ISAVEL применяется искусственный интеллект и где его границы.", updated: "2 сентября 2026" },
];
