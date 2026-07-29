import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { adminApi } from '@/lib/adminApi';
import BoostRecForm from '../BoostRecForm';
import { toFormError, type FormState } from '@/lib/formState';

export const dynamic = 'force-dynamic';

async function createRec(_prev: FormState, formData: FormData): Promise<FormState> {
  'use server';
  // try — только вокруг работы; redirect ниже кидает NEXT_REDIRECT и внутри try
  // был бы пойман как «ошибка сохранения».
  try {
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
  } catch (e) {
    return toFormError(e, formData);
  }
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
