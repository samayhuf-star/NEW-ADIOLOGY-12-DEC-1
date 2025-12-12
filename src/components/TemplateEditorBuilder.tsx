import { useState, useCallback } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
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
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'save' | 'publish'>('save');
  const [inputName, setInputName] = useState(savedWebsite.name);
  const [currentName, setCurrentName] = useState(savedWebsite.name);
  
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

  const handleSaveClick = () => {
    setInputName(currentName);
    setDialogMode('save');
    setShowNameDialog(true);
  };

  const handleSaveConfirm = () => {
    const finalName = inputName.trim() || savedWebsite.name;
    setShowNameDialog(false);
    
    const updatedData = {
      ...templateData,
      rawHtml: exportedHtml || templateData.rawHtml,
      rawCss: exportedCss || templateData.rawCss,
    };
    setTemplateData(updatedData);
    setCurrentName(finalName);
    
    const updated = updateSavedWebsite(savedWebsite.id, { data: updatedData, name: finalName });
    if (updated) {
      onUpdate(updated);
    }
    setHasUnsavedChanges(false);
    alert('Website saved as: ' + finalName);
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

  const handlePublishClick = () => {
    setInputName(currentName);
    setDialogMode('publish');
    setShowNameDialog(true);
  };

  const handlePublishConfirm = async () => {
    const finalName = inputName.trim() || savedWebsite.name;
    setShowNameDialog(false);
    setIsPublishing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const domain = `${finalName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.adiology.app`;
      
      console.log('📤 Publishing website:', { id: savedWebsite.id, name: finalName, domain, user: user?.email });
      
      const { data, error } = await supabase.from('admin_websites').upsert({
        id: savedWebsite.id,
        name: finalName,
        user_email: user?.email || 'unknown',
        domain: domain,
        status: 'Published',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      setCurrentName(finalName);
      const updated = updateSavedWebsite(savedWebsite.id, { name: finalName });
      if (updated) {
        onUpdate(updated);
      }
      
      console.log('✅ Website published successfully:', data);
      alert('Website published successfully!\n\nName: ' + finalName + '\nDomain: ' + domain);
    } catch (error: any) {
      console.error('Error publishing website:', error);
      const errorMsg = error?.message || error?.details || 'Unknown error';
      alert('Failed to publish website\n\nError: ' + errorMsg);
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
            <h2 className="font-semibold text-gray-900 text-sm">{currentName}</h2>
            <p className="text-xs text-gray-500">Visual Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePublishClick}
            disabled={isPublishing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>
      
      {showNameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {dialogMode === 'save' ? 'Save Website' : 'Publish Website'}
              </h3>
              <button
                onClick={() => setShowNameDialog(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website Name
              </label>
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="Enter website name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                This name will be shown in your saved websites list
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowNameDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={dialogMode === 'save' ? handleSaveConfirm : handlePublishConfirm}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700"
              >
                {dialogMode === 'save' ? 'Save' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-auto">
        <VisualSectionsEditor
          templateData={templateData}
          onUpdate={handleBuilderUpdate}
          onSave={handleSaveClick}
          onExport={handleDownload}
        />
      </div>
    </div>
  );
}
