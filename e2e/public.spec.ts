import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/properties", "/construction", "/projects", "/about", "/contact", "/sell", "/saved", "/privacy", "/terms"];

test("every public page loads without horizontal overflow", async ({ page }) => {
  for (const p of PAGES) {
    const res = await page.goto(p);
    expect(res?.status(), p).toBe(200);
    await expect(page.locator("h1").first()).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${p} overflows horizontally`).toBeLessThanOrEqual(0);
  }
});

test("narrowest supported width (320px) has no overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  for (const p of ["/", "/properties", "/contact"]) {
    await page.goto(p);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, p).toBeLessThanOrEqual(0);
  }
});

test("unknown pages return a real 404", async ({ page }) => {
  expect((await page.goto("/no-such-page"))?.status()).toBe(404);
  expect((await page.goto("/properties/no-such-listing"))?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /couldn.t find that page/ })).toBeVisible();
});

test("empty inventory shows an honest state rather than fake listings", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("New listings are being added.")).toBeVisible();
});

test("contact form validates, then confirms with a reference", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText("Enter your name")).toBeVisible();
  await expect(page.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
  await page.getByLabel("Your name").fill("Contact Tester");
  await page.getByLabel("Phone number").fill("12345");
  await page.getByLabel(/HKNR may contact me/).check();
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText(/10-digit Indian phone number/)).toBeVisible();
  await page.getByLabel("Phone number").fill("9876543210");
  await page.waitForTimeout(2700);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText(/HK-E-\d{5}/)).toBeVisible();
});

test("mobile navigation opens, traps focus and closes with Escape", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  const dialog = page.getByRole("dialog", { name: "Menu" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Close menu" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("robots and indexing are closed until launch", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/Disallow: \//);
  const admin = await request.get("/admin/login");
  expect(admin.headers()["x-robots-tag"]).toContain("noindex");
});

test("security headers are present", async ({ request }) => {
  const h = (await request.get("/")).headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});

for (const p of ["/", "/properties", "/contact", "/construction"]) {
  test(`no serious accessibility violations on ${p}`, async ({ page }) => {
    await page.goto(p);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
  });
}
