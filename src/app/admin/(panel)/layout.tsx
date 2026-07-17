import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, isAdminAuthed, revokeAdminSession } from '@/lib/adminApi';
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
  return (
    <div className="adminShell">
      <div className="adminInner">
        <nav className="adminNav">
          <div className="adminBrand">
            Savel <span>ADMIN</span>
          </div>
          <Link href="/admin">Обзор</Link>
          <Link href="/admin/schedule">Расписание</Link>
          <Link href="/admin/users">Пользователи</Link>
          <Link href="/admin/couples">Пары</Link>
          <Link href="/admin/categories">Категории</Link>
          <Link href="/admin/collections">Вопросов</Link>
          <Link href="/admin/checkup">Чек-ап</Link>
          <Link href="/admin/boost">Буст</Link>
          <Link href="/admin/settings">Значения</Link>
          <Link href="/admin/notifications">Уведомления</Link>
          <form action={logout}>
            <button className="adminGhostBtn" type="submit">
              Выйти
            </button>
          </form>
        </nav>
        {children}
      </div>
    </div>
  );
}
