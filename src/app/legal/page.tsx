import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL_DOCS } from '@/lib/legal';
import '../legal.css';

export const metadata: Metadata = {
  title: 'ISAVEL — Документы',
  description: 'Политика конфиденциальности, условия использования, оферта и политика ИИ.',
};

export default function LegalIndexPage() {
  return (
    <div className="legalShell">
      <div className="legalInner">
        <Link href="/" className="legalBrand">
          ♥ Savel
        </Link>
        <h1>Документы</h1>
        <div className="legalDate">ISAVEL · ООО «I SAVE LOVE»</div>

        <div className="legalCards">
          {LEGAL_DOCS.map((doc) => (
            <Link key={doc.slug} href={`/${doc.slug}`} className="legalCard">
              <div className="legalCardTitle">{doc.title}</div>
              <div className="legalCardText">{doc.description}</div>
              <div className="legalCardMeta">Обновлено {doc.updated}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
