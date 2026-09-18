import test from "node:test";
import assert from "node:assert/strict";
import { addDuration, assertAvailable, assertMeditationAccess, isUserPremium, meditationPreview } from "../src/modules/premium/premium.logic.js";

const now = new Date("2026-09-17T12:00:00Z");
test("free meditation is accessible without Premium", () => assert.doesNotThrow(() => assertMeditationAccess({ isPremium: false }, null, now)));
test("free and anonymous users cannot read Premium", () => {
  for (const user of [null, {}, { premiumEndAt: now }]) assert.throws(() => assertMeditationAccess({ isPremium: true }, user, now), { code: "PREMIUM_REQUIRED", statusCode: 403 });
});
test("active Premium grants access", () => assert.doesNotThrow(() => assertMeditationAccess({ isPremium: true }, { premiumEndAt: addDuration(now, 7, "DAYS") }, now)));
test("expiration is automatic, including exact boundary", () => {
  assert.equal(isUserPremium({ premiumEndAt: now }, now), false);
  assert.equal(isUserPremium({ premiumEndAt: new Date(now.getTime() - 1) }, now), false);
});
test("code failures remain distinguishable", () => {
  for (const [code, error] of [[null, "INVALID_CODE"], [{ status: "USED" }, "CODE_USED"], [{ status: "DISABLED" }, "CODE_DISABLED"], [{ status: "EXPIRED" }, "CODE_EXPIRED"], [{ status: "AVAILABLE", expiresAt: now }, "CODE_EXPIRED"]]) assert.throws(() => assertAvailable(code, now), { code: error });
  assert.doesNotThrow(() => assertAvailable({ status: "AVAILABLE", duration: 30, durationUnit: "DAYS" }, now));
  assert.throws(() => assertAvailable({ status: "AVAILABLE", duration: -1, durationUnit: "DAYS" }, now), { code: "INVALID_CODE" });
});
test("calendar durations clamp month ends and leap years", () => {
  assert.equal(addDuration(new Date("2026-01-31T12:00:00Z"), 1, "MONTHS").toISOString(), "2026-02-28T12:00:00.000Z");
  assert.equal(addDuration(new Date("2024-02-29T12:00:00Z"), 1, "YEARS").toISOString(), "2025-02-28T12:00:00.000Z");
  assert.equal(addDuration(new Date("2026-10-20T12:00:00Z"), 30, "DAYS").toISOString(), "2026-11-19T12:00:00.000Z");
});
test("previews never expose protected text or audio", () => {
  assert.deepEqual(meditationPreview({ title: "Visible", isPremium: true, bodyText: "Secret", footerText: "Secret", audioUrl: "Secret" }), { title: "Visible", isPremium: true });
});
