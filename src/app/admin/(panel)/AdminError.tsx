/**
 * Карточка «API недоступен» для страниц списка. Раньше этот блок был скопирован
 * в каждой вкладке и успел разойтись формулировками — один компонент держит их
 * одинаковыми и даёт админу понятную причину вместо голого кода ошибки.
 */
export default function AdminError({
  error,
  title = 'API недоступен',
}: {
  error: string | null;
  title?: string;
}) {
  return (
    <div className="statCard adminErrorCard">
      <b style={{ fontSize: 18 }}>{title}</b>
      <span>
        {error ?? 'Неизвестная ошибка'} — проверьте, что Savel_server запущен и SAVEL_API_URL /
        ADMIN_TOKEN заданы в .env.
      </span>
    </div>
  );
}
