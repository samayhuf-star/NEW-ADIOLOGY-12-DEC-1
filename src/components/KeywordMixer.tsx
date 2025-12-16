import React, { useState, useEffect } from 'react';
import { Shuffle, Plus, X, Download, Save, Sparkles, FolderOpen, Trash2, Clock } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { historyService } from '../utils/historyService';
import { notifications } from '../utils/notifications';
import { DEFAULT_MIXER_KEYWORDS } from '../utils/defaultExamples';
import { exportKeywordsToCSV } from '../utils/googleAdsEditorCSVExporter';

// Plumbing service keywords for sample data
const PLUMBING_KEYWORDS = {
    services: [
        'plumber', 'plumbing', 'drain cleaning', 'pipe repair', 'water heater',
        'leak repair', 'sewer repair', 'toilet repair', 'faucet repair', 
        'emergency plumber', 'plumbing service', 'drain service'
    ],
    locations: [
        'near me', 'local', 'emergency', '24 hour', 'same day',
        'residential', 'commercial', 'licensed', 'certified', 'professional'
    ],
    extras: [
        'repair', 'installation', 'replacement', 'maintenance', 'service',
        'fix', 'contractor', 'company', 'specialist', 'expert'
    ]
};

export const KeywordMixer = ({ initialData }: { initialData?: any }) => {
    // Store each list as a string (newline-separated)
    const [listA, setListA] = useState(DEFAULT_MIXER_KEYWORDS.set1);
    const [listB, setListB] = useState(DEFAULT_MIXER_KEYWORDS.set2);
    const [listC, setListC] = useState('');
    const [mixedKeywords, setMixedKeywords] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('mixer');
    const [savedItems, setSavedItems] = useState<any[]>([]);
    
    // Match types - all selected by default
    const [matchTypes, setMatchTypes] = useState({
        broad: true,
        phrase: true,
        exact: true
    });

    useEffect(() => {
        // Bug_45: Scroll to top when component mounts
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        if (initialData) {
            // Convert old array format to newline-separated strings if needed
            if (initialData.lists) {
                setListA(initialData.lists[0]?.join('\n') || '');
                setListB(initialData.lists[1]?.join('\n') || '');
                setListC(initialData.lists[2]?.join('\n') || '');
            }
            // Handle new string format
            if (initialData.listA) setListA(initialData.listA);
            if (initialData.listB) setListB(initialData.listB);
            if (initialData.listC) setListC(initialData.listC);
            
            setMixedKeywords(initialData.mixedKeywords || []);
            setMatchTypes(initialData.matchTypes || { broad: true, phrase: true, exact: true });
        }
    }, [initialData]);

    const fillSampleInfo = () => {
        // Helper to get random items from array (1-2 words max)
        const getRandomItems = (arr: string[], count: number) => {
            const shuffled = [...arr].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, count).filter(item => item.split(' ').length <= 2);
        };

        // Fill each list with random plumbing keywords
        const samplesA = getRandomItems(PLUMBING_KEYWORDS.services, 4);
        const samplesB = getRandomItems(PLUMBING_KEYWORDS.locations, 4);
        const samplesC = getRandomItems(PLUMBING_KEYWORDS.extras, 3);

        setListA(samplesA.join('\n'));
        setListB(samplesB.join('\n'));
        setListC(samplesC.join('\n'));

        notifications.success('Sample plumbing keywords filled!', {
            title: 'Sample Data Loaded'
        });
    };

    const handleSave = async () => {
        if (mixedKeywords.length === 0) return;
        setIsSaving(true);
        try {
            await historyService.save(
                'keyword-mixer',
                `Mixer: ${mixedKeywords.length} Combinations`,
                { listA, listB, listC, mixedKeywords, matchTypes }
            );
            notifications.success('Mixer result saved!', {
                title: 'Saved Successfully'
            });
            // Refresh saved items list
            await loadSavedItems();
        } catch (error) {
            console.error("Save failed", error);
            notifications.error('Failed to save. Please try again.', {
                title: 'Save Failed'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const loadSavedItems = async () => {
        try {
            const items = await historyService.getByType('keyword-mixer');
            items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setSavedItems(items);
        } catch (error) {
            console.error("Load saved items failed", error);
        }
    };

    const handleLoadSavedItem = async (itemId: string) => {
        try {
            const allItems = await historyService.getAll();
            const item = allItems.find(i => i.id === itemId);
            if (item && item.data) {
                setListA(item.data.listA || '');
                setListB(item.data.listB || '');
                setListC(item.data.listC || '');
                setMixedKeywords(item.data.mixedKeywords || []);
                setMatchTypes(item.data.matchTypes || { broad: true, phrase: true, exact: true });
                setActiveTab('mixer');
                notifications.success('Saved item loaded successfully!', {
                    title: 'Loaded'
                });
            }
        } catch (error) {
            console.error("Load failed", error);
            notifications.error('Failed to load item. Please try again.', {
                title: 'Load Failed'
            });
        }
    };

    const handleDeleteSavedItem = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        
        try {
            await historyService.deleteHistory(itemId);
            await loadSavedItems();
            notifications.success('Item deleted successfully!', {
                title: 'Deleted'
            });
        } catch (error) {
            console.error("Delete failed", error);
            notifications.error('Failed to delete item. Please try again.', {
                title: 'Delete Failed'
            });
        }
    };

    useEffect(() => {
        loadSavedItems();
    }, []);

    const mixKeywords = () => {
        // Parse each list - split by newlines and commas, trim, and filter empty
        const parseList = (text: string): string[] => {
            return text
                .split('\n')
                .flatMap(line => line.split(','))
                .map(item => item.trim())
                .filter(item => item !== '');
        };

        const lists = [
            parseList(listA),
            parseList(listB),
            parseList(listC)
        ].filter(list => list.length > 0); // Only include non-empty lists
        
        const mix = (arr: string[][]): string[] => {
            if (arr.length === 0) return [];
            if (arr.length === 1) return arr[0];
            
            const result: string[] = []
            const [first, ...rest] = arr;
            const restMixed = mix(rest);
            
            for (const item of first) {
                if (restMixed.length === 0) {
                    result.push(item);
                } else {
                    for (const mixed of restMixed) {
                        result.push(`${item} ${mixed}`.trim());
                    }
                }
            }
            
            return result;
        };

        const baseMixed = mix(lists);
        
        // Apply match type formatting
        const formattedKeywords: string[] = [];
        baseMixed.forEach(keyword => {
            if (matchTypes.broad) {
                formattedKeywords.push(keyword); // Broad match (no formatting)
            }
            if (matchTypes.phrase) {
                formattedKeywords.push(`"${keyword}"`); // Phrase match
            }
            if (matchTypes.exact) {
                formattedKeywords.push(`[${keyword}]`); // Exact match
            }
        });
        
        setMixedKeywords(formattedKeywords);
    };

    const exportToCSV = async () => {
        try {
            const filename = `keywords_google_ads_editor_${new Date().toISOString().split('T')[0]}.csv`;
            
            const validation = exportKeywordsToCSV(
                mixedKeywords,
                'Keywords Campaign',
                'All Keywords',
                filename
            );
            
            if (validation.warnings && validation.warnings.length > 0) {
                notifications.warning(
                    `Exported with ${validation.warnings.length} warning(s)`,
                    { 
                        title: '⚠️ Export Complete',
                        description: 'Your keywords have been exported, but consider fixing the warnings.'
                    }
                );
            } else {
                notifications.success(`Exported ${mixedKeywords.length} keywords to CSV`, {
                    title: 'Export Complete',
                    description: 'Your CSV file has been downloaded successfully.'
                });
            }
        } catch (error: any) {
            console.error('Export error:', error);
            notifications.error(
                error?.message || 'An unexpected error occurred during export',
                { 
                    title: '❌ Export Failed',
                    description: 'Please try again or contact support if the issue persists.'
                }
            );
        }
    };

    return (
        <div className="p-4 max-w-5xl mx-auto">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
                        Keyword Mixer
                    </h1>
                    <p className="text-sm text-slate-500">
                        Mix and match multiple keyword lists to generate all possible combinations
                    </p>
                </div>
                <button
                    onClick={fillSampleInfo}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    Fill Sample Info
                </button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList>
                    <TabsTrigger value="mixer">Keyword Mixer</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="mixer">
                    <div className="space-y-4">
                {/* Input Section - Horizontal Lists */}
                <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-slate-200/60 shadow-lg">
                    <h2 className="text-lg font-bold text-slate-800 mb-3">Keyword Lists</h2>
                    
                    {/* Lists arranged horizontally */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="space-y-1.5">
                            <h3 className="text-sm font-semibold text-slate-700 mb-1">Keywords A</h3>
                            <Textarea
                                value={listA}
                                onChange={(e) => setListA(e.target.value)}
                                placeholder="Enter keywords for A&#10;One per line or comma-separated"
                                className="min-h-[120px] text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-sm font-semibold text-slate-700 mb-1">Keywords B</h3>
                            <Textarea
                                value={listB}
                                onChange={(e) => setListB(e.target.value)}
                                placeholder="Enter keywords for B&#10;One per line or comma-separated"
                                className="min-h-[120px] text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-sm font-semibold text-slate-700 mb-1">Keywords C</h3>
                            <Textarea
                                value={listC}
                                onChange={(e) => setListC(e.target.value)}
                                placeholder="Enter keywords for C&#10;One per line or comma-separated"
                                className="min-h-[120px] text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                            />
                        </div>
                    </div>
                    
                    {/* Helpful hint */}
                    <div className="mb-4 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                        <p className="text-xs text-indigo-700">
                            💡 <span className="font-semibold">Tip:</span> You can enter comma-separated values in any field (e.g., "delta, united, southwest") to create multiple variations at once.
                        </p>
                    </div>

                    {/* Match Type Selection */}
                    <div className="border-t border-slate-200 pt-4">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Keyword Match Types</h3>
                        <div className="flex items-center gap-4 flex-wrap">
                            <label htmlFor="broad" className="flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 cursor-pointer transition-all duration-200 group">
                                <Checkbox 
                                    id="broad" 
                                    checked={matchTypes.broad}
                                    onCheckedChange={(c: boolean) => setMatchTypes(prev => ({...prev, broad: c as boolean}))}
                                    className="border-amber-400"
                                />
                                <span className="text-xs text-amber-900 cursor-pointer font-semibold group-hover:text-amber-950 transition-colors">
                                    Broad Match
                                </span>
                            </label>
                            <label htmlFor="phrase" className="flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition-all duration-200 group">
                                <Checkbox 
                                    id="phrase" 
                                    checked={matchTypes.phrase}
                                    onCheckedChange={(c: boolean) => setMatchTypes(prev => ({...prev, phrase: c as boolean}))}
                                    className="border-blue-400"
                                />
                                <span className="text-xs text-blue-900 cursor-pointer font-semibold group-hover:text-blue-950 transition-colors">
                                    Phrase Match "keyword"
                                </span>
                            </label>
                            <label htmlFor="exact" className="flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 cursor-pointer transition-all duration-200 group">
                                <Checkbox 
                                    id="exact" 
                                    checked={matchTypes.exact}
                                    onCheckedChange={(c: boolean) => setMatchTypes(prev => ({...prev, exact: c as boolean}))}
                                    className="border-emerald-400"
                                />
                                <span className="text-xs text-emerald-900 cursor-pointer font-semibold group-hover:text-emerald-950 transition-colors">
                                    Exact Match [keyword]
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={mixKeywords}
                        className="w-full mt-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        <Shuffle className="w-4 h-4" />
                        Generate Keywords
                    </button>
                </div>

                {/* Results Section */}
                <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-slate-200/60 shadow-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-slate-800">
                            Generated Keywords {mixedKeywords.length > 0 && `(${mixedKeywords.length})`}
                        </h2>
                        {mixedKeywords.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-3 py-1.5 bg-white border border-slate-200 text-indigo-600 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-50 transition-all flex items-center gap-1.5"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={exportToCSV}
                                    className="px-3 py-1.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Export
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="min-h-[300px] max-h-[500px] overflow-y-auto">
                        {mixedKeywords.length > 0 ? (
                            <div className="space-y-1.5">
                                {mixedKeywords.map((keyword, idx) => (
                                    <div
                                        key={idx}
                                        className="px-3 py-2 bg-slate-50 rounded-lg hover:bg-indigo-50 transition-colors"
                                    >
                                        <span className="text-sm text-slate-700 font-medium">{keyword}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Shuffle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500">
                                        Add keywords and click "Generate Keywords" to create combinations
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-slate-200/60 shadow-lg">
                        <h2 className="text-xl font-bold text-indigo-600 mb-6">
                            Saved Mixes
                        </h2>
                        {savedItems.length > 0 ? (
                            <div className="space-y-4">
                                {savedItems.map(item => (
                                    <div
                                        key={item.id}
                                        className="px-4 py-3 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800">{item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {item.data?.mixedKeywords && (
                                                        <span className="text-slate-600">
                                                            {item.data.mixedKeywords.length} keywords
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleLoadSavedItem(item.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2"
                                                >
                                                    <FolderOpen className="w-4 h-4" />
                                                    Load
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteSavedItem(item.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full py-20">
                                <div className="text-center">
                                    <Shuffle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500">
                                        No saved mixes found. Save your mixed keywords to see them here.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};