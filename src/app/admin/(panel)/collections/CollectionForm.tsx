import Link from 'next/link';
import { adminAssetUrl, type AdminCategory, type AdminCollection } from '@/lib/adminApi';
import ConfirmButton from '../ConfirmButton';

type Props = {
  collection?: AdminCollection;
  categories: AdminCategory[];
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  submitLabel: string;
};

/** Форма подборки: название, категория (селект), изображение, активность. */
export default function CollectionForm({
  collection,
  categories,
  action,
  deleteAction,
  submitLabel,
}: Props) {
  const imageUrl = collection?.image_url ?? '';
  const previewUrl = adminAssetUrl(imageUrl);

  return (
    <form action={action} className="statCard categoryEditForm adminForm">
      {collection ? <input type="hidden" name="id" value={collection.id} /> : null}
      <input type="hidden" name="imageUrl" value={imageUrl} />

      <div className="categoryPreview">
        {previewUrl ? (
          <img className="categoryPreviewImage" src={previewUrl} alt="" />
        ) : (
          <span className="categoryPreviewEmpty">Изображение</span>
        )}
      </div>

      <label>
        <span>Название</span>
        <input
          type="text"
          name="title"
          defaultValue={collection?.title ?? ''}
          placeholder="Например: Наши привычки"
          required
        />
      </label>

      <label>
        <span>Категория</span>
        <select name="categoryId" defaultValue={collection?.category_id ?? ''}>
          <option value="">Без категории</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Изображение</span>
        <input
          className="categoryFileInput"
          type="file"
          name="imageFile"
          accept="image/png,image/jpeg,image/webp,image/gif"
        />
        <small>Рекомендуемый размер: 512x512 px, квадрат. JPG, PNG, WEBP или GIF до 5 MB</small>
      </label>

      <div className="categoryEditMeta">
        <label className="categoryActiveCheck">
          <input type="checkbox" name="active" defaultChecked={collection?.active ?? true} />{' '}
          Активна
        </label>
        <label className="categoryActiveCheck">
          <input type="checkbox" name="plus" defaultChecked={collection?.plus ?? false} /> Платная
          (Savel+)
        </label>
      </div>

      <div className="categoryEditActions">
        <button className="adminBtn" type="submit">
          {submitLabel}
        </button>
        <Link className="adminGhostLink" href="/admin/collections">
          Отмена
        </Link>
        {collection && deleteAction ? (
          <ConfirmButton
            className="adminDangerBtn"
            formAction={deleteAction}
            formNoValidate
            type="submit"
            confirmText="Удалить подборку вместе со всеми вопросами и ответами пар на них?">
            Удалить подборку
          </ConfirmButton>
        ) : null}
      </div>
    </form>
  );
}
