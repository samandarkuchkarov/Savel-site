import ConfirmButton from '../../ConfirmButton';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import {
  adminApi,
  type AdminSubscriptionEvent,
  type AdminUserDetail,
} from '@/lib/adminApi';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

function dateTimeRu(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU');
}

function dateRu(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU');
}

const ACTION_LABEL: Record<AdminSubscriptionEvent['action'], string> = {
  purchase: 'Покупка',
  restore: 'Восстановление',
  admin_grant: 'Выдано админом',
  admin_revoke: 'Отозвано админом',
};

/**
 * График баллов чек-апов: пользователь (коралловый) vs партнёр (розовый).
 * Ряды выровнены по периодам; null = пропущенный период (разрыв линии).
 */
function CheckupChart({ you, partner }: { you: (number | null)[]; partner: (number | null)[] }) {
  const hasData = [...you, ...partner].some(v => v != null);
  if (!hasData) {
    return <p className="adminSub">Пока нет данных чек-апов для графика.</p>;
  }
  const W = 320;
  const H = 130;
  const pad = 16;
  const span = Math.max(Math.max(you.length, partner.length) - 1, 1);
  const px = (i: number) => pad + (i / span) * (W - 2 * pad);
  const py = (v: number) => pad + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - 2 * pad);
  // null прерывает линию: M — новый сегмент, L — продолжение.
  const path = (s: (number | null)[]) => {
    let d = '';
    let open = false;
    s.forEach((v, i) => {
      if (v == null) {
        open = false;
        return;
      }
      d += `${open ? 'L' : 'M'}${px(i).toFixed(1)},${py(v).toFixed(1)} `;
      open = true;
    });
    return d.trim();
  };
  return (
    <div className="statCard" style={{ display: 'block' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 480 }} role="img" aria-label="График чек-апов">
        {[0, 50, 100].map(g => (
          <g key={g}>
            <line x1={pad} x2={W - pad} y1={py(g)} y2={py(g)} stroke="#efe6e1" strokeWidth={1} />
            <text x={2} y={py(g) + 3} fontSize={8} fill="#a6938e">
              {g}
            </text>
          </g>
        ))}
        <path d={path(partner)} fill="none" stroke="#e8718a" strokeWidth={2} />
        <path d={path(you)} fill="none" stroke="#fd4f61" strokeWidth={2} />
        {partner.map((v, i) =>
          v == null ? null : <circle key={`p${i}`} cx={px(i)} cy={py(v)} r={2.6} fill="#e8718a" />,
        )}
        {you.map((v, i) =>
          v == null ? null : <circle key={`y${i}`} cx={px(i)} cy={py(v)} r={2.6} fill="#fd4f61" />,
        )}
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, fontWeight: 700 }}>
        <span style={{ color: '#fd4f61' }}>● Пользователь</span>
        <span style={{ color: '#e8718a' }}>● Партнёр</span>
      </div>
    </div>
  );
}

async function saveUser(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  // Профиль пользователя (имя/email/пол/дата) админ не меняет — только Savel+.
  await adminApi(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ savelPlus: formData.get('savelPlus') === 'on' }),
  });
  revalidatePath(`/admin/users/${id}`);
  revalidatePath('/admin/users');
}

async function deleteUser(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  await adminApi(`/users/${id}`, { method: 'DELETE' });
  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export default async function AdminUserPage({ params }: Props) {
  const { id } = await params;
  let user: AdminUserDetail;
  try {
    user = await adminApi<AdminUserDetail>(`/users/${id}`);
  } catch {
    notFound();
  }

  return (
    <>
      <div className="adminPageHead">
        <div>
          <h1 className="adminH1">{user.name || 'Без имени'}</h1>
          <p className="adminSub">
            Код {user.pair_code} · вход через {user.providers || '—'} ·{' '}
            {user.partner_name ? `в паре с ${user.partner_name}` : 'не в паре'} · регистрация{' '}
            {dateTimeRu(user.created_at)}
          </p>
        </div>
        <Link className="adminGhostLink" href="/admin/users">
          ← К списку
        </Link>
      </div>

      <div className="statCard profileCard">
        <div className="profileField">
          <span>Имя</span>
          <b>{user.name || '—'}</b>
        </div>
        <div className="profileField">
          <span>Email</span>
          <b>{user.email || '—'}</b>
        </div>
        <div className="profileField">
          <span>Пол</span>
          <b>{user.gender === 'male' ? 'Мужской' : user.gender === 'female' ? 'Женский' : '—'}</b>
        </div>
        <div className="profileField">
          <span>Дата рождения</span>
          <b>{user.birth_date ? dateRu(user.birth_date) : '—'}</b>
        </div>
        <p className="adminSub" style={{ width: '100%', margin: 0 }}>
          Личные данные пользователь заполняет сам в приложении — здесь только для просмотра.
        </p>
      </div>

      <form action={saveUser} className="statCard categoryEditForm adminForm">
        <input type="hidden" name="id" value={user.id} />
        <div className="categoryEditMeta">
          <label className="categoryActiveCheck">
            <input type="checkbox" name="savelPlus" defaultChecked={user.savel_plus} /> Savel+
            (ручное управление)
          </label>
        </div>
        <div className="categoryEditActions">
          <button className="adminBtn" type="submit">
            Сохранить Savel+
          </button>
          <ConfirmButton
            className="adminDangerBtn"
            formAction={deleteUser}
            formNoValidate
            type="submit"
            confirmText="Удалить пользователя безвозвратно? Пара будет расторгнута, вся общая история (чаты, ответы, чек-апы) удалится и у партнёра.">
            Удалить пользователя
          </ConfirmButton>
        </div>
      </form>

      <h2 className="adminH2">История подписки ({user.subscriptions.length})</h2>
      {user.subscriptions.length === 0 ? (
        <p className="adminSub">Событий подписки ещё нет.</p>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Событие</th>
                <th>Тариф</th>
                <th>Источник</th>
                <th>Примечание</th>
              </tr>
            </thead>
            <tbody>
              {user.subscriptions.map(event => (
                <tr key={event.id}>
                  <td>{dateTimeRu(event.created_at)}</td>
                  <td>
                    <span
                      className={
                        event.action === 'admin_revoke' ? 'pill pillMuted' : 'pill pillGreen'
                      }>
                      {ACTION_LABEL[event.action]}
                    </span>
                  </td>
                  <td>{event.plan ?? '—'}</td>
                  <td>{event.source === 'admin' ? 'Админ' : 'Приложение'}</td>
                  <td>{event.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Пара и партнёр */}
      <h2 className="adminH2">Пара и партнёр</h2>
      {user.couple ? (
        <>
          <div className="statGrid">
            <div className="statCard">
              <span>Партнёр</span>
              <b style={{ fontSize: 18 }}>{user.partner_name || '—'}</b>
            </div>
            <div className="statCard">
              <span>Вместе с</span>
              <b style={{ fontSize: 18 }}>{dateRu(user.couple.together_since)}</b>
            </div>
            <div className="statCard">
              <span>Индекс отношений</span>
              <b style={{ fontSize: 18 }}>{user.couple.relationship_index ?? '—'}</b>
            </div>
            <div className="statCard">
              <span>Savel+ пары</span>
              <b style={{ fontSize: 18 }}>
                {user.couple.savel_plus ? (user.couple.plan ?? 'да') : '—'}
              </b>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <Link className="adminGhostLink" href={`/admin/couples/${user.couple.id}`}>
              Открыть пару →
            </Link>
            {user.partner_id ? (
              <Link className="adminGhostLink" href={`/admin/users/${user.partner_id}`}>
                Открыть партнёра →
              </Link>
            ) : null}
          </div>
        </>
      ) : (
        <p className="adminSub">Пользователь не в паре.</p>
      )}

      {/* График чек-апов с партнёром */}
      <h2 className="adminH2">График чек-апов</h2>
      <p className="adminSub">Баллы чек-апов пользователя и партнёра во времени (0–100).</p>
      <div style={{ marginTop: 12 }}>
        <CheckupChart you={user.graph.you} partner={user.graph.partner} />
      </div>

      {/* Пройденные чек-апы пользователя */}
      <h2 className="adminH2">Пройденные чек-апы ({user.checkups.length})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {user.checkups.length === 0 ? (
          <p className="adminSub">Пользователь ещё не проходил чек-апы.</p>
        ) : (
          user.checkups.map(result => (
            <details key={result.id} className="statCard" style={{ padding: 0 }}>
              <summary
                style={{
                  cursor: 'pointer',
                  listStyle: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                }}>
                <span className="pill pillMuted">{result.collectionTitle || 'Чек-ап'}</span>
                <span className="pill pillCoral">{result.score} / 100</span>
                <span style={{ marginLeft: 'auto', color: '#8b7d78', fontSize: 13 }}>
                  {dateTimeRu(result.createdAt)}
                </span>
              </summary>
              <div style={{ borderTop: '1px solid #efe6e1', padding: '10px 16px 14px' }}>
                <ol
                  style={{
                    margin: 0,
                    paddingLeft: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}>
                  {result.answers.map(answer => (
                    <li key={answer.n} style={{ fontSize: 14, lineHeight: 1.4 }}>
                      <span>{answer.text}</span>{' '}
                      <span className="pill pillGreen" style={{ marginLeft: 4 }}>
                        {answer.value} / 5
                      </span>
                      {answer.note ? (
                        <div style={{ color: '#8b7d78', fontSize: 13, marginTop: 2 }}>
                          «{answer.note}»
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          ))
        )}
      </div>

      {/* Ответы на вопросы */}
      <h2 className="adminH2">Ответы на вопросы ({user.answers.length})</h2>
      {user.answers.length === 0 ? (
        <p className="adminSub">Пользователь ещё не отвечал на вопросы.</p>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Тип</th>
                <th>Вопрос</th>
                <th>Ответ</th>
                <th>Заметка</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {user.answers.map((row, i) => (
                <tr key={i}>
                  <td>
                    <span className={`pill ${row.source === 'Подборка' ? 'pillCoral' : 'pillGreen'}`}>
                      {row.source}
                    </span>
                  </td>
                  <td style={{ maxWidth: 260 }}>
                    {row.question_text}
                    {row.collection_title ? (
                      <div style={{ color: '#8b7d78', fontSize: 12, marginTop: 2 }}>
                        {row.collection_title}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ maxWidth: 240, fontWeight: 700 }}>{row.answer}</td>
                  <td style={{ color: '#8b7d78' }}>{row.note ? `«${row.note}»` : '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{dateTimeRu(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Чаты пары */}
      <h2 className="adminH2">Чаты ({user.chats.length})</h2>
      {user.chats.length === 0 ? (
        <p className="adminSub">Чатов пока нет.</p>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Название</th>
                <th>Подпись</th>
                <th>Сообщений</th>
                <th>Обновлён</th>
              </tr>
            </thead>
            <tbody>
              {user.chats.map(chat => (
                <tr key={chat.id}>
                  <td>{chat.title}</td>
                  <td>{chat.subtitle || '—'}</td>
                  <td>{chat.messages}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{dateTimeRu(chat.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
