import Link from 'next/link';
import { adminAssetUrl, type AdminNotification } from '@/lib/adminApi';

type Props = {
  notification?: AdminNotification;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
};

/** ISO-UTC → значение для <input type="datetime-local"> во времени Ташкента. */
function toTashkentLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const t = new Date(d.getTime() + 5 * 60 * 60 * 1000); // UTC+5, без DST
  return t.toISOString().slice(0, 16);
}

/** Форма рассылки: заголовок, текст, фото (опционально), время отправки. */
export default function NotificationForm({ notification, action, submitLabel }: Props) {
  return (
    <form action={action} className="statCard categoryEditForm adminForm">
      {notification ? <input type="hidden" name="id" value={notification.id} /> : null}
      {notification?.image_url ? (
        <input type="hidden" name="currentImageUrl" value={notification.image_url} />
      ) : null}

      <label>
        <span>Заголовок · до ~50 символов, иначе обрежется на устройстве</span>
        <input
          type="text"
          name="title"
          required
          maxLength={120}
          defaultValue={notification?.title ?? ''}
          placeholder="Например: Новый чек-ап недели ♥"
        />
      </label>

      <label>
        <span>Текст · до ~150 символов видно целиком</span>
        <textarea
          name="body"
          required
          maxLength={1000}
          rows={3}
          defaultValue={notification?.body ?? ''}
          placeholder="Короткое тёплое сообщение для пары"
        />
      </label>

      <label>
        <span>Фото (необязательно) · рекомендуем 1024×512, соотношение 2:1, до 1 МБ</span>
        <input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp,image/gif" />
      </label>
      {notification?.image_url ? (
        <p className="adminSub" style={{ margin: 0 }}>
          Текущее фото:{' '}
          <a href={adminAssetUrl(notification.image_url)} target="_blank" rel="noreferrer">
            открыть
          </a>{' '}
          — выбор нового файла заменит его.
        </p>
      ) : null}

      <label>
        <span>Время отправки (Ташкент) · пусто — отправить сейчас</span>
        <input
          type="datetime-local"
          name="scheduledAt"
          defaultValue={toTashkentLocal(notification?.scheduled_at)}
        />
      </label>

      <div className="categoryEditActions">
        <button className="adminBtn" type="submit">
          {submitLabel}
        </button>
        <Link className="adminGhostLink" href="/admin/notifications">
          Отмена
        </Link>
      </div>
    </form>
  );
}
