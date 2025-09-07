// TaxiTub Module: Color Contrast Validation Utility
// Version: v0.1.0
// Last Updated: 2025-09-07
// Author: AI Agent
// Changelog: WCAG AA/AAA color contrast validation utility

/**
 * Color Contrast Validation Utility
 * 
 * Validates color combinations against WCAG accessibility standards
 * Ensures text readability across different visual conditions
 * 
 * WCAG Standards:
 * - AA Normal Text: 4.5:1 contrast ratio
 * - AA Large Text: 3:1 contrast ratio  
 * - AAA Normal Text: 7:1 contrast ratio
 * - AAA Large Text: 4.5:1 contrast ratio
 */

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result![1]!, 16),
    g: parseInt(result![2]!, 16),
    b: parseInt(result![3]!, 16)
  } : null;
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 specifications
 */
function getLuminance(r: number, g: number, b: number): number {
  const mapped = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }) as number[];
  const [rs, gs, bs] = mapped as [number, number, number];
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Use hex colors (e.g., #ffffff)');
  }
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * WCAG compliance levels
 */
export enum WCAGLevel {
  AA_NORMAL = 4.5,
  AA_LARGE = 3,
  AAA_NORMAL = 7,
  AAA_LARGE = 4.5
}

/**
 * Check if color combination meets WCAG standards
 */
export function meetsWCAG(
  foreground: string, 
  background: string, 
  level: WCAGLevel = WCAGLevel.AA_NORMAL
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= level;
}

/**
 * Get WCAG compliance status with detailed information
 */
export function getWCAGStatus(foreground: string, background: string) {
  const ratio = getContrastRatio(foreground, background);
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    AA_normal: ratio >= WCAGLevel.AA_NORMAL,
    AA_large: ratio >= WCAGLevel.AA_LARGE,
    AAA_normal: ratio >= WCAGLevel.AAA_NORMAL,
    AAA_large: ratio >= WCAGLevel.AAA_LARGE,
    rating: ratio >= WCAGLevel.AAA_NORMAL ? 'AAA' : 
             ratio >= WCAGLevel.AA_NORMAL ? 'AA' : 
             ratio >= WCAGLevel.AA_LARGE ? 'AA Large Text Only' : 'Fail'
  };
}

/**
 * Validate TaxiTub color combinations
 * Tests key color pairs used in the application
 */
export function validateTaxiTubColors() {
  const colorTests = [
    // Primary text combinations
    { name: 'Primary text on dark bg', fg: '#FEFEFE', bg: '#262322' },
    { name: 'Secondary text on dark bg', fg: '#D0CDC8', bg: '#262322' },
    { name: 'Badge active text', fg: '#FEFEFE', bg: '#F5851D' },
    { name: 'Badge empty text', fg: '#D0CDC8', bg: '#9F9995' },
    { name: 'Success badge text', fg: '#FEFEFE', bg: '#16A34A' },
    { name: 'Error badge text', fg: '#FEFEFE', bg: '#DC2626' },
    { name: 'Warning badge text', fg: '#FEFEFE', bg: '#D97706' },
    { name: 'Info badge text', fg: '#FEFEFE', bg: '#3B82F6' },
    
    // Form field combinations
    { name: 'Form input text', fg: '#FEFEFE', bg: '#4E4A48' },
    { name: 'Form label text', fg: '#D0CDC8', bg: '#262322' },
    { name: 'Helper text', fg: '#D0CDC8', bg: '#262322' },
    
    // Navigation combinations
    { name: 'Navigation text', fg: '#FEFEFE', bg: '#262322' },
    { name: 'Tab indicator', fg: '#F5851D', bg: '#262322' },
  ];
  
  const results = colorTests.map(test => ({
    ...test,
    ...getWCAGStatus(test.fg, test.bg)
  }));
  
  return results;
}

/**
 * Console log color contrast validation results
 * Useful for development and testing
 */
export function logColorContrastResults() {
  console.group('🎨 TaxiTub Color Contrast Validation');
  
  const results = validateTaxiTubColors();
  const passed = results.filter(r => r.AA_normal).length;
  const total = results.length;
  
  console.log(`✅ ${passed}/${total} color combinations pass WCAG AA standards`);
  console.log('📊 Detailed Results:');
  
  results.forEach(result => {
    const status = result.AA_normal ? '✅' : result.AA_large ? '⚠️' : '❌';
    console.log(`${status} ${result.name}: ${result.ratio}:1 (${result.rating})`);
  });
  
  const failing = results.filter(r => !r.AA_normal);
  if (failing.length > 0) {
    console.warn('⚠️ Colors needing improvement:', failing.map(f => f.name));
  }
  
  console.groupEnd();
  return results;
}
