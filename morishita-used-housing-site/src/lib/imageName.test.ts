import { test } from "node:test";
import assert from "node:assert/strict";
import { parseImageFileName, extensionOf, storagePathFor } from "./imageName.ts";

/**
 * D-06：解釈を間違えると別の物件に画像が付く。境界をテストで固定する。
 */

test("物件管理番号と連番を読む", () => {
  const r = parseImageFileName("6991580385_2.jpg");
  assert.deepEqual(r, { ok: true, objMngNo: "6991580385", order: 2, ext: "jpg" });
});

test("連番を省略すると1枚目になる", () => {
  const r = parseImageFileName("6991580385.png");
  assert.deepEqual(r, { ok: true, objMngNo: "6991580385", order: 1, ext: "png" });
});

test("拡張子の大文字・ゼロ埋め連番・ハイフン区切りも読める", () => {
  assert.deepEqual(parseImageFileName("6991580385_02.JPG"), {
    ok: true, objMngNo: "6991580385", order: 2, ext: "jpg",
  });
  assert.deepEqual(parseImageFileName("6991580385-3.webp"), {
    ok: true, objMngNo: "6991580385", order: 3, ext: "webp",
  });
});

test("対応していない形式は理由つきで断る", () => {
  const r = parseImageFileName("6991580385_1.gif");
  assert.equal(r.ok, false);
  assert.match((r as { reason: string }).reason, /対応していない形式/);
});

test("番号以外の名前は断る（別物件に付けないため）", () => {
  for (const n of ["外観.jpg", "IMG_1234.jpg", "6991580385_a.jpg", "photo-1.png"]) {
    assert.equal(parseImageFileName(n).ok, false, `${n} が通ってしまう`);
  }
});

test("拡張子が無いものは断る", () => {
  assert.equal(parseImageFileName("6991580385").ok, false);
});

test("extensionOf は小文字で返す", () => {
  assert.equal(extensionOf("a.JPEG"), "jpeg");
  assert.equal(extensionOf("noext"), "");
});

test("保存先は物件ごとのフォルダ＋ゼロ埋め連番", () => {
  assert.equal(storagePathFor("6991580385", 2, "jpg"), "6991580385/002.jpg");
});
