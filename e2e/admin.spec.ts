import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

const PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "e2e-password-123";

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("e2e-admin@example.com");
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe.configure({ mode: "serial" });

test("private pages redirect anonymous visitors to sign in", async ({ page, request }) => {
  for (const p of ["/admin", "/admin/enquiries", "/admin/properties/new", "/admin/settings"]) {
    await page.goto(p);
    await expect(page).toHaveURL(/\/admin\/login/);
  }
  const upload = await request.post("/admin/api/media", { multipart: { owner: "hero" } });
  expect(upload.status()).toBe(401);
});

test("wrong password is rejected with a clear message", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("e2e-admin@example.com");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
});

test("admin creates, illustrates and publishes a listing, then handles the enquiry", async ({ page }, testInfo) => {
  await signIn(page);

  // Settings: contact details drive the public Call / WhatsApp buttons.
  await page.goto("/admin/settings");
  await page.getByLabel("Phone number").fill("98480 12345");
  await page.getByLabel("WhatsApp number").fill("98480 12345");
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(page.getByText(/Settings saved/)).toBeVisible();

  // Create draft
  await page.goto("/admin/properties/new");
  await page.getByRole("button", { name: "Save draft and add photos" }).click();
  await expect(page.getByText("Please fix the highlighted fields.")).toBeVisible();
  await page.getByLabel("Listing title").fill("E2E 3 BHK independent house, east facing");
  await page.getByLabel("Locality").selectOption({ label: "Moula Ali" });
  await page.getByLabel("Asking price (₹)").fill("9500000");
  await page.getByLabel("Plot area").fill("150");
  await page.getByLabel("Bedrooms").fill("3");
  await page.getByLabel("Description").fill("End-to-end test listing used to verify the full publishing workflow on the website.");
  await page.getByRole("button", { name: "Save draft and add photos" }).click();
  await expect(page.getByText("Draft saved")).toBeVisible();

  // Draft is not public
  const adminUrl = page.url();

  // Upload a photo
  const file = testInfo.outputPath("photo.jpg");
  await sharp({ create: { width: 1400, height: 1000, channels: 3, background: "#9a8a70" } }).jpeg().toFile(file);
  await page.locator("input[type=file]").setInputFiles(path.resolve(file));
  await expect(page.getByText("Uploaded")).toBeVisible({ timeout: 30_000 });
  await page.reload();
  await page.getByLabel(/Photo 1: description/).fill("Front of the house");
  await page.getByRole("button", { name: "Save", exact: true }).first().click();
  await expect(page.getByText("Photo description saved.")).toBeVisible();

  // Publish
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await page.getByRole("button", { name: "Publish now" }).click();
  await expect(page.getByText(/now live on the website/)).toBeVisible();

  // Public catalogue shows it and filters work
  await page.goto("/properties?type=independent_house");
  const card = page.getByRole("link", { name: "E2E 3 BHK independent house, east facing" });
  await expect(card).toBeVisible();
  await page.goto("/properties?type=plot");
  await expect(page.getByText("No properties match these filters")).toBeVisible();
  await page.goto("/properties?type=independent_house");
  await card.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E 3 BHK independent house, east facing");
  await expect(page.getByText("₹95,00,000").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /WhatsApp/ }).first()).toHaveAttribute("href", /^https:\/\/wa\.me\/919848012345\?text=/);

  // Visitor enquiry
  await page.getByLabel("Your name").fill("E2E Visitor");
  await page.getByLabel("Phone number").fill("9876543210");
  await page.getByLabel(/HKNR may contact me/).check();
  await page.waitForTimeout(2700); // the form treats instant submissions as bots
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText(/your enquiry has been received/)).toBeVisible();

  // Staff handles it
  await page.goto("/admin/enquiries");
  await page.getByRole("link", { name: /E2E Visitor/ }).click();
  await expect(page.getByText(/E2E 3 BHK independent house/).first()).toBeVisible();
  await page.locator("#status").selectOption("contacted");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Enquiry updated.")).toBeVisible();
  await page.getByLabel("Add a note").fill("Called back, site visit on Saturday");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Called back, site visit on Saturday").last()).toBeVisible();

  // Mark sold → still public with a Sold badge
  await page.goto(adminUrl.split("?")[0]);
  await page.getByRole("button", { name: "Mark sold" }).click();
  await expect(page.getByText("Availability updated.")).toBeVisible();

  // Unpublish → gone from the site
  await page.getByRole("button", { name: "Unpublish" }).click();
  await page.getByRole("button", { name: "Unpublish" }).last().click();
  await expect(page.getByText("Unpublished. The listing is hidden from the website.")).toBeVisible();
  await page.goto("/properties");
  await expect(page.getByRole("link", { name: "E2E 3 BHK independent house, east facing" })).toHaveCount(0);
});
