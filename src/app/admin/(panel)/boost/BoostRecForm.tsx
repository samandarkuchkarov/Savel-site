import type { AdminBoostRecommendation } from '@/lib/adminApi';
import type { FormState } from '@/lib/formState';
import AdminForm, { SubmitButton } from '../AdminForm';

const KIND_LABELS: Record<AdminBoostRecommendation['kind'], string> = {
  challenge: 'Челлендж',
  date: 'Свидание',
  tradition: 'Традиция',
  goal: 'Цель',
};

/**
 * Форма рекомендации Буста (создание/редактирование). Вид выбирается только при
 * создании — у существующей он зафиксирован (позиция живёт внутри вида).
 */
export default function BoostRecForm({
  action,
  submitLabel,
  initial,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  initial?: AdminBoostRecommendation;
}) {
  return (
    <AdminForm action={action} className="statCard categoryEditForm adminForm">
      {initial ? (
        <label>
          <span>Вид</span>
          <input type="text" value={KIND_LABELS[initial.kind]} disabled />
        </label>
      ) : (
        <label>
          <span>Вид</span>
          <select name="kind" defaultValue="challenge">
            <option value="challenge">Челлендж</option>
            <option value="date">Свидание</option>
            <option value="tradition">Традиция</option>
            <option value="goal">Цель</option>
          </select>
        </label>
      )}
      <label>
        <span>Эмодзи</span>
        <input type="text" name="emoji" defaultValue={initial?.emoji ?? ''} placeholder="🌟" maxLength={8} />
      </label>
      <label>
        <span>Название</span>
        <input type="text" name="title" defaultValue={initial?.title ?? ''} required maxLength={80} />
      </label>
      <label>
        <span>Подзаголовок (короткая строка на карточке)</span>
        <input type="text" name="subtitle" defaultValue={initial?.subtitle ?? ''} maxLength={120} />
      </label>
      <label>
        <span>Описание (подставляется в создание активности)</span>
        <textarea name="description" defaultValue={initial?.description ?? ''} maxLength={300} rows={3} />
      </label>
      <SubmitButton>{submitLabel}</SubmitButton>
    </AdminForm>
  );
}
