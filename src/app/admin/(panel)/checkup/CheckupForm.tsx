import Link from 'next/link';
import { adminAssetUrl, type AdminCategory, type AdminCheckupCollection } from '@/lib/adminApi';
import ConfirmButton from '../ConfirmButton';
import type { FormState } from '@/lib/formState';
import AdminForm, { SubmitButton } from '../AdminForm';

type Props = {
  checkup?: AdminCheckupCollection;
  /** Для выбора категории; чек-ап без категории виден только через расписание. */
  categories: AdminCategory[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  deleteAction?: (formData: FormData) => Promise<void>;
  submitLabel: string;
};

/** Форма чек-апа: название, категория, изображение, активность. */
export default function CheckupForm({ checkup, categories, action, deleteAction, submitLabel }: Props) {
  const imageUrl = checkup?.image_url ?? '';
  const previewUrl = adminAssetUrl(imageUrl);

  return (
    <AdminForm action={action} className="statCard categoryEditForm adminForm">
      {checkup ? <input type="hidden" name="id" value={checkup.id} /> : null}
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
          defaultValue={checkup?.title ?? ''}
          placeholder="Например: Близость"
          required
        />
      </label>

      <label>
        <span>Категория</span>
        <select name="categoryId" defaultValue={checkup?.category_id ?? ''}>
          <option value="">Без категории (только по расписанию)</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </select>
        <small>
          Чек-ап с категорией виден в ней в Пульсе и доступен в любой момент; результат
          обновляется в рамках календарного месяца.
        </small>
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
          <input type="checkbox" name="active" defaultChecked={checkup?.active ?? true} /> Активен
        </label>
      </div>

      <div className="categoryEditActions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link className="adminGhostLink" href="/admin/checkup">
          Отмена
        </Link>
        {checkup && deleteAction ? (
          <ConfirmButton
            className="adminDangerBtn"
            formAction={deleteAction}
            formNoValidate
            type="submit"
            confirmText="Удалить чек-ап вместе со всеми его вопросами?">
            Удалить чек-ап
          </ConfirmButton>
        ) : null}
      </div>
    </AdminForm>
  );
}
