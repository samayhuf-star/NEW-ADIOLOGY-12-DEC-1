import { useState, useEffect } from 'react';
import { Sparkles, Download, Save, Trash2, Loader2, Plus, X, History, Search, Globe, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { notifications } from '../utils/notifications';
import { supabase } from '../utils/supabase/client';

interface KeywordResult {
  keyword: string;
  source: 'autocomplete' | 'ai';
  searchVolume?: string;
  competition?: string;
}

interface SavedList {
  id: string;
  name: string;
  keywords: string[];
  seedKeywords: string;
  url: string;
  createdAt: string;
  userId: string;
}

export function LongTailKeywords() {
  const [activeSubTab, setActiveSubTab] = useState('generate');
  const [url, setUrl] = useState('');
  const [seedKeywords, setSeedKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [listName, setListName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeSubTab === 'saved') {
      loadSavedLists();
    }
  }, [activeSubTab]);

  const loadSavedLists = async () => {
    setIsLoadingLists(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSavedLists([]);
        return;
      }

      const response = await fetch(`/api/long-tail-keywords/lists?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setSavedLists(data.lists || []);
      }
    } catch (error) {
      console.error('Error loading saved lists:', error);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const generateKeywords = async () => {
    if (!seedKeywords.trim()) {
      notifications.warning('Please enter at least one seed keyword');
      return;
    }

    setIsGenerating(true);
    setKeywords([]);
    setSelectedKeywords(new Set());

    try {
      const response = await fetch('/api/long-tail-keywords/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          seedKeywords: seedKeywords.split('\n').map(k => k.trim()).filter(Boolean)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate keywords');
      }

      const data = await response.json();
      setKeywords(data.keywords || []);
      
      if (data.keywords?.length > 0) {
        notifications.success(`Generated ${data.keywords.length} long-tail keywords`);
      } else {
        notifications.info('No keywords generated. Try different seed keywords.');
      }
    } catch (error: any) {
      console.error('Error generating keywords:', error);
      notifications.error(error.message || 'Failed to generate keywords');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleKeyword = (keyword: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);
  };

  const selectAll = () => {
    setSelectedKeywords(new Set(keywords.map(k => k.keyword)));
  };

  const deselectAll = () => {
    setSelectedKeywords(new Set());
  };

  const saveList = async () => {
    if (!listName.trim()) {
      notifications.warning('Please enter a name for this list');
      return;
    }

    const keywordsToSave = selectedKeywords.size > 0 
      ? Array.from(selectedKeywords)
      : keywords.map(k => k.keyword);

    if (keywordsToSave.length === 0) {
      notifications.warning('No keywords to save');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        notifications.error('Please log in to save lists');
        return;
      }

      const response = await fetch('/api/long-tail-keywords/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: listName.trim(),
          keywords: keywordsToSave,
          seedKeywords: seedKeywords,
          url: url
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save list');
      }

      notifications.success('Keyword list saved successfully');
      setListName('');
      loadSavedLists();
    } catch (error: any) {
      console.error('Error saving list:', error);
      notifications.error(error.message || 'Failed to save list');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteList = async (listId: string) => {
    try {
      const response = await fetch(`/api/long-tail-keywords/lists/${listId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete list');
      }

      notifications.success('List deleted');
      setSavedLists(prev => prev.filter(l => l.id !== listId));
    } catch (error: any) {
      console.error('Error deleting list:', error);
      notifications.error(error.message || 'Failed to delete list');
    }
  };

  const exportCSV = (keywordsToExport: string[], filename?: string) => {
    if (keywordsToExport.length === 0) {
      notifications.warning('No keywords to export');
      return;
    }

    const csvContent = 'Keyword\n' + keywordsToExport.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || `long-tail-keywords-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    notifications.success(`Exported ${keywordsToExport.length} keywords`);
  };

  const copyKeyword = (keyword: string, index: number) => {
    navigator.clipboard.writeText(keyword);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllKeywords = () => {
    const keywordsToCopy = selectedKeywords.size > 0 
      ? Array.from(selectedKeywords)
      : keywords.map(k => k.keyword);
    
    navigator.clipboard.writeText(keywordsToCopy.join('\n'));
    notifications.success(`Copied ${keywordsToCopy.length} keywords to clipboard`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          Long Tail Keywords
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate long-tail keyword variations using autocomplete suggestions and AI
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            Saved Lists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Input</CardTitle>
              <CardDescription>
                Enter a URL (optional) and seed keywords to generate long-tail variations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Website URL (optional)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Provide a URL to get context-aware keyword suggestions
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Seed Keywords <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={seedKeywords}
                  onChange={(e) => setSeedKeywords(e.target.value)}
                  placeholder="Enter one keyword per line, e.g.:&#10;plumber&#10;emergency plumbing&#10;drain cleaning"
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter one keyword per line. These will be expanded into long-tail variations.
                </p>
              </div>

              <Button 
                onClick={generateKeywords} 
                disabled={isGenerating || !seedKeywords.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Keywords...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Long Tail Keywords
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {keywords.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Generated Keywords ({keywords.length})
                    </CardTitle>
                    <CardDescription>
                      {selectedKeywords.size > 0 
                        ? `${selectedKeywords.size} keywords selected`
                        : 'Click keywords to select them for saving/export'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto p-2 border rounded-lg bg-muted/30">
                  {keywords.map((kw, index) => (
                    <div
                      key={index}
                      className={`group flex items-center gap-1 px-3 py-1.5 rounded-full text-sm cursor-pointer transition-all ${
                        selectedKeywords.has(kw.keyword)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border hover:border-primary'
                      }`}
                      onClick={() => toggleKeyword(kw.keyword)}
                    >
                      <span>{kw.keyword}</span>
                      {kw.source === 'ai' && (
                        <Sparkles className="w-3 h-3 text-purple-400" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyKeyword(kw.keyword, index);
                        }}
                        className="opacity-0 group-hover:opacity-100 ml-1"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                  <div className="flex-1 min-w-[200px]">
                    <Input
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      placeholder="Enter list name to save..."
                    />
                  </div>
                  <Button onClick={saveList} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save List
                  </Button>
                  <Button variant="outline" onClick={copyAllKeywords}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => exportCSV(
                      selectedKeywords.size > 0 
                        ? Array.from(selectedKeywords)
                        : keywords.map(k => k.keyword)
                    )}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Saved Lists</h2>
            <Button variant="outline" size="sm" onClick={loadSavedLists} disabled={isLoadingLists}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingLists ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {isLoadingLists ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : savedLists.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No saved lists yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate some long-tail keywords and save them to a list
                </p>
                <Button variant="outline" onClick={() => setActiveSubTab('generate')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Keywords
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {savedLists.map((list) => (
                <Card key={list.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{list.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {list.keywords.length} keywords | Created {new Date(list.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => exportCSV(list.keywords, `${list.name}.csv`)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(list.keywords.join('\n'));
                            notifications.success('Keywords copied to clipboard');
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteList(list.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                      {list.keywords.slice(0, 20).map((keyword, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {list.keywords.length > 20 && (
                        <Badge variant="outline" className="text-xs">
                          +{list.keywords.length - 20} more
                        </Badge>
                      )}
                    </div>
                    {list.seedKeywords && (
                      <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                        <span className="font-medium">Seeds:</span> {list.seedKeywords.split('\n').slice(0, 3).join(', ')}
                        {list.seedKeywords.split('\n').length > 3 && '...'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
