import type { Page } from 'playwright-core';
import path from 'path';
import fs from 'fs/promises';
import type { SectionBlueprint } from '../types/index.js';

export interface ScreenshotResult {
  fullDesktop: string;
  fullMobile: string;
  sections: Array<{ id: string; screenshotPath: string }>;
}

export class VisualScreenshotter {
  async captureSite(
    desktopPage: Page,
    mobilePage: Page,
    sections: SectionBlueprint[],
    outputDir: string
  ): Promise<ScreenshotResult> {
    await fs.mkdir(outputDir, { recursive: true });

    const fullDesktopPath = path.join(outputDir, 'full-desktop.png');
    const fullMobilePath = path.join(outputDir, 'full-mobile.png');

    // 1. Full page captures
    await desktopPage.screenshot({
      path: fullDesktopPath,
      fullPage: true,
      animations: 'disabled',
    });

    await mobilePage.screenshot({
      path: fullMobilePath,
      fullPage: true,
      animations: 'disabled',
    });

    // 2. Crop/Capture individual sections on Desktop
    const sectionCaptures: Array<{ id: string; screenshotPath: string }> = [];

    for (const sec of sections) {
      if (sec.bounds.height < 40 || sec.bounds.width < 100) continue;

      const secPath = path.join(outputDir, `${sec.id}.png`);
      try {
        // Scroll section into view
        await desktopPage.evaluate((bounds) => {
          window.scrollTo(0, Math.max(0, bounds.y - 40));
        }, sec.bounds);
        await desktopPage.waitForTimeout(200);

        // Screenshot clip area
        await desktopPage.screenshot({
          path: secPath,
          clip: {
            x: Math.max(0, sec.bounds.x),
            y: Math.max(0, sec.bounds.y),
            width: Math.min(1440, sec.bounds.width),
            height: Math.min(1800, sec.bounds.height),
          },
        });

        sec.desktopScreenshot = secPath;
        sectionCaptures.push({ id: sec.id, screenshotPath: secPath });
      } catch (err) {
        // If clipping fails (e.g. out of bounds), fallback gracefully
        // console.warn(`Failed clipping ${sec.id}:`, err);
      }
    }

    return {
      fullDesktop: fullDesktopPath,
      fullMobile: fullMobilePath,
      sections: sectionCaptures,
    };
  }
}
