import { describe, it, expect } from 'vitest';
import { renderNewsletterEmail, renderUnsubscribeHtml } from './newsletter-template';
import { getDictionaryClient } from '@/dictionaries/client';

describe('Newsletter Template & React Email (src/lib/email/newsletter-template.ts)', () => {
  const sampleProps = {
    title: 'O Futuro da Cultura Galega',
    subtitle: 'Unha reflexión crítica sobre os desafíos actuais.',
    authorName: 'Diego Araújo',
    coverImageUrl: 'https://cernapensamento.org/images/portada.webp',
    articleUrl: 'https://cernapensamento.org/gl/articulo/o-futuro',
    profileUrl: 'https://cernapensamento.org/gl/escritorio/perfil',
    unsubscribeUrl: 'https://cernapensamento.org/api/newsletter/unsubscribe?token=abc',
    lang: 'gl' as const,
    publicationType: 'artigo',
  };

  describe('renderNewsletterEmail', () => {
    it('renders valid HTML email containing brand, title, author, and CTA button', async () => {
      const result = await renderNewsletterEmail(sampleProps);

      expect(result.subject).toContain('O Futuro da Cultura Galega');
      expect(result.html).toContain('CERNA');
      expect(result.html).toContain('O Futuro da Cultura Galega');
      expect(result.html).toContain('Diego Araújo');
      expect(result.html).toContain('https://cernapensamento.org/images/portada.webp');
      expect(result.html).toContain(sampleProps.articleUrl);
      expect(result.html).toContain(sampleProps.unsubscribeUrl);
      expect(result.html).toContain(sampleProps.profileUrl);

      // Verify plain text version
      expect(result.text).toContain('CERNA');
      expect(result.text).toContain('O Futuro da Cultura Galega');
      expect(result.text).toContain('Diego Araújo');
      expect(result.text).toContain(sampleProps.articleUrl);
      expect(result.text).toContain(sampleProps.unsubscribeUrl);
    });

    it('renders cleanly without optional fields (subtitle, author, coverImage)', async () => {
      const minimalProps = {
        title: 'Artigo Breve',
        articleUrl: 'https://cernapensamento.org/gl/articulo/artigo-breve',
        profileUrl: 'https://cernapensamento.org/gl/escritorio/perfil',
        unsubscribeUrl: 'https://cernapensamento.org/api/newsletter/unsubscribe?token=xyz',
        lang: 'gl' as const,
      };

      const result = await renderNewsletterEmail(minimalProps);

      expect(result.subject).toContain('Artigo Breve');
      expect(result.html).toContain('Artigo Breve');
      expect(result.html).not.toContain('undefined');
      expect(result.html).not.toContain('null');
    });

    it('falls back to default title when title is blank or whitespace', async () => {
      const dict = getDictionaryClient('gl');
      const result = await renderNewsletterEmail({
        ...sampleProps,
        title: '   ',
      });

      expect(result.subject).toContain(dict.newsletter.email.defaultTitle);
      expect(result.html).toContain(dict.newsletter.email.defaultTitle);
    });

    it('localizes email content according to Spanish (es) dictionary', async () => {
      const esDict = getDictionaryClient('es');
      const result = await renderNewsletterEmail({
        ...sampleProps,
        title: 'Artículo en Español',
        lang: 'es' as const,
      });

      expect(result.subject).toBe(`${esDict.newsletter.email.subjectPrefix}Artículo en Español`);
      expect(result.text).toContain(esDict.newsletter.email.readButton);
      expect(result.text).toContain(esDict.newsletter.email.footerNote);
    });
  });

  describe('renderUnsubscribeHtml', () => {
    it('renders unsubscription success page with escaped email and home link', async () => {
      const html = await renderUnsubscribeHtml({
        email: 'lector@cerna.org',
        lang: 'gl',
        siteUrl: 'https://cernapensamento.org',
        success: true,
      });

      expect(html).toContain('lector@cerna.org');
      expect(html).toContain('https://cernapensamento.org/gl');
      expect(html).toContain('https://cernapensamento.org/gl/escritorio/perfil');
    });

    it('renders unsubscription error page with custom error message', async () => {
      const html = await renderUnsubscribeHtml({
        email: 'invalid@cerna.org',
        lang: 'es',
        siteUrl: 'https://cernapensamento.org',
        success: false,
        errorMessage: 'Enlace no válido o caducado',
      });

      expect(html).toContain('Enlace no válido o caducado');
      expect(html).toContain('https://cernapensamento.org/es');
    });
  });
});
