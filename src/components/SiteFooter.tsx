import Link from 'next/link';
import FooterSubscribeForm from '@/components/FooterSubscribeForm';

interface SiteFooterProps {
  variant?: 'full' | 'compact' | 'minimal';
}

export default function SiteFooter({ variant = 'full' }: SiteFooterProps) {
  if (variant === 'minimal') {
    return (
      <footer className="w-full mt-auto py-8 bg-parchment border-t border-lines">
        <div className="max-w-[1120px] mx-auto px-5 md:px-16 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-serif text-xl text-charcoal">El Dialecto</span>
          <p className="font-sans text-xs text-charcoal/60">
            © {new Date().getFullYear()} El Dialecto. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link className="font-sans text-xs text-charcoal/60 hover:text-gold transition-colors" href="#">Privacidad</Link>
            <Link className="font-sans text-xs text-charcoal/60 hover:text-gold transition-colors" href="#">Contacto</Link>
          </div>
        </div>
      </footer>
    );
  }

  if (variant === 'compact') {
    return (
      <footer className="bg-surface border-t border-lines w-full mt-12">
        <div className="w-full py-16 px-5 md:px-16 flex flex-col items-center gap-6 max-w-[1120px] mx-auto">
          <Link className="font-serif text-3xl text-charcoal" href="/">El Dialecto</Link>
          <nav className="flex gap-6">
            <Link className="font-sans text-sm text-charcoal/80 hover:text-gold transition-colors duration-200" href="/">Inicio</Link>
            <Link className="font-sans text-sm text-charcoal/80 hover:text-gold transition-colors duration-200" href="/login">Autores</Link>
          </nav>
          <p className="text-xs font-semibold text-charcoal/60 mt-4">© {new Date().getFullYear()} El Dialecto. Todos los derechos reservados.</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-surface border-t border-lines w-full mt-auto">
      <div className="w-full py-[120px] px-5 md:px-16 flex flex-col md:flex-row justify-between items-start max-w-[1120px] mx-auto gap-12 md:gap-0">
        <div className="flex flex-col gap-4">
          <Link className="font-serif text-2xl text-charcoal" href="/">El Dialecto</Link>
          <p className="text-sm font-sans text-charcoal/80 max-w-xs">
            Discurso intelectual y filosófico.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-semibold text-charcoal uppercase tracking-widest">Navegación</h4>
          <nav className="flex flex-col gap-2">
            <Link className="font-sans text-base text-charcoal/80 hover:text-gold transition-colors duration-200" href="/login">Autores</Link>
          </nav>
        </div>
        <div className="flex flex-col gap-4 max-w-xs">
          <h4 className="text-xs font-semibold text-charcoal uppercase tracking-widest">Suscripción</h4>
          <p className="font-sans text-base text-charcoal/80">Recibe ensayos semanales en tu correo.</p>
          <FooterSubscribeForm />
        </div>
      </div>
      <div className="w-full max-w-[1120px] mx-auto px-5 md:px-16 py-6 border-t border-lines">
        <p className="text-xs font-semibold text-charcoal/60 text-center md:text-left">
          © {new Date().getFullYear()} El Dialecto. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
