import Link from 'next/link';
import { LEGAL_DOCS } from '@/lib/legal';

/**
 * Отрисовка юридического документа.
 *
 * Текст приходит из `src/lib/legal/<slug>.ts` — эти файлы СГЕНЕРИРОВАНЫ из
 * .docx юриста, править их руками нельзя: правка уйдёт при следующей сборке и
 * версия на сайте разойдётся с подписанной. Менять нужно исходный документ.
 *
 * `dangerouslySetInnerHTML` здесь безопасен: разметка не приходит от
 * пользователя, а собирается нами из файла в репозитории на этапе сборки.
 */
export function LegalDocument({ slug, html }: { slug: string; html: string }) {
  const doc = LEGAL_DOCS.find((d) => d.slug === slug);
  if (!doc) return null;
  const others = LEGAL_DOCS.filter((d) => d.slug !== slug);

  return (
    <div className="legalShell">
      <div className="legalInner">
        <Link href="/" className="legalBrand">
          ♥ Savel
        </Link>
        <h1>{doc.title}</h1>
        <div className="legalDate">
          ISAVEL · ООО «I SAVE LOVE» · обновлено {doc.updated}
        </div>

        <div dangerouslySetInnerHTML={{ __html: html }} />

        <div className="legalOther">
          <div className="legalOtherTitle">Другие документы</div>
          <div className="legalOtherLinks">
            {others.map((d) => (
              <Link key={d.slug} href={`/${d.slug}`} className="legalChip">
                {d.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
