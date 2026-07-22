'use client';

import { useState } from 'react';
import { APK_URL, APK_FILENAME, APP_VERSION } from '@/lib/appDownload';

/**
 * Кнопки на лендинге приглашения. «Копировать код» — клиентское действие,
 * поэтому вынесено в отдельный клиентский компонент (страница остаётся серверной).
 * «Скачать для Android» отдаёт APK напрямую (тот же файл, что кнопка «Скачать»
 * на главной) — сторы пока заглушки, прямой APK и есть рабочий способ установки.
 */
export default function PairActions({
  code,
  playUrl,
  appStoreUrl,
}: {
  code: string;
  playUrl: string;
  appStoreUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Буфер недоступен (старый браузер) — код и так виден крупно на странице.
    }
  };

  return (
    <div className="pairActions">
      <button type="button" className="pairBtn pairBtnPrimary" onClick={copy}>
        {copied ? '✓ Код скопирован' : 'Скопировать код'}
      </button>
      <a className="pairBtn pairBtnDownload" href={APK_URL} download={APK_FILENAME}>
        Скачать для Android
      </a>
      <div className="pairStores">
        <a className="pairBtn pairBtnStore" href={playUrl} target="_blank" rel="noreferrer">
          Google Play
        </a>
        <a className="pairBtn pairBtnStore" href={appStoreUrl} target="_blank" rel="noreferrer">
          App Store
        </a>
      </div>
      <p className="pairDownloadNote">Android · APK v{APP_VERSION}</p>
    </div>
  );
}
