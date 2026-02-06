// HSL to Hex Conversion Helper
export function HSLToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  b = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`.toUpperCase();
}

// Generate Harmony Rules
export function generateHarmony(baseHue) {
  // Randomly select a harmony rule
  const schemes = ['analogous', 'monochromatic', 'triadic', 'complementary', 'split-complementary'];
  const scheme = schemes[Math.floor(Math.random() * schemes.length)];
  
  const colors = [];
  // Ensure baseHue is 0-360
  baseHue = baseHue % 360;

  switch (scheme) {
    case 'analogous':
      // Base +/- 30 degrees
      colors.push({ h: baseHue, s: 70, l: 50 });
      colors.push({ h: (baseHue + 30) % 360, s: 70, l: 55 });
      colors.push({ h: (baseHue + 60) % 360, s: 65, l: 45 });
      colors.push({ h: (baseHue - 30 + 360) % 360, s: 70, l: 55 });
      colors.push({ h: (baseHue - 60 + 360) % 360, s: 65, l: 45 });
      break;
    case 'monochromatic':
      // Same hue, varying lightness/saturation
      colors.push({ h: baseHue, s: 70, l: 50 });
      colors.push({ h: baseHue, s: 60, l: 30 });
      colors.push({ h: baseHue, s: 80, l: 80 });
      colors.push({ h: baseHue, s: 50, l: 40 });
      colors.push({ h: baseHue, s: 90, l: 90 });
      break;
    case 'triadic':
      // Base + 120 + 240
      colors.push({ h: baseHue, s: 70, l: 50 });
      colors.push({ h: (baseHue + 120) % 360, s: 70, l: 50 });
      colors.push({ h: (baseHue + 240) % 360, s: 70, l: 50 });
      colors.push({ h: baseHue, s: 50, l: 70 });
      colors.push({ h: (baseHue + 120) % 360, s: 50, l: 30 }); // Contrast variation
      break;
    case 'complementary':
      // Base + 180 (and variations)
      colors.push({ h: baseHue, s: 70, l: 50 });
      colors.push({ h: (baseHue + 180) % 360, s: 70, l: 50 });
      colors.push({ h: baseHue, s: 50, l: 80 });
      colors.push({ h: (baseHue + 180) % 360, s: 50, l: 30 });
      colors.push({ h: baseHue, s: 60, l: 40 });
      break;
    case 'split-complementary':
       // Base + 150 + 210
      colors.push({ h: baseHue, s: 70, l: 50 });
      colors.push({ h: (baseHue + 150) % 360, s: 70, l: 50 });
      colors.push({ h: (baseHue + 210) % 360, s: 70, l: 50 });
      colors.push({ h: baseHue, s: 50, l: 80 });
      colors.push({ h: (baseHue + 150) % 360, s: 50, l: 30 });
      break;
    default:
        // Fallback to analogous
      return generateHarmony(baseHue);
  }

  // Convert to formatted objects
  return colors.map(c => ({
    hsl: `hsl(${Math.round(c.h)}, ${c.s}%, ${c.l}%)`,
    hex: HSLToHex(c.h, c.s, c.l),
    locked: false, // Default state
    h: c.h, s: c.s, l: c.l
  }));
}

// WCAG Contrast Check
function getLuminance(hex) {
  const rgb = parseInt(hex.slice(1), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(bgHex, textHex) {
  const lum1 = getLuminance(bgHex);
  const lum2 = getLuminance(textHex);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export function getBestTextColor(bgHex) {
  const whiteContrast = getContrastRatio(bgHex, '#FFFFFF');
  const blackContrast = getContrastRatio(bgHex, '#000000');
  
  // Prefer white if it passes AA (4.5), otherwise default to best contrast
  // Or simply return the one with higher contrast
  return whiteContrast >= blackContrast ? '#FFFFFF' : '#000000';
}

export function isAccessible(bgHex, textHex) {
    const ratio = getContrastRatio(bgHex, textHex);
    return ratio >= 4.5 ? 'Pass' : ratio >= 3.0 ? 'Large Text Only' : 'Fail';
}


// Font Pairings
export const FONT_PAIRS = [
  { header: 'Playfair Display', body: 'Lato', label: 'Classic Elegance' },
  { header: 'Montserrat', body: 'Open Sans', label: 'Modern Geometric' },
  { header: 'Oswald', body: 'Roboto', label: 'Bold Standard' },
  { header: 'Merriweather', body: 'Source Sans Pro', label: 'Editorial Clean' },
  { header: 'Raleway', body: 'Roboto Slab', label: 'Sophisticated' },
  { header: 'Abril Fatface', body: 'Poppins', label: 'High Contrast' },
  { header: 'Space Mono', body: 'Inter', label: 'Tech Minimal' },
];

export function getRandomFontPair() {
    return FONT_PAIRS[Math.floor(Math.random() * FONT_PAIRS.length)];
}
