import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { i18n, isSupportedLocale } from '@/i18n-config';

const contentDirectory = path.resolve(process.cwd(), 'src/content');

function readMarkdownFile(filePath: string) {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  return { data, content };
}

export function getDocument(slug: string, lang: string) {
  const fullPath = path.resolve(contentDirectory, slug, `${lang}.md`);
  const relativePath = path.relative(contentDirectory, fullPath);
  if (relativePath.startsWith(`..${path.sep}`) || relativePath === '..' || path.isAbsolute(relativePath)) {
    return { data: {}, content: '' };
  }

  try {
    return readMarkdownFile(fullPath);
  } catch (error) {
    if (isSupportedLocale(lang) && lang !== i18n.defaultLocale) {
      const fallbackPath = path.resolve(contentDirectory, slug, `${i18n.defaultLocale}.md`);
      const fallbackRel = path.relative(contentDirectory, fallbackPath);
      if (!fallbackRel.startsWith(`..${path.sep}`) && fallbackRel !== '..' && !path.isAbsolute(fallbackRel)) {
        try {
          return readMarkdownFile(fallbackPath);
        } catch {
          // Fall through to report the initial missing document error.
        }
      }
    }
    console.error(`Error reading markdown file at ${fullPath}:`, error);
    return { data: {}, content: '' };
  }
}
