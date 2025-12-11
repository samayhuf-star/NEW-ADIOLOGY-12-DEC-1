import { useState, useCallback } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import VisualSectionsEditor from './VisualSectionsEditor';
import { TemplateData, SavedWebsite, updateSavedWebsite, downloadTemplate } from '../utils/savedWebsites';
import { supabase } from '../utils/supabase/client';

interface TemplateEditorBuilderProps {
  savedWebsite: SavedWebsite;
  onClose: () => void;
  onUpdate: (website: SavedWebsite) => void;
}

export default function TemplateEditorBuilder({ savedWebsite, onClose, onUpdate }: TemplateEditorBuilderProps) {
  const [templateData, setTemplateData] = useState<TemplateData>(savedWebsite.data);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [exportedHtml, setExportedHtml] = useState<string>('');
  const [exportedCss, setExportedCss] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  
  console.log('📝 TemplateEditorBuilder loaded with:', {
    id: savedWebsite.id,
    name: savedWebsite.name,
    hasData: !!savedWebsite.data,
    dataKeys: savedWebsite.data ? Object.keys(savedWebsite.data) : [],
  });

  const handleBuilderUpdate = useCallback((html: string, css: string, sectionData?: Partial<TemplateData>) => {
    setExportedHtml(html);
    setExportedCss(css);
    if (sectionData) {
      setTemplateData(prev => ({ ...prev, ...sectionData }));
    }
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = async () => {
    const updatedData = {
      ...templateData,
      rawHtml: exportedHtml || templateData.rawHtml,
      rawCss: exportedCss || templateData.rawCss,
    };
    setTemplateData(updatedData);
    const updated = updateSavedWebsite(savedWebsite.id, { data: updatedData });
    if (updated) {
      onUpdate(updated);
    }
    setHasUnsavedChanges(false);
  };

  const handleDownload = () => {
    if (exportedHtml) {
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateData.seo?.title || templateData.title}</title>
  <meta name="description" content="${templateData.seo?.description || ''}">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${exportedCss}</style>
</head>
<body>
${exportedHtml}
</body>
</html>`;
      
      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${savedWebsite.name.toLowerCase().replace(/\s+/g, '-')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      downloadTemplate(templateData, `${savedWebsite.name.toLowerCase().replace(/\s+/g, '-')}.html`);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const domain = (savedWebsite as any).domain || `${savedWebsite.name.toLowerCase().replace(/\s+/g, '-')}.adiology.app`;
      
      const { error } = await supabase.from('admin_websites').upsert({
        id: savedWebsite.id,
        name: savedWebsite.name,
        user_email: user?.email || 'unknown',
        domain: domain,
        status: 'Published',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) throw error;
      alert('✅ Website published! Domain: ' + domain);
      console.log('🚀 Website published to admin_websites:', domain);
    } catch (error) {
      console.error('Error publishing website:', error);
      alert('❌ Failed to publish website');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">{savedWebsite.name}</h2>
            <p className="text-xs text-gray-500">Visual Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <VisualSectionsEditor
          templateData={templateData}
          onUpdate={handleBuilderUpdate}
          onSave={handleSave}
          onExport={handleDownload}
        />
      </div>
    </div>
  );
}
