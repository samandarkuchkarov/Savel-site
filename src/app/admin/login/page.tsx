import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_COOKIE,
  clearLoginAttempts,
  issueAdminSession,
  loginFailDelay,
  loginRateLimited,
  verifyAdminPassword,
} from '@/lib/adminApi';
import { clientIp } from '@/lib/clientIp';
import '../admin.css';

export const metadata: Metadata = {
  title: 'Savel Admin — вход',
  robots: { index: false, follow: false },
};

async function login(formData: FormData) {
  'use server';
  // Ключ лимита — IP из ДОВЕРЕННОЙ части X-Forwarded-For (общий clientIp()):
  // Caddy дописывает реальный адрес СПРАВА, а левые записи подделывает клиент.
  // Раньше здесь брали `.split(',')[0]` — атакующий слал новый фейковый первый
  // IP на каждом запросе, получал свежее окно и перебирал пароль без лимита.
  // null (нет XFF / мусор) → один общий ключ: fail-closed, не лазейка.
  const ip = (await clientIp()) ?? 'unknown';
  if (loginRateLimited(ip)) redirect('/admin/login?error=rate');
  if (verifyAdminPassword(formData.get('password'))) {
    clearLoginAttempts(ip);
    const jar = await cookies();
    jar.set(ADMIN_COOKIE, issueAdminSession(), {
      httpOnly: true,
      sameSite: 'lax',
      // Без secure cookie ушёл бы открытым текстом при случайном http-запросе
      // (до редиректа Caddy на https). На localhost в dev secure не нужен.
      secure: process.env.NODE_ENV === 'production',
      path: '/admin',
      maxAge: 60 * 60 * 24 * 30,
    });
    redirect('/admin');
  }
  // Пауза только на неверном пароле (redirect() бросает — ставим ДО него).
  await loginFailDelay();
  redirect('/admin/login?error=1');
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="adminShell">
      <div className="loginCard">
        <div className="adminBrand" style={{ justifyContent: 'center' }}>
          Savel <span>ADMIN</span>
        </div>
        <h1>Панель управления</h1>
        <p>Введите пароль администратора</p>
        <form action={login} className="adminForm" style={{ flexDirection: 'column' }}>
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            autoFocus
            required
            style={{ width: '100%' }}
          />
          <button className="adminBtn" type="submit" style={{ width: '100%' }}>
            Войти
          </button>
        </form>
        {error === 'rate' ? (
          <div className="loginError">Слишком много попыток. Подождите 15 минут.</div>
        ) : error ? (
          <div className="loginError">Неверный пароль</div>
        ) : null}
      </div>
    </div>
  );
}
