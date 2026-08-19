import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildRegistrationMail,
  buildRegistrationAdminMail,
  buildInquiryMail,
  buildInquiryAdminMail,
  summarizeResendError,
  REASON_MAX_LENGTH,
} from "./mailPayload.ts";

/**
 * D-06：メールは「変えたつもりが変わっていない」「宛先を間違える」が起きやすい。
 * 実行は `pnpm test`（node の標準テストランナー。新しい依存は足していない → S-05）。
 */

test("会員登録の完了メールは本人宛に送られ、パスワードを含まない", () => {
  const mail = buildRegistrationMail({
    name: "佐久 太郎",
    email: "taro@example.com",
    tel: "090-0000-0000",
  });
  assert.deepEqual(mail.to, ["taro@example.com"]);
  assert.ok(mail.subject.includes("無料会員登録"));
  assert.ok(mail.text.includes("佐久 太郎 様"));
  // S-07：パスワードは控えメールに載せない
  assert.ok(!/パスワード:/.test(mail.text));
});

test("電話番号が空でも本文が壊れず「未登録」と出る", () => {
  const mail = buildRegistrationMail({ name: "名無し", email: "a@example.com", tel: "" });
  assert.ok(mail.text.includes("お電話番号: 未登録"));
});

test("管理者宛の入会通知は管理者アドレスへ送られ、返信先が入会者になる", () => {
  const mail = buildRegistrationAdminMail({
    name: "佐久 太郎",
    email: "taro@example.com",
    tel: "090-0000-0000",
    adminAddress: "admin@example.co.jp",
  });
  assert.deepEqual(mail.to, ["admin@example.co.jp"]);
  assert.equal(mail.reply_to, "taro@example.com");
});

test("問い合わせの控えは本人宛、通知は管理者宛と、宛先が入れ替わらない", () => {
  const input = {
    name: "佐久 花子",
    email: "hanako@example.com",
    tel: "",
    message: "内見を希望します",
    propertyTitle: "佐久平の中古戸建",
  };
  const toUser = buildInquiryMail(input);
  const toAdmin = buildInquiryAdminMail({
    ...input,
    inquiryId: 42,
    adminAddress: "admin@example.co.jp",
  });

  assert.deepEqual(toUser.to, ["hanako@example.com"]);
  assert.deepEqual(toAdmin.to, ["admin@example.co.jp"]);
  assert.equal(toAdmin.reply_to, "hanako@example.com");
  // 管理者宛には受付番号を載せ、管理画面と突き合わせられるようにする
  assert.ok(toAdmin.text.includes("42"));
  // 本人宛の控えに受付番号や管理画面URLを混ぜない
  assert.ok(!toUser.text.includes("/admin"));
});

test("問い合わせ本文と物件名は両方のメールにそのまま載る", () => {
  const input = {
    name: "佐久 花子",
    email: "hanako@example.com",
    tel: "0267-00-0000",
    message: "内見を希望します",
    propertyTitle: "佐久平の中古戸建",
  };
  const toUser = buildInquiryMail(input);
  assert.ok(toUser.text.includes("内見を希望します"));
  assert.ok(toUser.text.includes("佐久平の中古戸建"));
});

test("Resend のエラー応答は1行に要約され、上限文字数に収まる", () => {
  assert.equal(
    summarizeResendError(422, { statusCode: 422, name: "validation_error", message: "Invalid `from` field." }),
    "HTTP 422: Invalid `from` field."
  );
  // 改行を含む長文でも1行に潰れ、上限を超えない
  const long = summarizeResendError(500, "a\nb".repeat(500));
  assert.ok(!long.includes("\n"));
  assert.ok(long.length <= REASON_MAX_LENGTH);
});

test("JSONでない応答でもステータスだけは残る", () => {
  assert.equal(summarizeResendError(502, null), "HTTP 502");
});
