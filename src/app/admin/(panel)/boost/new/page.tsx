import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminApi } from '@/lib/adminApi';
import BoostRecForm from '../BoostRecForm';

export const dynamic = 'force-dynamic';

async function createRec(formData: FormData) {
  'use server';
  await adminApi('/boost-recommendations', {
    method: 'POST',
    body: JSON.stringify({
      kind: String(formData.get('kind') ?? 'challenge'),
      title: String(formData.get('title') ?? '').trim(),
      subtitle: String(formData.get('subtitle') ?? '').trim() || null,
      description: String(formData.get('description') ?? '').trim() || null,
      emoji: String(formData.get('emoji') ?? '').trim() || null,
    }),
  });
  revalidatePath('/admin/boost');
  redirect('/admin/boost');
}

export default function NewBoostRecPage() {
  return (
    <>
      <h1 className="adminH1">Новая рекомендация</h1>
      <p className="adminSub">Идея появится в конце своего вида — поднимите её стрелками.</p>
      <BoostRecForm action={createRec} submitLabel="Создать" />
    </>
  );
}
