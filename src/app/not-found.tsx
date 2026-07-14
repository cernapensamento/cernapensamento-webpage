import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full border border-lines bg-surface p-12 text-center">
        <h1 className="font-serif text-6xl mb-4">404</h1>
        <h2 className="font-serif text-2xl mb-4">Página Extraviada</h2>
        <p className="font-sans text-charcoal/70 mb-8 leading-relaxed">
          El manuscrito o sección que buscas no existe en nuestros archivos o ha sido retirado de la publicación.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-charcoal text-parchment text-sm font-semibold uppercase tracking-widest hover:bg-gold transition-colors"
        >
          Retornar a la Portada
        </Link>
      </div>
    </div>
  );
}
