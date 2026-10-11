import FeaturedArticleHero from '@/components/sections/FeaturedArticleHero';
import PinnedArticlesPanel from '@/components/sections/PinnedArticlesPanel';
import ArticleCard from '@/components/features/ArticleCard';
import ColumnistsSection from '@/components/sections/ColumnistsSection';
import AboutUsSection from '@/components/sections/AboutUsSection';
import ThemesSection from '@/components/sections/ThemesSection';
import ContactSection from '@/components/sections/ContactSection';
import { getPublicationCards } from '@/lib/db/queries/publications';
import { getDictionary } from '@/dictionaries';
import type { Locale } from '@/i18n-config';

export const revalidate = 60;

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  // Fetch published publications using the typed Data Access Layer
  const allArticles = await getPublicationCards({
    limit: 20,
    lang,
  });

  const pinnedArticles = allArticles.filter((a) => a.is_pinned).slice(0, 8);
  const regularArticles = allArticles.filter((a) => !a.is_pinned);

  const featuredArticle = regularArticles.length > 0 ? regularArticles[0] : null;
  const otherArticles = regularArticles.length > 1 ? regularArticles.slice(1, 7) : [];

  return (
    <>
      <main className="flex-grow w-full max-w-[1120px] mx-auto px-5 md:px-16 pt-12 pb-[120px] flex flex-col gap-[120px]">
        {featuredArticle && (
          <FeaturedArticleHero articulo={featuredArticle} lang={lang} dict={dict} />
        )}

        <section className="border-t border-lines pt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16">
            {otherArticles && otherArticles.length > 0 ? (
              otherArticles.map((articulo) => (
                <ArticleCard key={articulo.id} articulo={articulo} lang={lang} dict={dict} />
              ))
            ) : (
              <p className="font-sans text-charcoal/60">
                {lang === 'es' ? 'No hay artículos adicionales publicados.' : 'Non hai artigos adicionais publicados.'}
              </p>
            )}
          </div>
        </section>

        <PinnedArticlesPanel articulos={pinnedArticles} lang={lang} dict={dict} />
      </main>
      
      <AboutUsSection lang={lang} dict={dict.about} />
      <ThemesSection lang={lang} dict={dict.themes} />
      <ColumnistsSection lang={lang} dict={{ columnists: dict.columnists, authors: dict.authors }} />
      <ContactSection dict={dict.contact} />
    </>
  );
}
