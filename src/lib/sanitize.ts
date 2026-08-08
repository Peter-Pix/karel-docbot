/**
 * Sanitizes HTML strings before rendering via dangerouslySetInnerHTML.
 * 
 * Removes potentially dangerous content:
 * - Strips <script> tags and their content
 * - Removes event handler attributes (onclick, onload, onerror, etc.)
 * - Removes javascript: URIs from href/src attributes
 * - Strips iframe, object, embed, base tags
 * - Allows safe formatting tags (b, i, strong, em, span, div, p, br, h1-h6, ul, ol, li, etc.)
 */

const DANGEROUS_TAGS = ['script', 'iframe', 'object', 'embed', 'base', 'meta', 'link', 'style'];

const DANGEROUS_ATTRS = [
  /on\w+\s*=/i,  // onclick=, onload=, onerror=, etc.
];

/**
 * Basic HTML sanitizer for contract preview content.
 * Since contractHTML is generated internally (not raw user input from a WYSIWYG),
 * the risk is lower but defense-in-depth requires sanitization.
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  let sanitized = html;

  // Remove dangerous tags entirely (with their content)
  for (const tag of DANGEROUS_TAGS) {
    const regex = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    // Also remove self-closing variants
    const selfClosing = new RegExp(`<${tag}\\b[^>]*/?>`, 'gi');
    sanitized = sanitized.replace(selfClosing, '');
  }

  // Remove event handler attributes
  for (const pattern of DANGEROUS_ATTRS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove javascript: URIs from href and src attributes
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, '');

  // Remove data: URIs from src attributes (can be used for XSS in some contexts)
  sanitized = sanitized.replace(/src\s*=\s*["']data:[^"']*["']/gi, '');

  return sanitized;
}