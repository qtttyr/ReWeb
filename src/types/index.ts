export interface ColorStop {
  color: string;
  count: number;
  roles: string[]; // 'background' | 'surface' | 'border' | 'text' | 'accent'
}

export interface TypographyToken {
  tag: string;
  selector: string;
  fontFamily: string;
  fontSize: string;
  fontSizePx: number;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textTransform: string;
  color: string;
  sampleText: string;
}

export interface ShadowToken {
  raw: string;
  type: 'ambient' | 'directional' | 'inset-glow' | 'card';
  blurPx: number;
  color: string;
}

export interface MaterialTokens {
  backgrounds: string[];
  surfaces: string[];
  borders: string[];
  textColors: {
    primary: string;
    secondary: string;
    muted: string;
  };
  accents: string[];
  radii: {
    pill: string;
    card: string;
    button: string;
    badge: string;
  };
  shadows: ShadowToken[];
  backdropFilters: string[];
  hasNoiseOverlay: boolean;
}

export interface MotionToken {
  selector: string;
  property: string;
  duration: string;
  easing: string;
  hoverDelta?: {
    scale?: number;
    translateY?: string;
    borderColor?: string;
    boxShadow?: string;
  };
}

export interface SectionBlueprint {
  id: string;
  index: number;
  role: 'navbar' | 'hero' | 'bento-grid' | 'feature-showcase' | 'stats' | 'testimonials' | 'cta' | 'footer' | 'content';
  tag: string;
  selector: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  desktopScreenshot: string;
  mobileScreenshot?: string;
  headline?: string;
  subheadline?: string;
  badgeText?: string;
  ctaButtons: Array<{
    text: string;
    variant: 'primary' | 'secondary' | 'ghost';
    styles: {
      background: string;
      color: string;
      borderRadius: string;
      border: string;
      boxShadow: string;
    };
  }>;
  cardsCount?: number;
  layoutGrid?: {
    columns: number;
    gap: string;
    cardAspectRatios: string[];
  };
  styles: {
    backgroundColor: string;
    color: string;
    paddingTop: string;
    paddingBottom: string;
    maxWidth: string;
    borderRadius?: string;
    border?: string;
  };
}

export interface DesignDNA {
  url: string;
  timestamp: string;
  title: string;
  description?: string;
  viewport: {
    desktop: { width: number; height: number };
    mobile: { width: number; height: number };
  };
  palette: MaterialTokens;
  typography: {
    primaryFont: string;
    editorialFont?: string;
    monoFont?: string;
    tokens: TypographyToken[];
  };
  motion: MotionToken[];
  layout: {
    containerMaxWidth: string;
    gridGaps: string[];
    sectionPaddingsY: string[];
  };
  sections: SectionBlueprint[];
  fullScreenshot: {
    desktop: string;
    mobile: string;
  };
}
