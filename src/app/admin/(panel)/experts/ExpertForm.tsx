import Link from 'next/link';
import { adminAssetUrl, type AdminExpert } from '@/lib/adminApi';
import type { FormState } from '@/lib/formState';
import ConfirmButton from '../ConfirmButton';
import AdminForm, { SubmitButton } from '../AdminForm';
import TrField from '../TrField';

type Props = {
  expert?: AdminExpert;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  deleteAction?: (formData: FormData) => Promise<void>;
  submitLabel: string;
};

/** Сети — те же значения, что принимает сервер (LINK_KINDS в admin.ts). */
const KINDS: { value: string; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'Сайт' },
  { value: 'other', label: 'Другое' },
];

/** Сколько строк ссылок показываем: заполненные + три пустых про запас. */
const LINK_SLOTS = 5;

export default function ExpertForm({ expert, action, deleteAction, submitLabel }: Props) {
  const photoUrl = expert?.photo_url ?? '';
  const previewUrl = adminAssetUrl(photoUrl);
  const links = expert?.links ?? [];
  const slots = Math.max(LINK_SLOTS, links.length + 2);

  return (
    <AdminForm action={action} className="statCard categoryEditForm formWide adminForm">
      {expert ? <input type="hidden" name="id" value={expert.id} /> : null}
      {/* Прежнее фото едет скрытым полем: если файл не выбрали, сохраняем то,
          что было, а не затираем пустым значением. */}
      <input type="hidden" name="photoUrl" value={photoUrl} />

      <div className="categoryPreview">
        {previewUrl ? (
          <img className="categoryPreviewImage" src={previewUrl} alt="" />
        ) : (
          <span className="categoryPreviewEmpty">Фото</span>
        )}
      </div>

      <TrField
        label="Имя"
        name="name"
        ru={expert?.name}
        uz={expert?.name_uz}
        en={expert?.name_en}
        required
      />

      <TrField
        label="Кто это"
        name="title"
        ru={expert?.title}
        uz={expert?.title_uz}
        en={expert?.title_en}
      />

      <TrField
        label="Биография"
        name="bio"
        ru={expert?.bio}
        uz={expert?.bio_uz}
        en={expert?.bio_en}
        textarea
        rows={6}
        hint="Абзацы разделяйте пустой строкой — приложение разобьёт их само."
      />

      <label>
        <span>Фото</span>
        <input
          className="categoryFileInput"
          type="file"
          name="photoFile"
          accept="image/png,image/jpeg,image/webp,image/gif"
        />
        <small>Квадрат, от 640×640 px. JPG, PNG, WEBP или GIF до 5 MB</small>
      </label>

      <fieldset className="expertLinks">
        <legend>Ссылки на соцсети</legend>
        <small className="expertLinksHint">
          Пустая строка не сохраняется. Порядок строк — порядок на экране эксперта.
          Подпись можно не заполнять: тогда приложение подставит название сети.
        </small>
        {Array.from({ length: slots }, (_, i) => {
          const link = links[i];
          return (
            <div className="expertLinkRow" key={i}>
              <select name={`linkKind${i}`} defaultValue={link?.kind ?? 'instagram'}>
                {KINDS.map(kind => (
                  <option key={kind.value} value={kind.value}>
                    {kind.label}
                  </option>
                ))}
              </select>
              <input
                type="url"
                name={`linkUrl${i}`}
                defaultValue={link?.url ?? ''}
                placeholder="https://instagram.com/username"
              />
              <input
                type="text"
                name={`linkLabel${i}`}
                defaultValue={link?.label ?? ''}
                placeholder="Подпись (необязательно)"
                maxLength={40}
              />
            </div>
          );
        })}
      </fieldset>

      <div className="categoryEditMeta">
        <label className="categorySortField">
          <span>Порядок</span>
          <input type="number" name="sort" defaultValue={expert?.sort ?? 100} />
        </label>
        <label className="categoryActiveCheck">
          <input type="checkbox" name="active" defaultChecked={expert?.active ?? true} /> Показывать
        </label>
      </div>

      <div className="categoryEditActions">
        <SubmitButton>{submitLabel}</SubmitButton>
        <Link className="adminGhostLink" href="/admin/experts">
          Отмена
        </Link>
        {expert && deleteAction ? (
          <ConfirmButton
            className="adminDangerBtn"
            formAction={deleteAction}
            formNoValidate
            type="submit"
            confirmText="Удалить эксперта? Карточка пропадёт из Пульса, фото и ссылки удалятся.">
            Удалить
          </ConfirmButton>
        ) : null}
      </div>
    </AdminForm>
  );
}
