'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Живой монитор хоста: CPU и память тиками по секунде через SSE.
 *
 * Ось Y у обоих графиков зафиксирована на 0..100% НАМЕРЕННО. Автомасштаб
 * нарисовал бы из шума 0.0–0.3% горный хребет во весь холст, и спокойный сервер
 * выглядел бы как горящий. Плоская линия у нуля — это правда, и она должна
 * выглядеть плоской.
 */

interface Sample {
  t: number;
  cpu: number;
  cores: number[];
  steal: number | null;
  mem: { total: number; used: number; available: number; cache: number; percent: number };
  swap: { total: number; used: number };
  load: [number, number, number];
}

interface Info {
  hostname: string;
  platform: string;
  cpuModel: string;
  cores: number;
  uptime: number;
  processUptime: number;
  node: string;
  processRss: number;
  disk: { total: number; free: number; used: number; percent: number } | null;
}

/** Точек на графике: 300 тиков по секунде = последние 5 минут. */
const WINDOW = 300;

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 Б';
  const units = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

function formatUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d} д ${h} ч`;
  if (h > 0) return `${h} ч ${m} мин`;
  return `${m} мин`;
}

/**
 * График-лента: новая точка входит справа, старая уходит влево. Данные
 * прижаты к правому краю, поэтому первые секунды после запуска лента
 * заполняется, а не растягивается на всю ширину.
 */
function LiveChart({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    return <div className="sysChart sysChartEmpty">ждём данные…</div>;
  }
  const step = 100 / (WINDOW - 1);
  const x = (i: number) => 100 - (values.length - 1 - i) * step;
  const y = (v: number) => 100 - Math.max(0, Math.min(100, v));
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
  const area = `${line} L${x(values.length - 1).toFixed(2)},100 L${x(0).toFixed(2)},100 Z`;
  return (
    <svg className="sysChart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      {[25, 50, 75].map(g => (
        <line key={g} x1="0" y1={g} x2="100" y2={g} className="sysGrid" vectorEffect="non-scaling-stroke" />
      ))}
      {/* Цвет — только через style: var() в презентационном атрибуте SVG не
          вычисляется и линия молча станет чёрной (см. TrendChart). */}
      <path d={area} style={{ fill: color, opacity: 0.13 }} />
      <path
        d={line}
        style={{ stroke: color, fill: 'none', strokeWidth: 1.6 }}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SystemMonitor() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [info, setInfo] = useState<Info | null>(null);
  const [live, setLive] = useState(false);
  // Ререндер раз в секунду и так идёт от новых точек; ref держит поток вне стейта.
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/admin/api/system');
    esRef.current = es;
    es.addEventListener('info', e => {
      const payload = JSON.parse((e as MessageEvent).data) as { info: Info };
      setInfo(payload.info);
    });
    es.addEventListener('history', e => {
      setSamples((JSON.parse((e as MessageEvent).data) as Sample[]).slice(-WINDOW));
      setLive(true);
    });
    es.addEventListener('sample', e => {
      const s = JSON.parse((e as MessageEvent).data) as Sample;
      setLive(true);
      setSamples(prev => [...prev, s].slice(-WINDOW));
    });
    // EventSource переподключается сам; наше дело — показать, что связи нет.
    es.onerror = () => setLive(false);
    return () => {
      es.close();
      esRef.current = null;
    };
  }, []);

  const last = samples[samples.length - 1] ?? null;
  const cpuSeries = samples.map(s => s.cpu);
  const memSeries = samples.map(s => s.mem.percent);

  return (
    <div className="sysWrap">
      <div className="sysHead">
        <div>
          <b>{info?.hostname ?? 'сервер'}</b>
          <span>
            {info ? `${info.cpuModel} · ${info.cores} ${info.cores === 1 ? 'ядро' : 'ядра'}` : '—'}
          </span>
        </div>
        <span className={live ? 'sysLive' : 'sysLive sysLiveOff'}>
          {live ? 'в реальном времени' : 'нет связи'}
        </span>
      </div>

      <div className="sysGraphs">
        <section className="sysCard">
          <header>
            <span className="sysLabel">Процессор</span>
            <b className="sysValue">{last ? last.cpu.toFixed(1) : '—'}<i>%</i></b>
          </header>
          <LiveChart values={cpuSeries} color="var(--chart-a)" />
          <footer>
            <span>
              Средняя нагрузка{' '}
              <b>{last ? last.load.map(v => v.toFixed(2)).join(' · ') : '—'}</b>
            </span>
            {last?.steal != null && last.steal > 0 && (
              <span className="sysWarn">гипервизор забрал {last.steal.toFixed(1)}%</span>
            )}
          </footer>
        </section>

        <section className="sysCard">
          <header>
            <span className="sysLabel">Память</span>
            <b className="sysValue">{last ? last.mem.percent.toFixed(0) : '—'}<i>%</i></b>
          </header>
          <LiveChart values={memSeries} color="var(--chart-b)" />
          <footer>
            <span>
              Занято <b>{last ? formatBytes(last.mem.used) : '—'}</b> из{' '}
              {last ? formatBytes(last.mem.total) : '—'}
            </span>
            <span>
              Свободно <b>{last ? formatBytes(last.mem.available) : '—'}</b>
            </span>
          </footer>
        </section>
      </div>

      {/* Кэш и своп рядом с памятью не случайно: без них «занято 51%» читается
          как тревога, хотя ядро отдаст кэш в ту же секунду, как он понадобится. */}
      <div className="sysFacts">
        <div>
          <span>Кэш ядра</span>
          <b>{last ? formatBytes(last.mem.cache) : '—'}</b>
          <i>вернётся приложениям по требованию</i>
        </div>
        <div>
          <span>Подкачка</span>
          <b>
            {last && last.swap.total > 0
              ? `${formatBytes(last.swap.used)} из ${formatBytes(last.swap.total)}`
              : 'выключена'}
          </b>
          <i>{last && last.swap.used > last.swap.total * 0.5 ? 'памяти не хватает' : 'в норме'}</i>
        </div>
        <div>
          <span>Диск</span>
          <b>{info?.disk ? `${formatBytes(info.disk.free)} свободно` : '—'}</b>
          <i>{info?.disk ? `занято ${info.disk.percent.toFixed(0)}%` : ''}</i>
        </div>
        <div>
          <span>Аптайм</span>
          <b>{info ? formatUptime(info.uptime) : '—'}</b>
          <i>{info ? `API ${formatUptime(info.processUptime)} · ${formatBytes(info.processRss)}` : ''}</i>
        </div>
      </div>
    </div>
  );
}
