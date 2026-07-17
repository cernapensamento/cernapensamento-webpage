import fs from 'fs';

const path = 'src/components/escritorio/ArticleEditor.tsx';
let content = fs.readFileSync(path, 'utf-8');

// Check if uploadedInlineImages is present
const hasUploaded = content.includes('const [uploadedInlineImages');
console.log("Has state:", hasUploaded);

if (!hasUploaded) {
    content = content.replace(
      'const [isUploadingInline, setIsUploadingInline] = useState(false);',
      'const [isUploadingInline, setIsUploadingInline] = useState(false);\n    const [uploadedInlineImages, setUploadedInlineImages] = useState<string[]>([]);'
    );
    fs.writeFileSync(path, content, 'utf-8');
    console.log("State added");
}
