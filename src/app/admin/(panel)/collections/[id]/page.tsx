import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import {
  adminApi,
  adminUploadImage,
  type AdminCategory,
  type AdminCollectionDetail,
} from '@/lib/adminApi';
import CollectionForm from '../CollectionForm';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

function parseVariants(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 12);
}

async function saveCollection(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  const uploadedImageUrl = await adminUploadImage(formData.get('imageFile'));
  const currentImageUrl = String(formData.get('imageUrl') ?? '').trim() || null;
  const categoryId = String(formData.get('categoryId') ?? '').trim();
  await adminApi(`/collections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: String(formData.get('title') ?? '').trim(),
      categoryId: categoryId || null,
      imageUrl: uploadedImageUrl ?? currentImageUrl,
      active: formData.get('active') === 'on',
    }),
  });
  revalidatePath('/admin/collections');
  revalidatePath(`/admin/collections/${id}`);
}

async function deleteCollection(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  try {
    await adminApi(`/collections/${id}`, { method: 'DELETE' });
  } catch (error) {
    // API отклоняет удаление подборки из живого расписания («Стоит в расписании
    // … — сначала уберите из интервала») — админ должен увидеть причину.
    const message = error instanceof Error ? error.message : 'Не удалось удалить';
    redirect(`/admin/collections/${id}?error=` + encodeURIComponent(message));
  }
  revalidatePath('/admin/collections');
  redirect('/admin/collections');
}

async function addQuestion(formData: FormData) {
  'use server';
  const collectionId = String(formData.get('collectionId'));
  const text = String(formData.get('text') ?? '').trim();
  if (!text) return;
  await adminApi(`/collections/${collectionId}/questions`, {
    method: 'POST',
    body: JSON.stringify({ text, variants: parseVariants(formData.get('variants')) }),
  });
  revalidatePath(`/admin/collections/${collectionId}`);
}

async function saveQuestion(formData: FormData) {
  'use server';
  const collectionId = String(formData.get('collectionId'));
  const questionId = String(formData.get('questionId'));
  const text = String(formData.get('text') ?? '').trim();
  if (!text) return;
  await adminApi(`/questions/${questionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ text, variants: parseVariants(formData.get('variants')) }),
  });
  revalidatePath(`/admin/collections/${collectionId}`);
}

async function deleteQuestion(formData: FormData) {
  'use server';
  const collectionId = String(formData.get('collectionId'));
  const questionId = String(formData.get('questionId'));
  await adminApi(`/questions/${questionId}`, { method: 'DELETE' });
  revalidatePath(`/admin/collections/${collectionId}`);
}

/** Move a question up/down inside the collection and renumber sorts 1..n. */
async function moveQuestion(formData: FormData) {
  'use server';
  const collectionId = String(formData.get('collectionId'));
  const questionId = String(formData.get('questionId'));
  const direction = String(formData.get('direction') ?? '');
  const detail = await adminApi<AdminCollectionDetail>(`/collections/${collectionId}`);
  const list = detail.questions;
  const index = list.findIndex(question => question.id === questionId);
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= list.length) return;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  await Promise.all(
    next.map((question, i) =>
      question.sort === i + 1
        ? Promise.resolve()
        : adminApi(`/questions/${question.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ sort: i + 1 }),
          }),
    ),
  );
  revalidatePath(`/admin/collections/${collectionId}`);
}

export default async function EditCollectionPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  let collection: AdminCollectionDetail;
  let categories: AdminCategory[];
  try {
    [collection, categories] = await Promise.all([
      adminApi<AdminCollectionDetail>(`/collections/${id}`),
      adminApi<AdminCategory[]>('/categories'),
    ]);
  } catch {
    notFound();
  }

  return (
    <>
      <h1 className="adminH1">Подборка «{collection.title}»</h1>
      <p className="adminSub">
        Настройки подборки и её вопросы. У вопросов нет правильного ответа — варианты помогают
        партнёрам узнать друг друга.
      </p>
      {error ? <p className="loginError">{error}</p> : null}

      <CollectionForm
        collection={collection}
        categories={categories}
        action={saveCollection}
        deleteAction={deleteCollection}
        submitLabel="Сохранить"
      />

      <h2 className="adminH2">Вопросы ({collection.questions.length})</h2>

      {collection.questions.map((question, index) => (
        <div key={question.id} className="statCard questionCard">
          <form action={saveQuestion} className="questionCardMain adminForm">
            <input type="hidden" name="collectionId" value={collection.id} />
            <input type="hidden" name="questionId" value={question.id} />
            <label>
              <span>Вопрос {index + 1}</span>
              <input type="text" name="text" defaultValue={question.text} required />
            </label>
            <label>
              <span>Варианты ответов — каждый с новой строки (пусто = свободный ответ)</span>
              <textarea
                name="variants"
                rows={Math.max(3, question.variants.length + 1)}
                defaultValue={question.variants.join('\n')}
              />
            </label>
            <button className="adminBtn" type="submit">
              Сохранить
            </button>
          </form>
          <div className="questionCardActions">
            <form action={moveQuestion}>
              <input type="hidden" name="collectionId" value={collection.id} />
              <input type="hidden" name="questionId" value={question.id} />
              <input type="hidden" name="direction" value="up" />
              <button className="sortBtn" type="submit" disabled={index === 0} title="Поднять выше">
                ↑
              </button>
            </form>
            <form action={moveQuestion}>
              <input type="hidden" name="collectionId" value={collection.id} />
              <input type="hidden" name="questionId" value={question.id} />
              <input type="hidden" name="direction" value="down" />
              <button
                className="sortBtn"
                type="submit"
                disabled={index === collection.questions.length - 1}
                title="Опустить ниже">
                ↓
              </button>
            </form>
            <form action={deleteQuestion}>
              <input type="hidden" name="collectionId" value={collection.id} />
              <input type="hidden" name="questionId" value={question.id} />
              <button className="adminDangerBtn" type="submit">
                Удалить
              </button>
            </form>
          </div>
        </div>
      ))}

      <h2 className="adminH2">Добавить вопрос</h2>
      <form action={addQuestion} className="statCard questionCard adminForm">
        <input type="hidden" name="collectionId" value={collection.id} />
        <div className="questionCardMain">
          <label>
            <span>Текст вопроса</span>
            <input type="text" name="text" placeholder="Например: Как ты любишь отдыхать?" required />
          </label>
          <label>
            <span>Варианты ответов — каждый с новой строки (пусто = свободный ответ)</span>
            <textarea name="variants" rows={4} placeholder={'Дома вдвоём\nНа природе\nВ путешествии'} />
          </label>
        </div>
        <div className="questionCardActions">
          <button className="adminBtn" type="submit">
            Добавить вопрос
          </button>
        </div>
      </form>
    </>
  );
}
