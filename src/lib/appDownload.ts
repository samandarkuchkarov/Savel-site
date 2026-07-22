/**
 * Публичная ссылка на Android-релиз (APK лежит в uploads-томе API и раздаётся
 * Caddy'ом через api.savel.uz). Версия зашита в имя файла, чтобы браузер
 * сохранял его как Savel-<версия>.apk и чтобы обновление версии = новое имя.
 */
export const APP_VERSION = '1.0.1';
export const APK_FILENAME = `Savel-${APP_VERSION}.apk`;
export const APK_URL = `https://api.savel.uz/uploads/downloads/${APK_FILENAME}`;
