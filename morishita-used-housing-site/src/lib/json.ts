/**
 * JSON へ落とすときの変換。
 *
 * 【なぜ要るか】
 * `Property.objMngNo` を BigInt にしたとき、取込の控え（PropertyImportBackup.before）で
 * `JSON.stringify` が「Do not know how to serialize a BigInt」で落ちた。
 * 既存レコードが0件のうちは `[]` を渡すので通り、**2回目の取込で初めて失敗する**という
 * 見つけにくい壊れ方をした。BigInt を JSON に入れる箇所はこの関数を通すこと。
 */

/**
 * BigInt を文字列にしたうえで、Prisma の Json 列などに渡せる素の値へ変換する。
 * Date は JSON.stringify の既定どおり ISO 文字列になる。
 *
 * 控えから復元するときは、文字列になっている数値を BigInt へ戻す必要がある点に注意。
 */
export function toJsonSafe<T>(value: T): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}
