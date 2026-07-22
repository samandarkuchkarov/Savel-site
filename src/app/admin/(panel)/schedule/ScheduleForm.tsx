import ConfirmButton from '../ConfirmButton';
import Link from 'next/link';
import type {
  AdminCheckupCollection,
  AdminCollection,
  AdminScheduleInterval,
} from '@/lib/adminApi';

type Props = {
  interval?: AdminScheduleInterval;
  questionCollections: AdminCollection[];
  checkupCollections: AdminCheckupCollection[];
  action: (formData: FormData) => Promise<void>;
  deleteAction?: (formData: FormData) => Promise<void>;
  submitLabel: string;
  /** Фаза интервала — управляет предупреждением и режимом «только чтение». */
  phase?: 'active' | 'future' | 'past';
};

/**
 * Пригодна ли подборка для расписания: активна и непуста. Неактивные/пустые в
 * селекте НЕ предлагаем — неделя с таким контентом в приложении выглядит пустой
 * (сервер такой выбор тоже отклонит; фильтр здесь — чтобы не предлагать грабли).
 */
function usable(c: { active: boolean; question_count: number }): boolean {
  return c.active && c.question_count > 0;
}

function optionLabel(c: { title: string; question_count: number; active: boolean }): string {
  if (!c.active) return `${c.title} (неактивна)`;
  if (c.question_count === 0) return `${c.title} (пусто)`;
  return `${c.title} · ${c.question_count} вопр.`;
}

/** Форма интервала расписания: даты + подборка вопросов + чек-ап. */
export default function ScheduleForm({
  interval,
  questionCollections,
  checkupCollections,
  action,
  deleteAction,
  submitLabel,
  phase,
}: Props) {
  // Выбранную ранее, но ставшую непригодной подборку оставляем в списке (с пометкой):
  // иначе при редактировании дат select молча сбросился бы на «Не задана».
  const questionOptions = questionCollections.filter(
    c => usable(c) || c.id === interval?.question_collection_id,
  );
  const checkupOptions = checkupCollections.filter(
    c => usable(c) || c.id === interval?.checkup_collection_id,
  );
  return (
    <form action={action} className="statCard categoryEditForm adminForm">
      {interval ? <input type="hidden" name="id" value={interval.id} /> : null}

      {phase === 'active' ? (
        <div
          role="alert"
          style={{
            background: '#fff4e5',
            border: '1px solid #f2c98a',
            color: '#8a5a12',
            borderRadius: 10,
            padding: '10px 13px',
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.5,
          }}>
          Это активная неделя. Изменения применяются сразу у всех пользователей. Смена
          дат безопасна; смена подборки — те, кто уже ответил на этой неделе, сохранят
          свой ответ, новый контент увидят только не ответившие. Удаление уберёт вопросы
          и чек-ап недели у всех немедленно.
        </div>
      ) : null}
      {phase === 'past' ? (
        <div
          role="alert"
          style={{
            background: '#f3eee9',
            border: '1px solid #ded2c8',
            color: '#6f6157',
            borderRadius: 10,
            padding: '10px 13px',
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.5,
          }}>
          Это прошедший период — история ответов пользователей. Правка меняет то, что
          отображается в истории (ответы уже ответивших остаются, но под новым текстом
          вопросов), удаление убирает интервал из истории. Действуйте осознанно.
        </div>
      ) : null}

      <div className="scheduleDates">
        <label>
          <span>Начало</span>
          <input type="date" name="startsOn" defaultValue={interval?.starts_on ?? ''} required />
        </label>
        <label>
          <span>Конец</span>
          <input type="date" name="endsOn" defaultValue={interval?.ends_on ?? ''} required />
        </label>
      </div>

      <label>
        <span>Подборка вопросов</span>
        <select name="questionCollectionId" defaultValue={interval?.question_collection_id ?? ''}>
          <option value="">Не задана</option>
          {questionOptions.map(c => (
            <option key={c.id} value={c.id}>
              {optionLabel(c)}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Чек-ап</span>
        <select name="checkupCollectionId" defaultValue={interval?.checkup_collection_id ?? ''}>
          <option value="">Не задан</option>
          {checkupOptions.map(c => (
            <option key={c.id} value={c.id}>
              {optionLabel(c)}
            </option>
          ))}
        </select>
      </label>

      <div className="categoryEditActions">
        <button className="adminBtn" type="submit">
          {submitLabel}
        </button>
        <Link className="adminGhostLink" href="/admin/schedule">
          Отмена
        </Link>
        {interval && deleteAction ? (
          <ConfirmButton
            className="adminDangerBtn"
            formAction={deleteAction}
            formNoValidate
            type="submit"
            confirmText={
              phase === 'active'
                ? 'Удалить АКТИВНУЮ неделю? Вопросы и чек-ап немедленно исчезнут у всех пользователей. Ответы уже ответивших сохранятся в истории. Отменить нельзя.'
                : phase === 'past'
                  ? 'Удалить прошедший интервал из истории? Ответы пользователей сохранятся, но интервал исчезнет. Отменить нельзя.'
                  : 'Удалить интервал расписания? Отменить нельзя.'
            }>
            Удалить интервал
          </ConfirmButton>
        ) : null}
      </div>
    </form>
  );
}
