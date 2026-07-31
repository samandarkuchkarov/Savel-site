import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import {
  adminApi,
  adminUploadImage,
  type AdminCategory,
  type AdminCheckupCollectionDetail,
} from '@/lib/adminApi';
import { FORM_OK, toFormError, type FormState } from '@/lib/formState';
import { trFields } from '@/lib/trFields';
import CheckupForm from '../CheckupForm';
import ConfirmButton from '../../ConfirmButton';
import TrField from '../../TrField';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

async function saveCheckup(_prev: FormState, formData: FormData): Promise<FormState> {
  'use server';
  const id = String(formData.get('id'));
  try {
    const uploadedImageUrl = await adminUploadImage(formData.get('imageFile'));
    const currentImageUrl = String(formData.get('imageUrl') ?? '').trim() || null;
    const categoryId = String(formData.get('categoryId') ?? '').trim();
    await adminApi(`/checkup-collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: String(formData.get('title') ?? '').trim(),
        ...trFields(formData, 'title'),
        // Пустой выбор — явный null: он ОТВЯЗЫВАЕТ чек-ап от категории
        // (сервер различает «не прислали» и «прислали null»).
        categoryId: categoryId || null,
        imageUrl: uploadedImageUrl ?? currentImageUrl,
        active: formData.get('active') === 'on',
      }),
    });
  } catch (e) {
    return toFormError(e, formData);
  }
  revalidatePath('/admin/checkup');
  revalidatePath(`/admin/checkup/${id}`);
  return FORM_OK;
}

async function deleteCheckup(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  try {
    await adminApi(`/checkup-collections/${id}`, { method: 'DELETE' });
  } catch (error) {
    // API отклоняет удаление чек-апа из живого расписания — показываем причину.
    const message = error instanceof Error ? error.message : 'Не удалось удалить';
    redirect(`/admin/checkup/${id}?error=` + encodeURIComponent(message));
  }
  revalidatePath('/admin/checkup');
  redirect('/admin/checkup');
}

async function addQuestion(formData: FormData) {
  'use server';
  const checkupId = String(formData.get('checkupId'));
  const text = String(formData.get('text') ?? '').trim();
  if (!text) return;
  await adminApi(`/checkup-collections/${checkupId}/questions`, {
    method: 'POST',
    body: JSON.stringify({ text, ...trFields(formData, 'text') }),
  });
  revalidatePath(`/admin/checkup/${checkupId}`);
}

async function saveQuestion(formData: FormData) {
  'use server';
  const checkupId = String(formData.get('checkupId'));
  const questionId = String(formData.get('questionId'));
  await adminApi(`/checkup-questions/${questionId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      text: String(formData.get('text') ?? '').trim(),
      ...trFields(formData, 'text'),
      active: formData.get('active') === 'on',
    }),
  });
  revalidatePath(`/admin/checkup/${checkupId}`);
}

async function deleteQuestion(formData: FormData) {
  'use server';
  const checkupId = String(formData.get('checkupId'));
  const questionId = String(formData.get('questionId'));
  await adminApi(`/checkup-questions/${questionId}`, { method: 'DELETE' });
  revalidatePath(`/admin/checkup/${checkupId}`);
}

/** Move a question up/down within the checkup and renumber sorts 1..n. */
async function moveQuestion(formData: FormData) {
  'use server';
  const checkupId = String(formData.get('checkupId'));
  const questionId = String(formData.get('questionId'));
  const direction = String(formData.get('direction') ?? '');
  const detail = await adminApi<AdminCheckupCollectionDetail>(`/checkup-collections/${checkupId}`);
  const list = detail.questions;
  const index = list.findIndex(q => q.id === questionId);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= list.length) return;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  // Весь порядок одним запросом (одна транзакция на сервере): пачка
  // параллельных PATCH при обрыве оставляла порядок наполовину применённым.
  await adminApi('/reorder', {
    method: 'POST',
    body: JSON.stringify({ entity: 'checkup-questions', ids: next.map(item => item.id) }),
  });
  revalidatePath(`/admin/checkup/${checkupId}`);
}

export default async function EditCheckupPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  let checkup: AdminCheckupCollectionDetail;
  let categories: AdminCategory[];
  try {
    [checkup, categories] = await Promise.all([
      adminApi<AdminCheckupCollectionDetail>(`/checkup-collections/${id}`),
      adminApi<AdminCategory[]>('/categories'),
    ]);
  } catch {
    notFound();
  }

  return (
    <>
      <h1 className="adminH1">Чек-ап «{checkup.title}»</h1>
      <p className="adminSub">Настройки чек-апа и его утверждения. Пара оценивает каждое сердечками.</p>
      {error ? <p className="loginError">{error}</p> : null}

      <CheckupForm
        checkup={checkup}
        categories={categories}
        action={saveCheckup}
        deleteAction={deleteCheckup}
        submitLabel="Сохранить"
      />

      <h2 className="adminH2">Утверждения ({checkup.questions.length})</h2>

      <div className="checkupList">
        {checkup.questions.map((question, index) => (
          <div key={question.id} className="checkupItem">
            <div className="checkupOrder">
              <form action={moveQuestion}>
                <input type="hidden" name="checkupId" value={checkup.id} />
                <input type="hidden" name="questionId" value={question.id} />
                <input type="hidden" name="direction" value="up" />
                <button className="sortBtn" type="submit" disabled={index === 0} title="Выше">
                  ↑
                </button>
              </form>
              <form action={moveQuestion}>
                <input type="hidden" name="checkupId" value={checkup.id} />
                <input type="hidden" name="questionId" value={question.id} />
                <input type="hidden" name="direction" value="down" />
                <button
                  className="sortBtn"
                  type="submit"
                  disabled={index === checkup.questions.length - 1}
                  title="Ниже">
                  ↓
                </button>
              </form>
            </div>
            <span className={`checkupNum${question.active ? '' : ' checkupNumOff'}`}>
              {index + 1}
            </span>
            <form action={saveQuestion} className="checkupForm">
              <input type="hidden" name="checkupId" value={checkup.id} />
              <input type="hidden" name="questionId" value={question.id} />
              <TrField
                name="text"
                ru={question.text}
                uz={question.text_uz}
                en={question.text_en}
                required
              />
              <label className="checkupActive">
                <input type="checkbox" name="active" defaultChecked={question.active} /> Активен
              </label>
              <button className="adminBtn" type="submit">
                Сохранить
              </button>
            </form>
            <form action={deleteQuestion} className="checkupDelete">
              <input type="hidden" name="checkupId" value={checkup.id} />
              <input type="hidden" name="questionId" value={question.id} />
              <ConfirmButton
                className="adminDangerBtn"
                type="submit"
                confirmText="Удалить вопрос чек-апа? Сохранённые оценки на него перестанут отображаться.">
                Удалить
              </ConfirmButton>
            </form>
          </div>
        ))}
      </div>

      <h2 className="adminH2">Добавить утверждение</h2>
      <form action={addQuestion} className="checkupItem checkupAdd">
        <input type="hidden" name="checkupId" value={checkup.id} />
        <TrField name="text" placeholder="Например: Мы поддерживаем общие цели" required />
        <button className="adminBtn" type="submit">
          Добавить
        </button>
      </form>
    </>
  );
}
