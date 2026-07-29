import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, adminApi, isAdminAuthed, revokeAdminSession, type AdminStats } from '@/lib/adminApi';
import AdminNav from './AdminNav';
import '../admin.css';

export const metadata: Metadata = {
  title: 'Savel Admin',
  robots: { index: false, follow: false },
};

async function logout() {
  'use server';
  const jar = await cookies();
  // Отзываем сессию НА СЕРВЕРЕ (cookie-делит сам по себе ничего не отзывает).
  revokeAdminSession(jar.get(ADMIN_COOKIE)?.value);
  // path обязан совпадать с тем, с которым cookie ставился ('/admin'):
  // delete() без path шлёт Set-Cookie с Path=/, и браузер оставляет живой
  // cookie с Path=/admin — «Выйти» не выходил.
  jar.delete({ name: ADMIN_COOKIE, path: '/admin' });
  redirect('/admin/login');
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login');
  }

  // Счётчик ждущих ответа диалогов — единственное срочное в панели, поэтому он
  // висит в меню на всех страницах. Недоступный API не должен ронять админку:
  // без счётчика она полностью работоспособна, поэтому ошибку глотаем.
  let supportUnread = 0;
  try {
    supportUnread = (await adminApi<AdminStats>('/stats')).support_unread ?? 0;
  } catch {
    supportUnread = 0;
  }

  return (
    <div className="adminShell">
      <div className="adminInner">
        <AdminNav supportUnread={supportUnread}>
          <form action={logout}>
            <button className="adminGhostBtn" type="submit">
              Выйти
            </button>
          </form>
        </AdminNav>
        {children}
      </div>
    </div>
  );
}
