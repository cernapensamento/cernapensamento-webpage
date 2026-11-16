import type { Metadata } from 'next';
import {
  EditorialCollectionPage,
  createCollectionMetadata,
} from '@/components/features/EditorialCollectionPage';

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return createCollectionMetadata('coleccion-narrativa', lang);
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  return <EditorialCollectionPage slug="coleccion-narrativa" lang={lang} />;
}
