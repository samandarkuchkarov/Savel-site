import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ADMIN_COOKIE,
  evaluateLogin,
  issueAdminSession,
  loginFailDelay,
  verifyAdminPassword,
} from '@/lib/adminApi';
import { SESSION_TTL_DAYS } from '@/lib/adminSession';
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
  // null (нет XFF / мусор) → один общий ключ: fail-closed, не лазейка.
  const ip = (await clientIp()) ?? 'unknown';

  // Пароль проверяем ПЕРВЫМ и передаём результат в лимитер: верный пароль всегда
  // даёт 'ok' и логинит немедленно, не глядя на счётчики. Иначе флуд неверных
  // POST'ов выбивал бы глобальный кап и запирал настоящего админа (DoS). Счётчики
  // трогают только неудачные попытки (evaluateLogin).
  const outcome = evaluateLogin(verifyAdminPassword(formData.get('password')), ip);
  if (outcome === 'ok') {
    const jar = await cookies();
    jar.set(ADMIN_COOKIE, issueAdminSession(), {
      httpOnly: true,
      sameSite: 'lax',
      // Без secure cookie ушёл бы открытым текстом при случайном http-запросе
      // (до редиректа Caddy на https). На localhost в dev secure не нужен.
      secure: process.env.NODE_ENV === 'production',
      path: '/admin',
      // Срок жизни cookie в браузере обязан совпадать со сроком ВНУТРИ подписи:
      // иначе браузер месяц носит значение, которое сервер давно не принимает.
      maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    });
    redirect('/admin');
  }
  // Неверный пароль. 'wrong' — обычная попытка (тормозим паузой, режем перебор);
  // 'rate' — лимит исчерпан, быстрый отказ без задержки (не держим коннект во
  // время флуда). redirect() бросает — задержку ставим ДО него.
  if (outcome === 'wrong') await loginFailDelay();
  redirect(outcome === 'rate' ? '/admin/login?error=rate' : '/admin/login?error=1');
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
