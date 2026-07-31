import SystemMonitor from './SystemMonitor';

export const dynamic = 'force-dynamic';

export default function AdminServerPage() {
  return (
    <>
      <h1 className="adminH1">Сервер</h1>
      <p className="adminSub">
        Данные приходят с машины раз в секунду, пока открыта эта вкладка. График держит последние
        пять минут.
      </p>
      <SystemMonitor />
    </>
  );
}
