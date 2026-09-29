import { expect, type Page } from "@playwright/test";

export async function selectLanguage(page: Page, language: string) {
  await page
    .locator('.language-select button[aria-haspopup="listbox"]')
    .click();
  await page
    .getByRole("option", {
      name: language === "en" ? "English" : "සිංහල",
      exact: true,
    })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", language);
}
