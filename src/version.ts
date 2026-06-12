/** アプリバージョン（package.json と合わせて管理） */
export const APP_VERSION = '1.0.9';

/** IndexedDB スキーマバージョン（db.ts の最新 version() 番号と一致させる） */
export const DB_SCHEMA_VERSION = 3;

/** エクスポートJSONのフォーマットバージョン
 *  presets / starters を含む形式に変更した時点で 2 へ上げた
 */
export const DATA_FORMAT_VERSION = 2;
