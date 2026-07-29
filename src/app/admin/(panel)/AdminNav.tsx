'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Меню админки. Клиентский компонент ТОЛЬКО ради подсветки текущего раздела:
 * 13 одинаковых ссылок не давали понять, где ты находишься. Данные (счётчик
 * поддержки) приходят пропсом с сервера — сам компонент ничего не грузит.
 *
 * Ссылки собраны в группы по РОДУ ЗАНЯТИЯ: раньше «Пользователи» и «Значения»
 * стояли в одном ряду, и глазу приходилось читать все тринадцать подписей,
 * чтобы найти нужную. «Обзор» идёт без группы — он один и всегда первый.
 */

interface NavItem {
  href: string;
  label: string;
}
interface NavGroup {
  /** Пустой заголовок — группа без подписи (только «Обзор»). */
  title: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  { title: '', items: [{ href: '/admin', label: 'Обзор' }] },
  {
    // Ежедневная работа: сюда заходят чаще всего, поэтому группа стоит первой.
    title: 'Люди',
    items: [
      { href: '/admin/users', label: 'Пользователи' },
      { href: '/admin/couples', label: 'Пары' },
      { href: '/admin/support', label: 'Поддержка' },
    ],
  },
  {
    // Всё, что пользователь читает в приложении.
    title: 'Контент',
    items: [
      { href: '/admin/categories', label: 'Категории' },
      { href: '/admin/collections', label: 'Вопросы' },
      { href: '/admin/checkup', label: 'Чек-ап' },
      { href: '/admin/boost', label: 'Буст' },
      { href: '/admin/notifications', label: 'Уведомления' },
    ],
  },
  {
    title: 'Деньги',
    items: [
      { href: '/admin/subscriptions', label: 'Подписки' },
      { href: '/admin/referrals', label: 'Рефералы' },
    ],
  },
  {
    // Настройки: меняются редко, поэтому в самом конце.
    title: 'Настройки',
    items: [
      { href: '/admin/schedule', label: 'Расписание' },
      { href: '/admin/settings', label: 'Значения' },
    ],
  },
];

/** «Обзор» активен только на самом /admin, остальные — вместе с вложенными страницами. */
function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNav({
  supportUnread,
  children,
}: {
  /** Сколько диалогов поддержки ждут ответа; 0/undefined — бейджа нет. */
  supportUnread?: number;
  /** Кнопка «Выйти» (server action) — приезжает из layout. */
  children?: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  return (
    <nav className="adminNav">
      <div className="adminBrand">
        Savel <span>ADMIN</span>
      </div>
      {GROUPS.map(group => (
        <div className="navGroup" key={group.title || 'root'}>
          {/* Название группы — только для скринридера. Видимые подписи над
              каждой группой рвали строку и оставляли дыры при переносе;
              глазу достаточно разделителя, а озвучке нужно слово. */}
          <ul className="navGroupItems" aria-label={group.title || undefined}>
            {group.items.map(item => {
              const active = isActive(pathname, item.href);
              const badge = item.href === '/admin/support' && supportUnread ? supportUnread : 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={active ? 'adminNavOn' : undefined}
                    aria-current={active ? 'page' : undefined}>
                    {item.label}
                    {badge ? (
                      <span className="navBadge" title={`${badge} диалогов ждут ответа`}>
                        {badge > 99 ? '99+' : badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {children}
    </nav>
  );
}
