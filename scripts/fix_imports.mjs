import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');
const mapping = {
  '@/components/BackButton': '@/components/ui/BackButton',
  '@/components/SubscribeButton': '@/components/ui/SubscribeButton',
  '@/components/LanguageToggle': '@/components/ui/LanguageToggle',
  '@/components/ThemeToggle': '@/components/ui/ThemeToggle',
  '@/components/PublicNavBar': '@/components/layout/PublicNavBar',
  '@/components/SiteFooter': '@/components/layout/SiteFooter',
  '@/components/AboutUsSection': '@/components/sections/AboutUsSection',
  '@/components/ColumnistsSection': '@/components/sections/ColumnistsSection',
  '@/components/ContactSection': '@/components/sections/ContactSection',
  '@/components/FeaturedArticleHero': '@/components/sections/FeaturedArticleHero',
  '@/components/ThemesSection': '@/components/sections/ThemesSection',
  '@/components/PinnedArticlesPanel': '@/components/sections/PinnedArticlesPanel',
  '@/components/CommentForm': '@/components/forms/CommentForm',
  '@/components/FooterSubscribeForm': '@/components/forms/FooterSubscribeForm',
  '@/components/PasswordForm': '@/components/forms/PasswordForm',
  '@/components/ProfileForm': '@/components/forms/ProfileForm',
  '@/components/escritorio/EditarArticuloForm': '@/components/forms/EditarArticuloForm',
  '@/components/ArticleCard': '@/components/features/ArticleCard',
  '@/components/ArticlesFilterBar': '@/components/features/ArticlesFilterBar',
  '@/components/CommentsSection': '@/components/features/CommentsSection',
  '@/components/ProfileDashboard': '@/components/features/ProfileDashboard',
  '@/app/actions': '@/actions/auth',
  '@/app/actions/locale': '@/actions/locale'
};

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  for (const [oldPath, newPath] of Object.entries(mapping)) {
    // Replace absolute imports @/...
    const regex = new RegExp(`from ['"]${oldPath}['"]`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `from '${newPath}'`);
      changed = true;
    }
    
    // Replace relative imports (naive approach)
    const baseName = path.basename(oldPath);
    const newDir = path.dirname(newPath.replace('@/components/', ''));
    
    if (oldPath.includes('components')) {
      // Matches: from '../components/Component' or '../../components/Component'
      const relRegex = new RegExp(`from ['"](\\.?\\.?\\/)+components\\/${baseName}['"]`, 'g');
      if (relRegex.test(content)) {
        content = content.replace(relRegex, (match, dots) => {
          return `from '${dots}components/${newDir}/${baseName}'`;
        });
        changed = true;
      }
      
      // Matches: from './Component' when inside components folder
      if (file.includes('src/components/')) {
        const dotRegex = new RegExp(`from ['"]\\.\\/${baseName}['"]`, 'g');
        if (dotRegex.test(content)) {
           // We are in some folder inside components. Figure out relative path to new path
           // Since we moved it, let's just use absolute path to be safe
           content = content.replace(dotRegex, `from '${newPath}'`);
           changed = true;
        }
      }
    } else if (oldPath.includes('actions')) {
      const relRegex = new RegExp(`from ['"](\\.?\\.?\\/)+app\\/actions['"]`, 'g');
      if (relRegex.test(content)) {
        content = content.replace(relRegex, `from '@/actions/auth'`);
        changed = true;
      }
      const relRegex2 = new RegExp(`from ['"](\\.?\\.?\\/)+actions['"]`, 'g');
      if (relRegex2.test(content)) {
        content = content.replace(relRegex2, `from '@/actions/auth'`);
        changed = true;
      }
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
