import type { Page } from 'playwright-core';
import type { DesignDNA, SectionBlueprint, TypographyToken, ShadowToken, MaterialTokens, MotionToken } from '../types/index.js';

export class DesignExtractor {
  async extractDNA(page: Page, url: string): Promise<Omit<DesignDNA, 'fullScreenshot' | 'sections'>> {
    const rawData = await page.evaluate(() => {
      // tsx/esbuild "keepNames" shim: this callback is serialized to the browser,
      // where the injected __name helper does not exist.
      const g = window as any;
      if (typeof g.__name === 'undefined') g.__name = (f: any) => f;

      // Helper: parse rgba string
      function parseColor(col: string): { r: number; g: number; b: number; a: number; isDark: boolean; hex: string } | null {
        if (!col || col === 'transparent' || col === 'rgba(0, 0, 0, 0)') return null;
        const match = col.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!match) return null;
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        return { r, g, b, a, isDark: luminance < 0.5, hex };
      }

      // Helper: rgb -> HSL (for accent/saturation detection)
      function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const l = (max + min) / 2;
        let h = 0, s = 0;
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          else if (max === g) h = ((b - r) / d + 2) / 6;
          else h = ((r - g) / d + 4) / 6;
        }
        return { h, s, l };
      }

      // 1. Meta information
      const title = document.title || '';
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

      // 2. Base Canvas Background & Palette
      const bodyStyle = window.getComputedStyle(document.body);
      const htmlStyle = window.getComputedStyle(document.documentElement);
      
      let baseBg = bodyStyle.backgroundColor;
      if (!baseBg || baseBg === 'transparent' || baseBg === 'rgba(0, 0, 0, 0)') {
        baseBg = htmlStyle.backgroundColor;
      }
      if (!baseBg || baseBg === 'transparent' || baseBg === 'rgba(0, 0, 0, 0)') {
        baseBg = 'rgb(9, 9, 11)'; // default tactile dark fallback
      }

      // Scan elements for colors, borders, shadows
      const allElements = Array.from(document.querySelectorAll('body *')).slice(0, 800) as HTMLElement[];
      const bgCounts = new Map<string, number>();
      const washCounts = new Map<string, number>(); // translucent layered fills (glow washes, glass)
      const borderCounts = new Map<string, number>();
      const textColors = new Map<string, number>();
      const gapCounts = new Map<string, number>();
      const radii = new Set<string>();
      const shadowsRaw = new Set<string>();
      const backdropFilters = new Set<string>();
      let hasNoiseOverlay = false;

      // Check for noise / grain
      const noiseSvgs = document.querySelectorAll('svg feTurbulence, [class*="noise"], [id*="noise"], [style*="noise"]');
      if (noiseSvgs.length > 0) hasNoiseOverlay = true;

      for (const el of allElements) {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        // Background (separate opaque canvas colors from translucent washes)
        const bg = style.backgroundColor;
        if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
          const aMatch = bg.match(/,\s*([\d.]+)\)$/);
          const alpha = aMatch ? parseFloat(aMatch[1]) : 1;
          if (alpha < 0.99) {
            washCounts.set(bg, (washCounts.get(bg) || 0) + 1);
          } else {
            bgCounts.set(bg, (bgCounts.get(bg) || 0) + 1);
          }
        }

        // Border
        const borderCol = style.borderColor;
        const borderWidth = parseFloat(style.borderWidth);
        if (borderWidth > 0 && borderCol && borderCol !== 'transparent' && borderCol !== 'rgba(0, 0, 0, 0)') {
          borderCounts.set(borderCol, (borderCounts.get(borderCol) || 0) + 1);
        }

        // Text color
        if (el.textContent && el.textContent.trim().length > 0) {
          const col = style.color;
          if (col) textColors.set(col, (textColors.get(col) || 0) + 1);
        }

        // Radius
        const r = style.borderRadius;
        if (r && r !== '0px') radii.add(r);

        // Shadow
        const s = style.boxShadow;
        if (s && s !== 'none') shadowsRaw.add(s);

        // Backdrop filter
        const bf = style.backdropFilter || (style as any).webkitBackdropFilter;
        if (bf && bf !== 'none') backdropFilters.add(bf);

        // Grid/flex gaps
        if (style.display.includes('grid') || style.display.includes('flex')) {
          const gap = style.rowGap && style.rowGap !== 'normal' ? style.rowGap : style.columnGap;
          if (gap && parseFloat(gap) > 0) {
            gapCounts.set(gap, (gapCounts.get(gap) || 0) + 1);
          }
        }
      }

      // Sort colors by frequency (opaque canvas first, translucent washes after)
      const sortedBgs = Array.from(bgCounts.entries()).sort((a, b) => b[1] - a[1]).map(e => e[0]);
      const sortedWashes = Array.from(washCounts.entries()).sort((a, b) => b[1] - a[1]).map(e => e[0]);
      const sortedBorders = Array.from(borderCounts.entries()).sort((a, b) => b[1] - a[1]).map(e => e[0]);
      const sortedTexts = Array.from(textColors.entries()).sort((a, b) => b[1] - a[1]).map(e => e[0]);

      // Accent detection: saturated, non-neutral colors by combined frequency
      const accentCounts = new Map<string, number>();
      for (const sourceMap of [bgCounts, borderCounts, textColors]) {
        for (const [color, count] of sourceMap) {
          const p = parseColor(color);
          if (!p || p.a < 0.5) continue;
          const hsl = rgbToHsl(p.r, p.g, p.b);
          if (hsl.s > 0.3 && hsl.l > 0.15 && hsl.l < 0.85) {
            accentCounts.set(color, (accentCounts.get(color) || 0) + count);
          }
        }
      }
      const sortedAccents = Array.from(accentCounts.entries()).sort((a, b) => b[1] - a[1]).map(e => e[0]).slice(0, 3);

      const sortedGaps = Array.from(gapCounts.entries()).sort((a, b) => b[1] - a[1]).map(e => e[0]);

      // 3. Typography Matrix
      const typographyNodes = Array.from(
        document.querySelectorAll('h1, h2, h3, h4, h5, p, span, a, button, [class*="badge"], [class*="eyebrow"]')
      ) as HTMLElement[];

      const typoMap = new Map<string, TypographyToken>();
      const fontFamilies = new Set<string>();

      for (const el of typographyNodes) {
        const text = (el.textContent || '').trim();
        if (text.length === 0 || text.length > 150) continue;

        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        const family = style.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
        fontFamilies.add(family);

        const fontSizePx = parseFloat(style.fontSize) || 16;
        const key = `${el.tagName.toLowerCase()}-${fontSizePx}-${style.fontWeight}-${style.letterSpacing}`;

        if (!typoMap.has(key)) {
          typoMap.set(key, {
            tag: el.tagName.toLowerCase(),
            selector: el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase(),
            fontFamily: family,
            fontSize: style.fontSize,
            fontSizePx,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            letterSpacing: style.letterSpacing,
            textTransform: style.textTransform,
            color: style.color,
            sampleText: text.slice(0, 60),
          });
        }
      }

      const sortedTypo = Array.from(typoMap.values()).sort((a, b) => b.fontSizePx - a.fontSizePx);

      // Classify fonts
      const familiesArray = Array.from(fontFamilies);
      let primaryFont = familiesArray[0] || 'Geist, sans-serif';
      let editorialFont: string | undefined;
      let monoFont: string | undefined;

      for (const f of familiesArray) {
        const lower = f.toLowerCase();
        if (lower.includes('mono') || lower.includes('code')) {
          monoFont = f;
        } else if (lower.includes('serif') || lower.includes('editorial') || lower.includes('instrument') || lower.includes('playfair')) {
          editorialFont = f;
        } else if (!primaryFont) {
          primaryFont = f;
        }
      }

      // 4. Shadows classification
      const parsedShadows: ShadowToken[] = Array.from(shadowsRaw).slice(0, 10).map((raw) => {
        const isInset = raw.includes('inset');
        let type: ShadowToken['type'] = 'card';
        if (isInset) type = 'inset-glow';
        else if (raw.includes('0px 0px') || raw.includes('0 0 ')) type = 'ambient';
        else type = 'directional';

        const blurMatch = raw.match(/(\d+)px/);
        const blurPx = blurMatch ? parseInt(blurMatch[1], 10) : 0;

        return {
          raw,
          type,
          blurPx,
          color: raw.match(/rgba?\([^)]+\)/)?.[0] || 'rgba(0,0,0,0.2)',
        };
      });

      // 5. Layout Container and Spacing
      const mainContainers = Array.from(document.querySelectorAll('main, [class*="container"], [class*="wrapper"], section')) as HTMLElement[];
      let containerMaxWidth = '1280px';
      for (const c of mainContainers) {
        const st = window.getComputedStyle(c);
        if (st.maxWidth && st.maxWidth !== 'none' && parseFloat(st.maxWidth) > 800) {
          containerMaxWidth = st.maxWidth;
          break;
        }
      }

      // Section padding rhythm
      const sectionPaddingsY: string[] = [];
      const sections = Array.from(document.querySelectorAll('section, main > div, article')) as HTMLElement[];
      for (const s of sections.slice(0, 8)) {
        const st = window.getComputedStyle(s);
        const pt = parseFloat(st.paddingTop);
        const pb = parseFloat(st.paddingBottom);
        if (pt > 20 || pb > 20) {
          sectionPaddingsY.push(`${st.paddingTop} / ${st.paddingBottom}`);
        }
      }

      return {
        title,
        description,
        palette: {
          backgrounds: sortedBgs.slice(0, 6),
          surfaces: [...sortedWashes, ...sortedBgs.slice(1, 6)].slice(0, 6),
          borders: sortedBorders.slice(0, 6),
          textColors: {
            primary: sortedTexts[0] || 'rgb(255, 255, 255)',
            secondary: sortedTexts[1] || 'rgb(161, 161, 170)',
            muted: sortedTexts[2] || 'rgb(113, 113, 122)',
          },
          accents: sortedAccents,
          radii: {
            pill: Array.from(radii).find(r => r.includes('9999px') || r.includes('100px')) || '9999px',
            card: Array.from(radii).find(r => parseInt(r, 10) >= 16 && parseInt(r, 10) <= 32) || '20px',
            button: Array.from(radii).find(r => parseInt(r, 10) >= 8 && parseInt(r, 10) <= 14) || '10px',
            badge: Array.from(radii).find(r => parseInt(r, 10) >= 4 && parseInt(r, 10) <= 8) || '6px',
          },
          shadows: parsedShadows,
          backdropFilters: Array.from(backdropFilters).slice(0, 4),
          hasNoiseOverlay,
        },
        typography: {
          primaryFont,
          editorialFont,
          monoFont,
          tokens: sortedTypo.slice(0, 16),
        },
        motion: [],
        layout: {
          containerMaxWidth,
          gridGaps: sortedGaps.slice(0, 3).length ? sortedGaps.slice(0, 3) : ['16px', '24px', '32px'],
          sectionPaddingsY: Array.from(new Set(sectionPaddingsY)).slice(0, 4),
        },
      };
    });

    const motion = await this.extractMotion(page).catch(() => []);

    return {
      url,
      timestamp: new Date().toISOString(),
      viewport: {
        desktop: { width: 1440, height: 900 },
        mobile: { width: 390, height: 844 },
      },
      ...rawData,
      motion,
    };
  }

  async extractSections(page: Page): Promise<SectionBlueprint[]> {
    return await page.evaluate(() => {
      // tsx/esbuild "keepNames" shim (serialized to browser context)
      const g = window as any;
      if (typeof g.__name === 'undefined') g.__name = (f: any) => f;

      const candidates: HTMLElement[] = [];

      // 1. Check semantic header / nav
      const navEl = document.querySelector('header, nav') as HTMLElement | null;
      if (navEl && navEl.getBoundingClientRect().height > 20) {
        candidates.push(navEl);
      }

      // 2. Main sections
      let sections = Array.from(
        document.querySelectorAll('main > section, main > div, body > section, [id*="hero"], [class*="hero"], [class*="section"]')
      ) as HTMLElement[];

      if (sections.length === 0) {
        // Fallback: look for direct children of body or containers containing headings
        sections = Array.from(
          document.querySelectorAll('body > div, body > main, div:has(h1), div:has(h2)')
        ) as HTMLElement[];
      }

      for (const s of sections) {
        const rect = s.getBoundingClientRect();
        // Wrapper containers that swallow the whole page: descend one level
        // into their direct children instead of dropping the area entirely
        if (rect.height > document.documentElement.scrollHeight * 0.55) {
          for (const child of Array.from(s.children) as HTMLElement[]) {
            const cr = child.getBoundingClientRect();
            if (
              cr.height > 120 && cr.width > 200 &&
              !candidates.includes(child) &&
              !candidates.some(c => c.contains(child))
            ) {
              candidates.push(child);
            }
          }
          continue;
        }
        if (rect.height > 100 && rect.width > 200 && !candidates.includes(s)) {
          // Avoid nested sections if parent is already candidate
          const isNested = candidates.some(c => c.contains(s) && c !== s);
          if (!isNested) {
            candidates.push(s);
          }
        }
      }

      // 3. Footer
      const footerEl = document.querySelector('footer') as HTMLElement | null;
      if (footerEl && footerEl.getBoundingClientRect().height > 40 && !candidates.includes(footerEl)) {
        candidates.push(footerEl);
      }

      // Fallback: if everything was filtered as wrappers, use the first meaningful one
      if (candidates.length === 0) {
        const firstWrapper = sections.find(s => s.getBoundingClientRect().height > 100);
        if (firstWrapper) candidates.push(firstWrapper);
      }

      // Cap at top 10 meaningful sections
      const finalSections = candidates.slice(0, 10);

      return finalSections.map((el, index): SectionBlueprint => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);

        // Role inference
        let role: SectionBlueprint['role'] = 'content';
        const lowerTag = el.tagName.toLowerCase();
        const lowerClass = (el.className || '').toLowerCase();
        const lowerId = (el.id || '').toLowerCase();

        if (lowerTag === 'header' || lowerTag === 'nav' || lowerClass.includes('nav') || index === 0 && rect.height < 120) {
          role = 'navbar';
        } else if (index === 0 || (index === 1 && candidates[0]?.tagName.toLowerCase() === 'header') || lowerClass.includes('hero') || lowerId.includes('hero') || el.querySelector('h1')) {
          role = 'hero';
        } else if (lowerTag === 'footer' || lowerClass.includes('footer') || index === finalSections.length - 1 && rect.height < 400) {
          role = 'footer';
        } else if (el.querySelectorAll('[class*="card"], [class*="grid"], [class*="bento"]').length >= 3 || style.display === 'grid') {
          role = 'bento-grid';
        } else if (lowerClass.includes('testimonial') || lowerClass.includes('review') || lowerClass.includes('marquee')) {
          role = 'testimonials';
        } else if (el.querySelector('button, a[class*="btn"], a[class*="button"]') && rect.height < 500 && el.textContent && el.textContent.length < 300) {
          role = 'cta';
        } else {
          role = 'feature-showcase';
        }

        // Extract key content
        const h1 = el.querySelector('h1, h2, [class*="title"], [class*="heading"]');
        const headline = h1?.textContent?.trim().slice(0, 120);

        const sub = el.querySelector('p, [class*="description"], [class*="sub"]');
        const subheadline = sub?.textContent?.trim().slice(0, 200);

        const badge = el.querySelector('[class*="badge"], [class*="pill"], [class*="eyebrow"]');
        const badgeText = badge?.textContent?.trim().slice(0, 50);

        // Extract CTA buttons
        const btnEls = Array.from(el.querySelectorAll('button, a[class*="btn"], a[class*="button"]')).slice(0, 3) as HTMLElement[];
        const ctaButtons = btnEls.map((btn, btnIdx) => {
          const btnStyle = window.getComputedStyle(btn);
          return {
            text: btn.textContent?.trim().slice(0, 40) || 'Action',
            variant: (btnIdx === 0 ? 'primary' : 'secondary') as 'primary' | 'secondary' | 'ghost',
            styles: {
              background: btnStyle.backgroundColor,
              color: btnStyle.color,
              borderRadius: btnStyle.borderRadius,
              border: `${btnStyle.borderWidth} ${btnStyle.borderStyle} ${btnStyle.borderColor}`,
              boxShadow: btnStyle.boxShadow,
            },
          };
        });

        // Grid info
        const cards = el.querySelectorAll('[class*="card"], [class*="item"], article');
        let layoutGrid: SectionBlueprint['layoutGrid'] | undefined;
        if (cards.length >= 2) {
          layoutGrid = {
            columns: Math.min(cards.length, 4),
            gap: style.gap || '24px',
            cardAspectRatios: Array.from(cards).slice(0, 4).map(c => {
              const r = c.getBoundingClientRect();
              return `${Math.round(r.width)}x${Math.round(r.height)}`;
            }),
          };
        }

        return {
          id: `section-${index}-${role}`,
          index,
          role,
          tag: lowerTag,
          selector: el.id ? `#${el.id}` : (el.className ? `.${el.className.split(' ')[0]}` : lowerTag),
          bounds: {
            x: Math.round(rect.x + window.scrollX),
            y: Math.round(rect.y + window.scrollY),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          desktopScreenshot: '',
          headline,
          subheadline,
          badgeText,
          ctaButtons,
          cardsCount: cards.length,
          layoutGrid,
          styles: {
            backgroundColor: style.backgroundColor,
            color: style.color,
            paddingTop: style.paddingTop,
            paddingBottom: style.paddingBottom,
            maxWidth: style.maxWidth,
            borderRadius: style.borderRadius !== '0px' ? style.borderRadius : undefined,
            border: parseFloat(style.borderWidth) > 0 ? `${style.borderWidth} solid ${style.borderColor}` : undefined,
          },
        };
      });
    });
  }

  /**
   * Extract real motion tokens by hovering interactive elements with Playwright
   * and diffing computed styles before/after. Captures transition + hover deltas.
   */
  async extractMotion(page: Page, maxElements = 8): Promise<MotionToken[]> {
    const tokens: MotionToken[] = [];
    const seen = new Set<string>();

    const handles = await page.$$('a:visible, button:visible').catch(() => []);
    let checked = 0;

    for (const el of handles) {
      if (checked >= maxElements) break;

      const box = await el.boundingBox().catch(() => null);
      if (!box || box.width < 40 || box.height < 16) continue;

      const before = await el
        .evaluate(e => {
          const s = window.getComputedStyle(e);
          return {
            transitionProperty: s.transitionProperty,
            transitionDuration: s.transitionDuration,
            transitionTimingFunction: s.transitionTimingFunction,
            transform: s.transform,
            boxShadow: s.boxShadow,
            borderColor: s.borderColor,
            backgroundColor: s.backgroundColor,
            color: s.color,
            opacity: s.opacity,
            letterSpacing: s.letterSpacing,
          };
        })
        .catch(() => null);
      if (!before) continue;

      try {
        await el.hover({ timeout: 1500 });
      } catch {
        continue;
      }
      await page.waitForTimeout(300);

      const after = await el
        .evaluate(e => {
          const s = window.getComputedStyle(e);
          return {
            transitionProperty: s.transitionProperty,
            transitionDuration: s.transitionDuration,
            transitionTimingFunction: s.transitionTimingFunction,
            transform: s.transform,
            boxShadow: s.boxShadow,
            borderColor: s.borderColor,
            backgroundColor: s.backgroundColor,
            color: s.color,
            opacity: s.opacity,
            letterSpacing: s.letterSpacing,
          };
        })
        .catch(() => null);
      // Reset cursor so no hover state sticks into later captures
      await page.mouse.move(2, 2).catch(() => {});
      await page.waitForTimeout(160);

      if (!after) continue;
      checked++;

      const delta: MotionToken['hoverDelta'] = {};
      if (after.transform !== before.transform) {
        const m = after.transform.match(/matrix\(([^)]+)\)/);
        if (m) {
          const parts = m[1].split(',').map(Number);
          if (parts.length === 6) {
            if (Math.abs(parts[0] - 1) > 0.01) delta.scale = parts[0];
            if (Math.abs(parts[5]) > 0.5) delta.translateY = `${parts[5]}px`;
          }
        }
      }
      if (after.boxShadow !== before.boxShadow) delta.boxShadow = after.boxShadow;
      if (after.borderColor !== before.borderColor) delta.borderColor = after.borderColor;

      const hasDelta = Object.keys(delta).length > 0;
      const isAnimated = before.transitionDuration !== '0s' && before.transitionDuration !== '';
      if (!hasDelta && !isAnimated) continue;

      const key = `${before.transitionProperty}|${before.transitionDuration}|${before.transitionTimingFunction}`;
      if (seen.has(key)) continue;
      seen.add(key);

      tokens.push({
        selector: await el
          .evaluate(e => {
            const tag = e.tagName.toLowerCase();
            const cls = typeof (e as HTMLElement).className === 'string' ? (e as HTMLElement).className : '';
            return cls ? `${tag}.${cls.split(' ')[0]}` : tag;
          })
          .catch(() => 'el'),
        property: before.transitionProperty,
        duration: before.transitionDuration,
        easing: before.transitionTimingFunction,
        hoverDelta: hasDelta ? delta : undefined,
      });
    }

    return tokens.slice(0, 10);
  }
}
