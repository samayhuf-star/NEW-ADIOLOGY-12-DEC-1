import { useState, useCallback } from 'react';
import { ArrowLeft, Upload, X, Globe, Info, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import VisualSectionsEditor from './VisualSectionsEditor';
import { TemplateData, SavedWebsite, updateSavedWebsite, downloadTemplate } from '../utils/savedWebsites';
import { supabase } from '../utils/supabase/client';
import { generateSlug, cleanWebsiteName } from '../utils/slugify';

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
  const [dialogMode, setDialogMode] = useState<'save' | 'publish' | 'domain'>('save');
  const [inputName, setInputName] = useState(savedWebsite.name);
  const [currentName, setCurrentName] = useState(savedWebsite.name);
  const [publishedUrl, setPublishedUrl] = useState<string>('');
  const [customDomain, setCustomDomain] = useState('');
  const [domainVerified, setDomainVerified] = useState(false);
  const [copied, setCopied] = useState(false);
  
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
    const finalName = cleanWebsiteName(inputName.trim() || savedWebsite.name);
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

  const handleDomainInfoClick = () => {
    setDialogMode('domain');
    setShowNameDialog(true);
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyDomain = async () => {
    if (!customDomain.trim()) return;
    
    try {
      const response = await fetch(`https://dns.google/resolve?name=${customDomain.trim()}&type=A`);
      const data = await response.json();
      
      if (data.Answer && data.Answer.some((a: any) => a.data === '76.76.21.21')) {
        setDomainVerified(true);
        
        await fetch('/api/verify-domain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: savedWebsite.id,
            custom_domain: customDomain.trim(),
          }),
        });
        
        alert('Domain verified successfully! Your custom domain is now connected.');
      } else {
        setDomainVerified(false);
        alert('Domain not verified. Please ensure the A record points to 76.76.21.21 and wait for DNS propagation (can take up to 48 hours).');
      }
    } catch (error) {
      console.error('Domain verification error:', error);
      alert('Failed to verify domain. Please try again later.');
    }
  };

  const handlePublishConfirm = async () => {
    const finalName = cleanWebsiteName(inputName.trim() || savedWebsite.name);
    setShowNameDialog(false);
    setIsPublishing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const slug = generateSlug(finalName);
      const templateUrl = `https://adiology.io/templates/${slug}`;
      
      console.log('📤 Publishing website:', { id: savedWebsite.id, name: finalName, slug, url: templateUrl, user: user?.email });
      
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateData.seo?.title || templateData.title || finalName}</title>
  <meta name="description" content="${templateData.seo?.description || ''}">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${exportedCss || templateData.rawCss || ''}</style>
</head>
<body>
${exportedHtml || templateData.rawHtml || ''}
</body>
</html>`;

      const response = await fetch('/api/publish-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: savedWebsite.id,
          name: finalName,
          slug: slug,
          user_email: user?.email || 'unknown',
          html_content: fullHtml,
          template_data: templateData,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Publish error:', result);
        throw new Error(result.error || 'Failed to publish');
      }
      
      // Use the final URL from the server (which handles slug uniqueness)
      const finalUrl = result.url || templateUrl;
      
      setCurrentName(finalName);
      setPublishedUrl(finalUrl);
      const updated = updateSavedWebsite(savedWebsite.id, { name: finalName });
      if (updated) {
        onUpdate(updated);
      }
      
      console.log('✅ Website published successfully to:', finalUrl);
      alert(`Website published successfully!\n\nName: ${finalName}\nURL: ${finalUrl}\n\nYour site is now live!`);
    } catch (error: any) {
      console.error('Error publishing website:', error);
      const errorMsg = error?.message || error?.details || 'Unknown error';
      alert('Failed to publish website\n\nError: ' + errorMsg + '\n\nPlease try again or contact support.');
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
            onClick={handleDomainInfoClick}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors"
            title="Domain & DNS Settings"
          >
            <Globe className="w-4 h-4" />
            Connect Domain
          </button>
          <button
            onClick={handlePublishClick}
            disabled={isPublishing}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
          {publishedUrl && (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
              title="View published website"
            >
              <ExternalLink className="w-4 h-4" />
              View Site
            </a>
          )}
        </div>
      </div>
      
      {showNameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {dialogMode === 'save' ? 'Save Website' : dialogMode === 'publish' ? 'Publish Website' : 'Domain & DNS Settings'}
              </h3>
              <button
                onClick={() => setShowNameDialog(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {dialogMode === 'domain' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Your Published URL
                  </h4>
                  <div className="flex items-center gap-2 bg-white rounded-lg p-2 border">
                    <code className="text-sm text-blue-700 flex-1">
                      https://adiology.io/templates/{generateSlug(currentName)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(`https://adiology.io/templates/${generateSlug(currentName)}`)}
                      className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                      title="Copy URL"
                    >
                      {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={`https://adiology.io/templates/${generateSlug(currentName)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Connect Custom Domain</h4>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-amber-800 font-medium mb-2">DNS Configuration Required:</p>
                    <div className="bg-white rounded p-3 font-mono text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-semibold">A Record</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Host:</span>
                        <span className="font-semibold">@ (or your subdomain)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Value:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-purple-700">76.76.21.21</span>
                          <button
                            onClick={() => copyToClipboard('76.76.21.21')}
                            className="p-1 hover:bg-amber-100 rounded"
                            title="Copy IP"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">TTL:</span>
                        <span className="font-semibold">3600 (or Auto)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Your Custom Domain
                    </label>
                    <input
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="e.g., www.yourdomain.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                    />
                    <button
                      onClick={handleVerifyDomain}
                      disabled={!customDomain.trim()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Verify Domain
                    </button>
                    {domainVerified && (
                      <div className="flex items-center gap-2 text-indigo-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Domain verified and connected!
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setShowNameDialog(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                  {dialogMode === 'publish' && (
                    <p className="text-xs text-gray-500 mt-2">
                      Your site will be published to: <span className="font-medium text-purple-600">https://adiology.io/templates/{generateSlug(inputName || currentName)}</span>
                    </p>
                  )}
                  {dialogMode === 'save' && (
                    <p className="text-xs text-gray-500 mt-1">
                      This name will be shown in your saved websites list
                    </p>
                  )}
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
              </>
            )}
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
