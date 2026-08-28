import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'src/content');

export function getDocument(slug: string, lang: string) {
  const fullPath = path.join(contentDirectory, slug, `${lang}.md`);
  
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    return { data, content };
  } catch (error) {
    console.error(`Error reading markdown file at ${fullPath}:`, error);
    return { data: {}, content: '' };
  }
}
