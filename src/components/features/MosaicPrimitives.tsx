import Image from 'next/image';

/** Animated gold hairline revealed at the top edge of mosaic cards on hover. */
export function TopGoldHoverLine() {
  return (
    <span
      aria-hidden="true"
      className="absolute left-0 top-0 z-20 h-[2px] w-0 bg-gold transition-all duration-500 group-hover:w-full"
    />
  );
}

/** Full-bleed cover image with an adaptive parchment/charcoal protective gradient overlay. */
export function MosaicCoverBackdrop({
  src,
  alt,
  sizes,
  gradientToClass = 'dark:to-black/25',
}: {
  src: string;
  alt: string;
  sizes: string;
  gradientToClass?: string;
}) {
  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t from-parchment via-parchment/85 to-parchment/20 dark:from-black/95 dark:via-black/75 ${gradientToClass} transition-colors duration-300`}
      />
    </>
  );
}
