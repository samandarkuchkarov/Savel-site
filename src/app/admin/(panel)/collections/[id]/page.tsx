import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import {
  adminApi,
  adminUploadImage,
  type AdminCategory,
  type AdminCollectionDetail,
} from '@/lib/adminApi';
import { FORM_OK, toFormError, type FormState } from '@/lib/formState';
import { trFields } from '@/lib/trFields';
import CollectionForm from '../CollectionForm';
import ConfirmButton from '../../ConfirmButton';
import TrField from '../../TrField';

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

async function saveCollection(_prev: FormState, formData: FormData): Promise<FormState> {
  'use server';
  const id = String(formData.get('id'));
  try {
    const uploadedImageUrl = await adminUploadImage(formData.get('imageFile'));
    const currentImageUrl = String(formData.get('imageUrl') ?? '').trim() || null;
    const categoryId = String(formData.get('categoryId') ?? '').trim();
    await adminApi(`/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: String(formData.get('title') ?? '').trim(),
        ...trFields(formData, 'title'),
        categoryId: categoryId || null,
        imageUrl: uploadedImageUrl ?? currentImageUrl,
        active: formData.get('active') === 'on',
        plus: formData.get('plus') === 'on',
      }),
    });
  } catch (e) {
    return toFormError(e, formData);
  }
  revalidatePath('/admin/collections');
  revalidatePath(`/admin/collections/${id}`);
  return FORM_OK;
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

/** Тело вопроса на трёх языках; пустой перевод уходит пустым — API его чистит. */
function questionBody(formData: FormData) {
  return {
    text: String(formData.get('text') ?? '').trim(),
    variants: parseVariants(formData.get('variants')),
    ...trFields(formData, 'text'),
    variantsUz: parseVariants(formData.get('variantsUz')),
    variantsEn: parseVariants(formData.get('variantsEn')),
  };
}

async function addQuestion(formData: FormData) {
  'use server';
  const collectionId = String(formData.get('collectionId'));
  const body = questionBody(formData);
  if (!body.text) return;
  await adminApi(`/collections/${collectionId}/questions`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  revalidatePath(`/admin/collections/${collectionId}`);
}

async function saveQuestion(formData: FormData): Promise<void> {
  'use server';
  const collectionId = String(formData.get('collectionId'));
  const questionId = String(formData.get('questionId'));
  const body = questionBody(formData);
  if (!body.text) return;
  try {
    await adminApi(`/questions/${questionId}`, { method: 'PATCH', body: JSON.stringify(body) });
  } catch (error) {
    // Самая частая ошибка здесь — разное число вариантов у языков; молчаливый
    // провал выглядел бы как «сохранилось», хотя вопрос остался прежним.
    const message = error instanceof Error ? error.message : 'Не удалось сохранить';
    redirect(`/admin/collections/${collectionId}?error=` + encodeURIComponent(message));
  }
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
  // Весь порядок одним запросом (одна транзакция на сервере): пачка
  // параллельных PATCH при обрыве оставляла порядок наполовину применённым.
  await adminApi('/reorder', {
    method: 'POST',
    body: JSON.stringify({ entity: 'questions', ids: next.map(item => item.id) }),
  });
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
      <p className="adminSub">
        Русский обязателен — его показывает приложение. Перевод можно оставить пустым; если
        переводите варианты, строк должно быть столько же, сколько в русском.
      </p>

      {collection.questions.map((question, index) => (
        <div key={question.id} className="statCard questionCard">
          <form action={saveQuestion} className="questionCardMain adminForm">
            <input type="hidden" name="collectionId" value={collection.id} />
            <input type="hidden" name="questionId" value={question.id} />
            <TrField
              label={`Вопрос ${index + 1}`}
              name="text"
              ru={question.text}
              uz={question.text_uz}
              en={question.text_en}
              required
            />
            <TrField
              label="Варианты ответов — каждый с новой строки (пусто = свободный ответ)"
              name="variants"
              textarea
              rows={Math.max(4, question.variants.length + 2)}
              ru={question.variants.join('\n')}
              uz={question.variants_uz?.join('\n')}
              en={question.variants_en?.join('\n')}
            />
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
              <ConfirmButton
                className="adminDangerBtn"
                type="submit"
                confirmText="Удалить вопрос? Ответы пар на него исчезнут из приложения.">
                Удалить
              </ConfirmButton>
            </form>
          </div>
        </div>
      ))}

      <h2 className="adminH2">Добавить вопрос</h2>
      <form action={addQuestion} className="statCard questionCard adminForm">
        <input type="hidden" name="collectionId" value={collection.id} />
        <div className="questionCardMain">
          <TrField
            label="Текст вопроса"
            name="text"
            placeholder="Например: Как ты любишь отдыхать?"
            required
          />
          <TrField
            label="Варианты ответов — каждый с новой строки (пусто = свободный ответ)"
            name="variants"
            textarea
            rows={4}
            placeholder={'Дома вдвоём\nНа природе\nВ путешествии'}
          />
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
