import Link from 'next/link';
import { adminApi, type AdminCoupleDetail } from '@/lib/adminApi';

export const dynamic = 'force-dynamic';

function dateRu(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU');
}

function dateTimeRu(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Props = { params: Promise<{ id: string }> };

export default async function AdminCoupleDetailPage({ params }: Props) {
  const { id } = await params;
  let data: AdminCoupleDetail | null = null;
  let error: string | null = null;
  try {
    data = await adminApi<AdminCoupleDetail>(`/couples/${id}`);
  } catch (e) {
    error = e instanceof Error ? e.message : 'API недоступен';
  }

  if (error || !data) {
    return (
      <>
        <Link className="adminGhostLink" href="/admin/couples">
          ← К парам
        </Link>
        <div className="statCard" style={{ marginTop: 14 }}>
          <b style={{ fontSize: 18 }}>Не удалось загрузить пару</b>
          <span>{error}</span>
        </div>
      </>
    );
  }

  const memberNames = data.members.map(m => m.name || '—').join(' и ');

  return (
    <>
      <Link className="adminGhostLink" href="/admin/couples">
        ← К парам
      </Link>
      <h1 className="adminH1" style={{ marginTop: 8 }}>
        {memberNames || 'Пара'}
      </h1>

      {/* Сводка по паре */}
      <div className="statGrid" style={{ marginTop: 12 }}>
        <div className="statCard">
          <span>Вместе с</span>
          <b style={{ fontSize: 18 }}>{dateRu(data.together_since)}</b>
        </div>
        <div className="statCard">
          <span>Индекс отношений</span>
          <b style={{ fontSize: 18 }}>{data.relationship_index ?? '—'}</b>
        </div>
        <div className="statCard">
          <span>Savel+</span>
          <b style={{ fontSize: 18 }}>{data.savel_plus ? (data.plan ?? 'да') : '—'}</b>
        </div>
        <div className="statCard">
          <span>Создана</span>
          <b style={{ fontSize: 18 }}>{dateRu(data.created_at)}</b>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        {data.members.map(m => (
          <span key={m.id} className="pill pillMuted">
            {m.name || '—'}
            {m.savel_plus ? ' · Savel+' : ''}
          </span>
        ))}
      </div>

      {/* Результаты чек-апов */}
      <h2 className="adminH1" style={{ fontSize: 20, marginTop: 26 }}>
        Результаты чек-апов
      </h2>
      <p className="adminSub">Каждое прохождение с ответами по вопросам, новые — сверху.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {data.checkups.length === 0 ? (
          <div className="statCard" style={{ color: '#8b7d78' }}>
            Пара ещё не проходила чек-апы.
          </div>
        ) : (
          data.checkups.map(result => (
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
                <span style={{ fontWeight: 800, fontSize: 15 }}>{result.userName || '—'}</span>
                <span className="pill pillMuted">{result.collectionTitle || 'Чек-ап'}</span>
                <span className="pill pillCoral">{result.score} / 100</span>
                <span style={{ marginLeft: 'auto', color: '#8b7d78', fontSize: 13 }}>
                  {dateTimeRu(result.createdAt)}
                </span>
              </summary>
              <div style={{ borderTop: '1px solid #efe6e1', padding: '10px 16px 14px' }}>
                {result.answers.length === 0 ? (
                  <span style={{ color: '#8b7d78' }}>Нет ответов.</span>
                ) : (
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
                )}
              </div>
            </details>
          ))
        )}
      </div>

      {/* Ответы на вопросы */}
      <h2 className="adminH1" style={{ fontSize: 20, marginTop: 26 }}>
        Ответы на вопросы
      </h2>
      <p className="adminSub">Вопрос недели и вопросы подборок, новые — сверху.</p>
      <div className="adminTableWrap" style={{ marginTop: 12 }}>
        <table className="adminTable">
          <thead>
            <tr>
              <th>Тип</th>
              <th>Пользователь</th>
              <th>Вопрос</th>
              <th>Ответ</th>
              <th>Заметка</th>
              <th>Дата</th>
            </tr>
          </thead>
          <tbody>
            {data.answers.map((row, i) => (
              <tr key={i}>
                <td>
                  <span className={`pill ${row.source === 'Подборка' ? 'pillCoral' : 'pillGreen'}`}>
                    {row.source}
                  </span>
                </td>
                <td>{row.user_name || '—'}</td>
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
            {data.answers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ color: '#8b7d78' }}>
                  Пара ещё не отвечала на вопросы.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
