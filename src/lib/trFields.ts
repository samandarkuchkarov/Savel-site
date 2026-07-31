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
