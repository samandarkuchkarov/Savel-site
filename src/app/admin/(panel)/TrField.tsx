/**
 * Поле контента на трёх языках.
 *
 * Русский — основной: его показывает приложение, он обязателен. Узбекский и
 * английский необязательны — пустое поле значит «перевода нет», и клиент
 * откатится на русский. Языки стоят В РЯД, а не тремя отдельными полями:
 * перевод правится только при виде оригинала, иначе смысл теряется.
 *
 * Имена полей формы выводятся из базового: `title` → title / titleUz / titleEn
 * — ровно так их ждёт админ-API.
 */

type Props = {
  /** Не задан — поле идёт без подписи (компактные строки вроде списка чек-апа). */
  label?: string;
  /** Базовое имя поля формы (русский вариант). */
  name: string;
  ru?: string | null;
  uz?: string | null;
  en?: string | null;
  required?: boolean;
  placeholder?: string;
  /** Многострочное поле (варианты ответов — по строке на вариант). */
  textarea?: boolean;
  rows?: number;
  hint?: string;
};

const LANGS = [
  { code: 'ru', suffix: '', label: 'RU' },
  { code: 'uz', suffix: 'Uz', label: 'UZ' },
  { code: 'en', suffix: 'En', label: 'EN' },
] as const;

export default function TrField({
  label,
  name,
  ru,
  uz,
  en,
  required,
  placeholder,
  textarea,
  rows = 3,
  hint,
}: Props) {
  const values: Record<string, string> = { ru: ru ?? '', uz: uz ?? '', en: en ?? '' };

  return (
    <div className="trField">
      {label ? <span className="trFieldLabel">{label}</span> : null}
      <div className="trFieldGrid">
        {LANGS.map(lang => (
          <div className="trCell" key={lang.code}>
            <span className={`trLang${lang.code === 'ru' ? ' trLangMain' : ''}`}>{lang.label}</span>
            {textarea ? (
              <textarea
                name={name + lang.suffix}
                defaultValue={values[lang.code]}
                rows={rows}
                placeholder={lang.code === 'ru' ? placeholder : undefined}
              />
            ) : (
              <input
                type="text"
                name={name + lang.suffix}
                defaultValue={values[lang.code]}
                // Обязателен только русский: перевод можно дописать позже.
                required={required && lang.code === 'ru'}
                placeholder={lang.code === 'ru' ? placeholder : undefined}
              />
            )}
          </div>
        ))}
      </div>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}
