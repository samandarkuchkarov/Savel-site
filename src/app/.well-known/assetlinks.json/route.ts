import { NextResponse } from 'next/server';

/**
 * Android App Links: подтверждает, что приложение com.savel вправе открывать
 * ссылки savel.uz/pair/*. Без этого файла Android НЕ верифицирует intent-filter
 * autoVerify и ссылки открываются в браузере, а не в приложении.
 * Два отпечатка: релизный ключ (key.jks) и debug (для тестов на эмуляторе).
 */
const ASSET_LINKS = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: 'com.savel',
      sha256_cert_fingerprints: [
        'DC:81:AB:82:B8:28:E3:BB:92:7E:9C:CB:02:B0:67:58:04:D2:70:81:46:9A:AC:92:1A:D8:7F:4A:70:19:E4:E1',
        'FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C',
      ],
    },
  },
];

export function GET() {
  return NextResponse.json(ASSET_LINKS);
}
