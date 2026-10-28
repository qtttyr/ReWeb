import type { DesignDNA } from '../types/index.js';

export interface CompiledTokens {
  tokensJson: string;
  globalsCss: string;
  tailwindConfig: string;
  fontImports: string;
}

export class TokenCompiler {
  // "Inter Variable" loads from Google Fonts as "Inter"
  private cleanFont(f?: string): string {
    return (f || '').replace(/\s+Variable$/i, '');
  }

  private alphaOf(c: string): number {
    const m = c.match(/,\s*([\d.]+)\)\s*$/);
    return m ? parseFloat(m[1]) : 1;
  }

  // Prefer opaque colors for base tokens (translucent washes belong to glass surfaces)
  private firstOpaque(list: string[], fallback: string): string {
    return list.find((c) => this.alphaOf(c) >= 0.99) || list[0] || fallback;
  }

  compile(dna: DesignDNA): CompiledTokens {
    const { palette, typography, layout } = dna;

    const baseBg = this.firstOpaque(palette.backgrounds, '#09090b');
    const cardBg = this.firstOpaque(palette.surfaces, '#121214');
    const borderCol = palette.borders[0] || 'rgba(255, 255, 255, 0.08)';
    const primaryText = palette.textColors.primary || '#ffffff';
    const secondaryText = palette.textColors.secondary || '#a1a1aa';
    const mutedText = palette.textColors.muted || '#71717a';
    const accentCol = palette.accents[0] || '#ffffff';
    const radiusCard = palette.radii.card || '20px';

    // 1. JSON Tokens
    const tokensObject = {
      name: dna.title,
      source: dna.url,
      colors: {
        background: baseBg,
        surface: cardBg,
        border: borderCol,
        text: {
          primary: primaryText,
          secondary: secondaryText,
          muted: mutedText,
        },
        accent: accentCol,
      },
      radii: palette.radii,
      shadows: palette.shadows,
      typography: {
        primary: typography.primaryFont,
        editorial: typography.editorialFont,
        mono: typography.monoFont,
        hierarchy: typography.tokens,
      },
      layout,
    };

    const tokensJson = JSON.stringify(tokensObject, null, 2);

    // 2. globals.css (Tailwind v4 @theme & CSS Variables)
    const globalsCss = `@import "tailwindcss";

@layer base {
  :root {
    --background: ${baseBg};
    --foreground: ${primaryText};

    --card: ${cardBg};
    --card-foreground: ${primaryText};

    --popover: ${cardBg};
    --popover-foreground: ${primaryText};

    --primary: ${accentCol};
    --primary-foreground: ${baseBg};

    --secondary: ${palette.surfaces[1] || 'rgba(255, 255, 255, 0.04)'};
    --secondary-foreground: ${primaryText};

    --muted: ${palette.surfaces[2] || 'rgba(255, 255, 255, 0.02)'};
    --muted-foreground: ${mutedText};

    --accent: ${accentCol};
    --accent-foreground: ${baseBg};

    --destructive: #ef4444;
    --destructive-foreground: #ffffff;

    --border: ${borderCol};
    --input: ${borderCol};
    --ring: ${accentCol};

    --radius: ${radiusCard};
  }
}

/* Elite Glassmorphic & Tactical Surfaces */
.glass-surface {
  background-color: var(--card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
}

.glow-card {
  position: relative;
  border-radius: var(--radius);
  background-color: var(--card);
  border: 1px solid var(--border);
  box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.06);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
}

.glow-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.18);
}

${palette.hasNoiseOverlay ? `
/* Subtle Editorial SVG Noise Pattern */
.bg-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.035'/%3E%3C/svg%3E");
}
` : ''}
`;

    // 3. tailwind.config.ts
    const tailwindConfig = `import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        border: 'var(--border)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
      },
      fontFamily: {
        sans: ['${this.cleanFont(typography.primaryFont) || 'Inter'}', 'sans-serif'],
        ${typography.editorialFont ? `editorial: ['${this.cleanFont(typography.editorialFont)}', 'serif'],` : ''}
        ${typography.monoFont ? `mono: ['${typography.monoFont}', 'monospace'],` : ''}
      },
      maxWidth: {
        container: '${layout.containerMaxWidth}',
      },
    },
  },
  plugins: [],
};

export default config;
`;

    // 4. Recommended font links
    const fontFamiliesToLoad = [
      this.cleanFont(typography.primaryFont),
      this.cleanFont(typography.editorialFont),
    ].filter(Boolean) as string[];
    const fontQuery = fontFamiliesToLoad
      .map(f => f.replace(/\s+/g, '+') + ':wght@400;500;600;700')
      .join('&family=');

    const fontImports = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap" rel="stylesheet">`;

    return {
      tokensJson,
      globalsCss,
      tailwindConfig,
      fontImports,
    };
  }
}
