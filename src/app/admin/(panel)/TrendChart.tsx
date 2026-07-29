'use client';

import { useId, useState } from 'react';

/*
 * ⚠️ Цвета внутри <svg> задаются через style, а НЕ через атрибуты stroke/fill:
 * var() — конструкция CSS, и в презентационном атрибуте SVG она не вычисляется
 * (линия молча становится чёрной). style — настоящий CSS, там var() работает.
 */

/**
 * Дневной линейный график на две серии. Один компонент на все графики
 * дашборда: копия этого файла ради второй пары линий разошлась бы с оригиналом
 * при первой же правке.
 *
 * Одна ось — потому что обе серии в КАЖДОМ графике меряются одним и тем же:
 * «сколько штук за день». Две шкалы на одном полотне рисовали бы
 * несуществующую связь между кривыми. Серии с разными единицами сюда класть
 * нельзя — им нужен свой график.
 *
 * Цвета — коралловый бренда и фиолетовый; пара проверена валидатором палитры
 * на белой карточке (CVD ΔE 23.0 при пороге 8, обычное зрение 37.0 при
 * пороге 15, контраст обоих ≥ 3:1). Разным графикам разные палитры не нужны:
 * рядом друг с другом их серии не сравнивают. Легенда есть всегда: различать
 * серии только по цвету нельзя.
 */

/** Точка ряда: дата + произвольные числовые поля, которые выберет график. */
export type TrendPoint = { date: string } & Record<string, number | string>;

export interface SeriesSpec {
  /** Поле в точке ряда. */
  key: string;
  label: string;
  color: string;
  /** Формы для тултипа: 1 / 2–4 / 5+ («подключение», «подключения», «подключений»). */
  forms: readonly [string, string, string];
}

/** Готовые наборы серий — чтобы страницы не собирали их вручную. */
export const USERS_SERIES: SeriesSpec[] = [
  {
    key: 'users',
    label: 'Пользователи',
    // Значения — в admin.css (--chart-a/--chart-b); пара проверена валидатором
    // и менять её можно только целиком, с повторной проверкой.
    color: 'var(--chart-a)',
    forms: ['пользователь', 'пользователя', 'пользователей'],
  },
  { key: 'couples', label: 'Пары', color: 'var(--chart-b)', forms: ['пара', 'пары', 'пар'] },
];

export const PLUS_SERIES: SeriesSpec[] = [
  {
    key: 'plus_granted',
    label: 'Подключения',
    color: 'var(--chart-a)',
    forms: ['подключение', 'подключения', 'подключений'],
  },
  {
    key: 'plus_revoked',
    label: 'Отключения',
    color: 'var(--chart-b)',
    forms: ['отключение', 'отключения', 'отключений'],
  },
];

/** Русское склонение по числу: 1 / 2–4 / 5+ (с оговорками на 11–14). */
function plural(n: number, forms: readonly [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

// Геометрия. Подпись оси включена В ВЫСОТУ полотна — иначе карточка обзаводится
// собственным вертикальным скроллом ради последней строки подписей.
const W = 720;
const H = 260;
const PAD = { top: 14, right: 16, bottom: 30, left: 42 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

/** Круглый потолок оси: 7 → 10, 23 → 25, 140 → 150. */
function niceMax(value: number): number {
  if (value <= 4) return Math.max(value, 4);
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = magnitude / 2;
  return Math.ceil(value / step) * step;
}

/** «15.07» — короткая подпись даты для оси. */
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}.${m}`;
}

/** «15 июля 2026» — полная подпись для тултипа и таблицы. */
const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

export default function TrendChart({
  series,
  specs,
  title,
}: {
  series: TrendPoint[];
  specs: SeriesSpec[];
  title: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId();

  if (series.length < 2) {
    return <p className="adminSub">Данных для графика пока нет.</p>;
  }

  const at = (p: TrendPoint, key: string) => Number(p[key] ?? 0);
  const peak = Math.max(...series.flatMap(p => specs.map(s => at(p, s.key))));
  const yMax = niceMax(peak);
  const stepX = PLOT_W / (series.length - 1);
  const x = (i: number) => PAD.left + i * stepX;
  const y = (v: number) => PAD.top + PLOT_H - (v / yMax) * PLOT_H;

  const path = (key: string) =>
    series
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(at(p, key)).toFixed(1)}`)
      .join(' ');

  // 4 линии сетки, круглые значения; они несут числа, которые не подписаны у точек.
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(yMax * f));
  const uniqueTicks = [...new Set(ticks)];

  // Подписей по X — максимум 6, иначе они наезжают друг на друга.
  const labelEvery = Math.max(1, Math.ceil(series.length / 6));

  const active = hover === null ? null : series[hover];

  return (
    <div className="trendCard">
      <div className="trendHead">
        <div>
          <h2 className="trendTitle">{title}</h2>
          <p className="trendSub">По дням за последние {series.length} дней</p>
        </div>
        {/* Легенда обязательна при двух сериях: идентичность не должна держаться на одном цвете. */}
        <ul className="trendLegend">
          {specs.map(s => (
            <li key={s.key}>
              <span className="trendKey" style={{ background: s.color }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="trendPlot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="trendSvg"
          role="img"
          aria-label={`График «${title}» по дням за ${series.length} дней. Значения доступны в таблице под графиком.`}>
          <defs>
            <clipPath id={clipId}>
              <rect x={PAD.left} y={PAD.top} width={PLOT_W} height={PLOT_H} />
            </clipPath>
          </defs>

          {/* Сетка и подписи оси Y — сплошные волосяные линии, приглушённые. */}
          {uniqueTicks.map(t => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                style={{ stroke: 'var(--border)' }}
                strokeWidth="1"
              />
              <text x={PAD.left - 10} y={y(t) + 4} className="trendTick trendTickY">
                {t}
              </text>
            </g>
          ))}

          {/* Подписи оси X */}
          {series.map((p, i) =>
            i % labelEvery === 0 || i === series.length - 1 ? (
              <text key={p.date} x={x(i)} y={H - 10} className="trendTick trendTickX">
                {shortDate(p.date)}
              </text>
            ) : null,
          )}

          {/* Курсор-перекрестие: читатель целится в дату, а не в двухпиксельную линию. */}
          {hover !== null ? (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              style={{ stroke: 'var(--text-faint)' }}
              strokeWidth="1"
            />
          ) : null}

          <g clipPath={`url(#${clipId})`}>
            {specs.map(s => (
              <path
                key={s.key}
                d={path(s.key)}
                fill="none"
                style={{ stroke: s.color }}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>

          {/* Точка на конце каждой серии + точки под курсором. Кольцо цветом
              поверхности держит их читаемыми там, где линии пересекаются. */}
          {specs.map(s => {
            const last = series.length - 1;
            const marks = hover === null ? [last] : [...new Set([last, hover])];
            return marks.map(i => (
              <circle
                key={`${s.key}-${i}`}
                cx={x(i)}
                cy={y(at(series[i]!, s.key))}
                r="4.5"
                style={{ fill: s.color }}
                stroke="#fff"
                strokeWidth="2"
              />
            ));
          })}

          {/* Прозрачный слой попадания: цель шире марки, целиться в линию не надо. */}
          {series.map((p, i) => (
            <rect
              key={p.date}
              x={x(i) - stepX / 2}
              y={PAD.top}
              width={stepX}
              height={PLOT_H}
              fill="transparent"
              onPointerEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              role="button"
              aria-label={`${longDate(p.date)}: ${specs
                .map(s => `${at(p, s.key)} ${plural(at(p, s.key), s.forms)}`)
                .join(', ')}`}
            />
          ))}
        </svg>

        {active ? (
          <div
            className="trendTip"
            style={{
              // Тултип уходит влево на правой половине графика, чтобы не выпасть за карточку.
              left: `${(x(hover!) / W) * 100}%`,
              transform: hover! > series.length / 2 ? 'translateX(-105%)' : 'translateX(5%)',
            }}
            role="status">
            <b>{longDate(active.date)}</b>
            {specs.map(s => (
              <span key={s.key} className="trendTipRow">
                <span className="trendTipKey" style={{ background: s.color }} aria-hidden="true" />
                <b>{at(active, s.key)}</b> {plural(at(active, s.key), s.forms)}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Таблица-двойник: тултип ДОПОЛНЯЕТ, но не является единственным способом
          прочитать значение. */}
      <details className="trendTable">
        <summary>Показать таблицей</summary>
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Дата</th>
                {specs.map(s => (
                  <th key={s.key}>{s.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...series].reverse().map(p => (
                <tr key={p.date}>
                  <td>{longDate(p.date)}</td>
                  {specs.map(s => (
                    <td key={s.key} className="numCell">
                      {at(p, s.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
