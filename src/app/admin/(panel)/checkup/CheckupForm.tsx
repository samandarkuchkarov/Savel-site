import Link from 'next/link';
import { adminAssetUrl, type AdminCheckupCollection } from '@/lib/adminApi';
import ConfirmButton from '../ConfirmButton';

type Props = {
  checkup?: AdminCheckupCollection;
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  submitLabel: string;
};

/** Форма чек-апа: название, изображение, активность. */
export default function CheckupForm({ checkup, action, deleteAction, submitLabel }: Props) {
  const imageUrl = checkup?.image_url ?? '';
  const previewUrl = adminAssetUrl(imageUrl);

  return (
    <form action={action} className="statCard categoryEditForm adminForm">
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
        <button className="adminBtn" type="submit">
          {submitLabel}
        </button>
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
    </form>
  );
}
