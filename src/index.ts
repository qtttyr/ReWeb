import path from 'path';
import fs from 'fs/promises';
import { BrowserEngine } from './core/browser.js';
import { DesignExtractor } from './core/extractor.js';
import { VisualScreenshotter } from './core/screenshotter.js';
import { TokenCompiler } from './core/token-compiler.js';
import { VisualDiffEngine } from './core/visual-diff.js';
import type { DesignDNA } from './types/index.js';

export * from './types/index.js';
export { BrowserEngine, DesignExtractor, VisualScreenshotter, TokenCompiler, VisualDiffEngine };

export interface PipelineResult {
  dna: DesignDNA;
  compiled: {
    tokensJson: string;
    globalsCss: string;
    tailwindConfig: string;
    fontImports: string;
  };
  outputDir: string;
}

export async function captureAndAnalyzeSite(
  url: string,
  outputDir = path.join(process.cwd(), '.reweb', 'captures')
): Promise<PipelineResult> {
  const parsedUrl = new URL(url);
  const siteSlug = parsedUrl.hostname.replace(/[^a-z0-9]/gi, '_');
  const targetDir = path.join(outputDir, `${siteSlug}-${Date.now()}`);
  await fs.mkdir(targetDir, { recursive: true });

  const browser = new BrowserEngine();
  try {
    // 1. Desktop Page
    const { page: desktopPage } = await browser.createContext({ isMobile: false });
    await browser.navigateAndSettle(desktopPage, url);

    // 2. Mobile Page
    const { page: mobilePage } = await browser.createContext({ isMobile: true });
    await browser.navigateAndSettle(mobilePage, url);

    // 3. Extract Design DNA & Sections
    const extractor = new DesignExtractor();
    const dnaPartial = await extractor.extractDNA(desktopPage, url);
    const sections = await extractor.extractSections(desktopPage);

    // 4. Capture Full Page & Isolated Sections Screenshots
    const screenshotter = new VisualScreenshotter();
    const captures = await screenshotter.captureSite(desktopPage, mobilePage, sections, targetDir);

    const fullDna: DesignDNA = {
      ...dnaPartial,
      sections,
      fullScreenshot: {
        desktop: captures.fullDesktop,
        mobile: captures.fullMobile,
      },
    };

    // 5. Compile Tokens
    const compiler = new TokenCompiler();
    const compiled = compiler.compile(fullDna);

    // Save outputs
    await fs.writeFile(path.join(targetDir, 'dna.json'), JSON.stringify(fullDna, null, 2), 'utf-8');
    await fs.writeFile(path.join(targetDir, 'design-tokens.json'), compiled.tokensJson, 'utf-8');
    await fs.writeFile(path.join(targetDir, 'globals.css'), compiled.globalsCss, 'utf-8');
    await fs.writeFile(path.join(targetDir, 'tailwind.config.ts'), compiled.tailwindConfig, 'utf-8');
    await fs.writeFile(path.join(targetDir, 'fonts.html'), compiled.fontImports, 'utf-8');

    return {
      dna: fullDna,
      compiled,
      outputDir: targetDir,
    };
  } finally {
    await browser.close();
  }
}
