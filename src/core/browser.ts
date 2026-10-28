import { chromium, type Browser, type BrowserContext, type Page } from 'playwright-core';

export interface LaunchOptions {
  headless?: boolean;
  viewport?: { width: number; height: number };
  deviceScaleFactor?: number;
  isMobile?: boolean;
}

export class BrowserEngine {
  private browser: Browser | null = null;

  async init(options: { headless?: boolean } = {}): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: options.headless ?? true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--font-render-hinting=none',
        ],
      });
    }
    return this.browser;
  }

  async createContext(options: LaunchOptions = {}): Promise<{ context: BrowserContext; page: Page }> {
    const browser = await this.init({ headless: options.headless });
    const isMobile = options.isMobile ?? false;

    const context = await browser.newContext({
      viewport: options.viewport ?? (isMobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }),
      deviceScaleFactor: options.deviceScaleFactor ?? (isMobile ? 3 : 2),
      isMobile,
      hasTouch: isMobile,
      userAgent: isMobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      locale: 'en-US',
      colorScheme: 'dark', // default to dark/high-end editorial preference
    });

    const page = await context.newPage();

    // Auto dismiss cookie banners and dialogs
    page.on('dialog', async (dialog) => {
      await dialog.dismiss().catch(() => {});
    });

    return { context, page };
  }

  async navigateAndSettle(page: Page, url: string, timeout = 30000): Promise<void> {
    await page.goto(url, { waitUntil: 'load', timeout });

    // Wait for fonts to finish loading
    await page.evaluate(async () => {
      if (document.fonts) {
        await document.fonts.ready;
      }
    }).catch(() => {});

    // Common cookie consent dismissers
    await page.evaluate(() => {
      const selectors = [
        '#onetrust-accept-btn-handler',
        'button[id*="cookie"]',
        'button[class*="cookie"]',
        'button:has-text("Accept")',
        'button:has-text("Accept All")',
        'button:has-text("Allow all")',
        'button:has-text("I agree")',
        '[aria-label*="cookie" i] button',
      ];
      for (const sel of selectors) {
        try {
          const btn = document.querySelector(sel) as HTMLElement | null;
          if (btn && btn.offsetParent !== null) {
            btn.click();
            break;
          }
        } catch {
          // ignore
        }
      }
    }).catch(() => {});

    // Settle brief delay for initial entrance animations (Framer/GSAP)
    await page.waitForTimeout(1200);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}
