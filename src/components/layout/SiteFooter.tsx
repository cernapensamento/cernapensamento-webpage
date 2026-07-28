import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';
import { headers } from 'next/headers';
import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';

interface SiteFooterProps {
  variant?: 'full' | 'compact' | 'minimal';
}

export default async function SiteFooter({ variant = 'full' }: SiteFooterProps) {
  const headersList = await headers();
  const lang = (headersList.get('x-locale') as Locale) || 'gl';
  const dict = await getDictionary(lang);
  const currentYear = new Date().getFullYear();

  if (variant === 'minimal') {
    return (
      <footer className="w-full mt-auto py-8 bg-parchment border-t border-lines">
        <div className="max-w-[1120px] mx-auto px-5 md:px-16 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-serif text-xl text-charcoal">{SITE_NAME}</span>
          <div className="flex flex-col items-center md:items-center">
            <p className="font-sans text-xs text-charcoal/60">
              © {currentYear} {SITE_NAME}. {dict.footer.rights}
            </p>
            <div className="flex items-center gap-2 mt-2 text-[10px] text-charcoal/40">
              <span>Desenvolvido por Pablo</span>
              <span>•</span>
              <a href="https://github.com/Pabl0125" target="_blank" rel="noopener noreferrer" className="hover:text-charcoal transition-colors">GitHub</a>
              <span>•</span>
              <a href="mailto:tucorreo@ejemplo.com" className="hover:text-charcoal transition-colors">Contacto</a>
            </div>
          </div>
          <div className="flex gap-6">
            <Link className="font-sans text-xs text-charcoal/60 hover:text-gold transition-colors" href={`/${lang}/estatutos`}>{dict.footer.links.estatutos}</Link>
            <Link className="font-sans text-xs text-charcoal/60 hover:text-gold transition-colors" href="#">{dict.footer.links.privacidad}</Link>
            <Link className="font-sans text-xs text-charcoal/60 hover:text-gold transition-colors" href="#">{dict.footer.links.contacto}</Link>
          </div>
        </div>
      </footer>
    );
  }

  if (variant === 'compact') {
    return (
      <footer className="bg-surface border-t border-lines w-full mt-12">
        <div className="w-full py-16 px-5 md:px-16 flex flex-col items-center gap-6 max-w-[1120px] mx-auto">
          <Link className="font-serif text-3xl text-charcoal" href={`/${lang}`}>{SITE_NAME}</Link>
          <nav className="flex gap-6">
            <Link className="font-sans text-sm text-charcoal/80 hover:text-gold transition-colors duration-200" href={`/${lang}`}>Inicio</Link>
            <Link className="font-sans text-sm text-charcoal/80 hover:text-gold transition-colors duration-200" href={`/${lang}/login`}>{dict.nav.login}</Link>
            <Link className="font-sans text-sm text-charcoal/80 hover:text-gold transition-colors duration-200" href={`/${lang}/estatutos`}>{dict.footer.links.estatutos}</Link>
          </nav>
          <div className="flex flex-col items-center text-center mt-4">
            <p className="text-xs font-semibold text-charcoal/60">© {currentYear} {SITE_NAME}. {dict.footer.rights}</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-charcoal/40">
              <span>Desenvolvido por Pablo</span>
              <span>•</span>
              <a href="https://github.com/Pabl0125" target="_blank" rel="noopener noreferrer" className="hover:text-charcoal transition-colors">GitHub</a>
              <span>•</span>
              <a href="mailto:tucorreo@ejemplo.com" className="hover:text-charcoal transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-surface border-t border-lines w-full mt-auto">
      <div className="w-full py-[120px] px-5 md:px-16 flex flex-col md:flex-row justify-between items-start max-w-[1120px] mx-auto gap-12 md:gap-0">
        <div className="flex flex-col gap-4">
          <Link className="font-serif text-2xl text-charcoal" href={`/${lang}`}>{SITE_NAME}</Link>
          <p className="text-sm font-sans text-charcoal/80 max-w-xs">
            Discurso intelectual e filosófico.
          </p>
          <Link className="font-sans text-sm text-charcoal/60 hover:text-gold transition-colors duration-200 underline decoration-1 underline-offset-2" href={`/${lang}/bases-editoriales`}>{dict.footer.links.bases}</Link>
          <Link className="font-sans text-sm text-charcoal/60 hover:text-gold transition-colors duration-200 underline decoration-1 underline-offset-2 mt-1" href={`/${lang}/estatutos`}>{dict.footer.links.estatutos}</Link>
        </div>

      </div>
      <div className="w-full max-w-[1120px] mx-auto px-5 md:px-16 py-6 border-t border-lines">
        <div className="flex flex-col md:flex-row w-full justify-between items-center gap-4">
          <p className="text-xs font-semibold text-charcoal/60 text-center md:text-left">
            © {currentYear} {SITE_NAME}. {dict.footer.rights}
          </p>
          <div className="flex items-center gap-3 text-[10px] md:text-xs text-charcoal/40">
            <span>Portal Web desenvolvido por Pablo Araújo</span>
            <span>•</span>
            <a href="https://github.com/Pabl0125" target="_blank" rel="noopener noreferrer" className="hover:text-charcoal transition-colors">GitHub</a>
            <span>•</span>
            <a href="mailto:tucorreo@ejemplo.com" className="hover:text-charcoal transition-colors">Contacto</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
