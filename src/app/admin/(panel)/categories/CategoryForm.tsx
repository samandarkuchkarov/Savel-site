import Link from 'next/link';
import { adminAssetUrl, type AdminCategory } from '@/lib/adminApi';
import type { FormState } from '@/lib/formState';
import ConfirmButton from '../ConfirmButton';
import AdminForm, { SubmitButton } from '../AdminForm';
import TrField from '../TrField';

type Props = {
  category?: AdminCategory;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  deleteAction?: (formData: FormData) => Promise<void>;
  submitLabel: string;
};

export default function CategoryForm({ category, action, deleteAction, submitLabel }: Props) {
  const imageUrl = category?.image_url ?? '';
  const previewUrl = adminAssetUrl(imageUrl);

  return (
    <AdminForm action={action} className="statCard categoryEditForm formWide adminForm">
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

      <TrField
        label="Название"
        name="title"
        ru={category?.title}
        uz={category?.title_uz}
        en={category?.title_en}
        required
      />

      <TrField
        label="Подзаголовок"
        name="subtitle"
        ru={category?.subtitle}
        uz={category?.subtitle_uz}
        en={category?.subtitle_en}
      />

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
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link className="adminGhostLink" href="/admin/categories">
          Отмена
        </Link>
        {category && deleteAction ? (
          <ConfirmButton
            className="adminDangerBtn"
            formAction={deleteAction}
            formNoValidate
            type="submit"
            confirmText="Удалить категорию? Её подборки останутся, но пропадут из каталога приложения.">
            Удалить
          </ConfirmButton>
        ) : null}
      </div>
    </AdminForm>
  );
}
