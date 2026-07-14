import Link from 'next/link';
import { adminAssetUrl, type AdminCategory } from '@/lib/adminApi';

type Props = {
  category?: AdminCategory;
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  submitLabel: string;
};

export default function CategoryForm({ category, action, deleteAction, submitLabel }: Props) {
  const imageUrl = category?.image_url ?? '';
  const previewUrl = adminAssetUrl(imageUrl);

  return (
    <form action={action} className="statCard categoryEditForm adminForm">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <input type="hidden" name="imageUrl" value={imageUrl} />

      <div className="categoryPreview">
        {previewUrl ? (
          <img className="categoryPreviewImage" src={previewUrl} alt="" />
        ) : (
          <span className="categoryPreviewEmpty">Изображение</span>
        )}
      </div>

      <label>
        <span>ID</span>
        <input
          type="text"
          name="id"
          defaultValue={category?.id ?? ''}
          placeholder="id-latin"
          required
          pattern="[a-z0-9-]+"
          disabled={!!category}
        />
      </label>

      <label>
        <span>Название</span>
        <input type="text" name="title" defaultValue={category?.title ?? ''} required />
      </label>

      <label>
        <span>Подзаголовок</span>
        <input type="text" name="subtitle" defaultValue={category?.subtitle ?? ''} />
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
        <label className="categorySortField">
          <span>Порядок</span>
          <input type="number" name="sort" defaultValue={category?.sort ?? 100} />
        </label>
        <label className="categoryActiveCheck">
          <input type="checkbox" name="active" defaultChecked={category?.active ?? true} /> Активна
        </label>
      </div>

      <div className="categoryEditActions">
        <button className="adminBtn" type="submit">
          {submitLabel}
        </button>
        <Link className="adminGhostLink" href="/admin/categories">
          Отмена
        </Link>
        {category && deleteAction ? (
          <button className="adminDangerBtn" formAction={deleteAction} formNoValidate type="submit">
            Удалить
          </button>
        ) : null}
      </div>
    </form>
  );
}
