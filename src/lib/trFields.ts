/**
 * Переводы (uz/en) из формы админки в тело запроса к API.
 *
 * `trFields(formData, 'title')` → `{ titleUz, titleEn }` — ровно те имена, что
 * ждёт админ-API. Пустое поле уходит пустой строкой ОСОЗНАННО: для API это
 * «перевода нет», и колонка чистится. Пропустить поле нельзя — тогда старый
 * перевод остался бы, и очистить его из админки стало бы невозможно.
 */
export function trFields(formData: FormData, ...names: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of names) {
    for (const suffix of ['Uz', 'En']) {
      out[name + suffix] = String(formData.get(name + suffix) ?? '').trim();
    }
  }
  return out;
}

/**
 * Ссылки эксперта из формы: строки `linkKind0/linkUrl0/linkLabel0`, `…1`, …
 *
 * Форма показывает фиксированное число строк, часть из них пустая. Пустой адрес
 * означает «строки нет» — иначе каждое сохранение добавляло бы эксперту пяток
 * ссылок в никуда. Порядок строк в форме = порядок на экране.
 */
export function expertLinks(formData: FormData): { kind: string; url: string; label: string }[] {
  const links: { kind: string; url: string; label: string }[] = [];
  for (let i = 0; ; i += 1) {
    if (!formData.has(`linkUrl${i}`)) break;
    const url = String(formData.get(`linkUrl${i}`) ?? '').trim();
    if (!url) continue;
    links.push({
      kind: String(formData.get(`linkKind${i}`) ?? 'other'),
      url,
      label: String(formData.get(`linkLabel${i}`) ?? '').trim(),
    });
  }
  return links;
}
