import Link from 'next/link';

export default function FooterSubscribeForm() {
  return (
    <div className="flex w-full mt-2">
      <Link href="/login" className="text-xs font-semibold text-charcoal uppercase tracking-widest hover:text-gold transition-colors duration-300 border-b border-charcoal pb-1">
        Crear cuenta para suscribirse al newsletter
      </Link>
    </div>
  );
}
