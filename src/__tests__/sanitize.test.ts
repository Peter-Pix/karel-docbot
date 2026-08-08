import { describe, it, expect } from 'vitest';
import { sanitizeHTML } from '../lib/sanitize';

describe('sanitizeHTML', () => {
  it('returns empty string for empty input', () => {
    expect(sanitizeHTML('')).toBe('');
  });

  it('removes script tags and their content', () => {
    const input = '<div>Hello</div><script>alert("xss")</script><p>World</p>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('script');
    expect(result).not.toContain('alert');
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('removes iframe tags', () => {
    const input = '<div>Safe</div><iframe src="evil.com"></iframe>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('iframe');
    expect(result).toContain('Safe');
  });

  it('removes event handler attributes', () => {
    const input = '<div onclick="steal()">Click me</div>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('onclick');
    expect(result).toContain('Click me');
  });

  it('removes javascript: URIs from href', () => {
    const input = '<a href="javascript:alert(1)">link</a>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('javascript:');
    expect(result).toContain('href="#"');
  });

  it('removes javascript: URIs from src', () => {
    const input = '<img src="javascript:alert(1)">';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('javascript:');
  });

  it('removes data: URIs from src', () => {
    const input = '<img src="data:text/html,<script>alert(1)</script>">';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('data:');
  });

  it('preserves safe HTML tags', () => {
    const input = '<div class="test"><p>Hello <strong>World</strong></p><span>!</span></div>';
    const result = sanitizeHTML(input);
    expect(result).toContain('<div');
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
    expect(result).toContain('<span>');
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('removes object and embed tags', () => {
    const input = '<div>Safe</div><object data="evil.swf"></object><embed src="evil.swf">';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('object');
    expect(result).not.toContain('embed');
    expect(result).toContain('Safe');
  });

  it('removes base and meta tags', () => {
    const input = '<base href="http://evil.com"><meta http-equiv="refresh" content="0;url=evil.com"><p>Safe</p>';
    const result = sanitizeHTML(input);
    expect(result).not.toContain('base');
    expect(result).not.toContain('meta');
    expect(result).toContain('Safe');
  });
});
