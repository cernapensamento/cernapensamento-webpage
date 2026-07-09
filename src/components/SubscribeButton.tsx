import Link from 'next/link';

export default function SubscribeButton() {
  return (
    <Link
      href="/login"
      className="font-sans text-xs font-semibold text-parchment bg-charcoal px-4 py-2 hover:bg-gold hover:text-parchment transition-all duration-300 uppercase tracking-wider cursor-pointer border border-charcoal/10 dark:border-white/10 shadow-xs active:scale-95 inline-block text-center"
    >
      Crear Cuenta
    </Link>
  );
}
