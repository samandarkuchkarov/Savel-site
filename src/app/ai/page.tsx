import type { Metadata } from 'next';
import { LegalDocument } from '@/components/LegalDocument';
import { LEGAL_DOCS } from '@/lib/legal';
import { html } from '@/lib/legal/ai';
import '../legal.css';

const doc = LEGAL_DOCS.find((d) => d.slug === 'ai')!;

export const metadata: Metadata = {
  title: `ISAVEL — ${doc.title}`,
  description: doc.description,
};

export default function Page() {
  return <LegalDocument slug="ai" html={html} />;
}
