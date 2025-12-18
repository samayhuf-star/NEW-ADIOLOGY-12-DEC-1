import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Download, Globe, Type, ShieldAlert, Save, Filter, BarChart3, FileText, CheckCircle2, RefreshCw, FolderOpen, Trash2, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { api } from '../utils/api';
import { historyService } from '../utils/historyService';
import { notifications } from '../utils/notifications';
import { KeywordFilters, KeywordFiltersState, DEFAULT_FILTERS } from './KeywordFilters';
import { TerminalProgressConsole, NEGATIVE_KEYWORDS_MESSAGES } from './TerminalProgressConsole';
import { TerminalResultsConsole, ResultStat } from './TerminalResultsConsole';
import {
    NEGATIVE_KEYWORD_CATEGORIES,
    buildUserPrompt,
    SYSTEM_PROMPT,
    deduplicateKeywords,
    filterProfanity,
    addMisspellings,
    handleBrandNames,
    exportToCSV,
    exportToGoogleAdsEditorCSV,
    getCategoryStats,
    type NegativeKeyword,
    type NegativeKeywordCategory
} from '../utils/negativeKeywordsGenerator';
import { exportNegativeKeywordsToCSV } from '../utils/googleAdsEditorCSVExporter';

interface GeneratedKeyword {
    id: number;
    keyword: string;
    reason: string;
    category: string;
    subcategory?: string;
    matchType?: 'exact' | 'phrase' | 'broad';
}

type NegativeFillPreset = {
    url: string;
    paths: string[];
    coreKeywords: string[];
    userGoal: 'leads' | 'calls' | 'signups' | 'branding' | 'ecommerce' | 'other';
    targetLocation?: string;
    competitorBrands?: string[];
    excludeCompetitors?: boolean;
    keywordCountRange?: [number, number];
};

const NEGATIVE_FILL_INFO_PRESETS: NegativeFillPreset[] = [
    {
        url: 'https://www.fleetguardian.io',
        paths: ['enterprise-demo', 'fleet-audit', 'solutions'],
        coreKeywords: [
            'enterprise fleet tracking',
            'gps telematics platform',
            'dot compliance software',
            'vehicle camera monitoring',
            'driver safety coaching'
        ],
        userGoal: 'leads',
        targetLocation: 'Dallas, TX',
        competitorBrands: ['Fleetio', 'Samsara', 'Verizon Connect'],
        excludeCompetitors: true,
        keywordCountRange: [850, 1100]
    },
    {
        url: 'https://www.horizonplasticsurgery.com',
        paths: ['consult', 'vip', 'sculptra', 'body-contouring'],
        coreKeywords: [
            'tummy tuck specialist',
            'mommy makeover surgeon',
            'body contouring center',
            'board certified plastic surgeon',
            'liposuction revisions'
        ],
        userGoal: 'calls',
        targetLocation: 'Miami, FL',
        competitorBrands: ['Athenique', 'Vivid Body MD'],
        excludeCompetitors: false,
        keywordCountRange: [900, 1050]
    },
    {
        url: 'https://www.atlascyberdefense.com',
        paths: ['zero-trust', 'mssp', 'threat-lab', 'demo'],
        coreKeywords: [
            'managed soc service',
            'zero trust deployment',
            'cloud incident response',
            'b2b cyber security experts',
            'threat hunting retainer'
        ],
        userGoal: 'leads',
        targetLocation: 'Austin, TX',
        competitorBrands: ['Expel', 'CrowdStrike', 'Arctic Wolf'],
        excludeCompetitors: true,
        keywordCountRange: [780, 1000]
    }
];

const pickNegativePreset = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

const randomInt = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const joinKeywords = (keywords: string[]) => {
    if (keywords.length === 0) return '';
    return [...keywords].sort(() => Math.random() - 0.5).join(', ');
};

const buildUrlWithPath = (baseUrl: string, slug: string) => {
    const sanitized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    if (!slug) return sanitized;
    return `${sanitized}/${slug}`;
};

export const NegativeKeywordsBuilder = ({ initialData }: { initialData?: any }) => {
    // Input State
    const [url, setUrl] = useState('');
    const [urlError, setUrlError] = useState('');
    const [coreKeywords, setCoreKeywords] = useState('');
    const [userGoal, setUserGoal] = useState('');
    const [targetLocation, setTargetLocation] = useState('');
    const [competitorBrands, setCompetitorBrands] = useState('');
    const [excludeCompetitors, setExcludeCompetitors] = useState(false);
    const [keywordCount, setKeywordCount] = useState(1000);
    
    // Generation State
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedKeywords, setGeneratedKeywords] = useState<GeneratedKeyword[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('builder');
    const [filters, setFilters] = useState<KeywordFiltersState>(DEFAULT_FILTERS);
    const [showTerminalConsole, setShowTerminalConsole] = useState(false);
    const [terminalComplete, setTerminalComplete] = useState(false);
    const [showResultsConsole, setShowResultsConsole] = useState(false);
    const [savedItems, setSavedItems] = useState<any[]>([]);
    
    // Filter & Export State
    const [selectedCategories, setSelectedCategories] = useState<Set<NegativeKeywordCategory>>(new Set());
    const [exportFormat, setExportFormat] = useState<'exact' | 'phrase' | 'broad' | 'all'>('all');
    const [showStats, setShowStats] = useState(true);

    const handleFillInfo = () => {
        const preset = pickNegativePreset(NEGATIVE_FILL_INFO_PRESETS);
        if (!preset) return;

        const slug = pickNegativePreset(preset.paths) || '';
        setUrl(buildUrlWithPath(preset.url, slug));
        setCoreKeywords(joinKeywords(preset.coreKeywords));
        setUserGoal(preset.userGoal);
        setTargetLocation(preset.targetLocation || '');
        setCompetitorBrands((preset.competitorBrands || []).join(', '));
        setExcludeCompetitors(Boolean(preset.excludeCompetitors));

        if (preset.keywordCountRange) {
            setKeywordCount(randomInt(preset.keywordCountRange[0], preset.keywordCountRange[1]));
        } else {
            setKeywordCount(1000);
        }
        setUrlError('');
    };

    // Load form data from localStorage on mount (Bug_34: Persist form fields)
    useEffect(() => {
        const savedFormData = localStorage.getItem('negative-keywords-form-data');
        if (savedFormData) {
            try {
                const data = JSON.parse(savedFormData);
                setUrl(data.url || '');
                setCoreKeywords(data.coreKeywords || '');
                setUserGoal(data.userGoal || '');
                setTargetLocation(data.targetLocation || '');
                setCompetitorBrands(data.competitorBrands || '');
                setExcludeCompetitors(data.excludeCompetitors || false);
                setKeywordCount(data.keywordCount || 1000);
            } catch (e) {
                console.error('Failed to load saved form data:', e);
            }
        }
        
        if (initialData) {
            setUrl(initialData.url || '');
            setCoreKeywords(initialData.coreKeywords || '');
            setUserGoal(initialData.userGoal || '');
            setGeneratedKeywords(initialData.generatedKeywords || []);
        }
    }, [initialData]);

    // Save form data to localStorage whenever fields change (Bug_34: Persist form fields)
    useEffect(() => {
        const formData = {
            url,
            coreKeywords,
            userGoal,
            targetLocation,
            competitorBrands,
            excludeCompetitors,
            keywordCount
        };
        localStorage.setItem('negative-keywords-form-data', JSON.stringify(formData));
    }, [url, coreKeywords, userGoal, targetLocation, competitorBrands, excludeCompetitors, keywordCount]);

    // URL validation function (Bug_28: Add URL validation)
    const validateUrl = (urlValue: string): boolean => {
        if (!urlValue.trim()) {
            setUrlError('URL is required');
            return false;
        }
        
        try {
            const urlObj = new URL(urlValue);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                setUrlError('URL must start with http:// or https://');
                return false;
            }
            setUrlError('');
            return true;
        } catch (e) {
            setUrlError('Please enter a valid URL (e.g., https://example.com)');
            return false;
        }
    };

    const handleSave = async () => {
        if (generatedKeywords.length === 0) return;
        setIsSaving(true);
        try {
            await historyService.save(
                'negative-keywords',
                `Negatives: ${coreKeywords.substring(0, 20)}...`,
                { url, coreKeywords, userGoal, generatedKeywords }
            );
            // Bug_35: Use toast notification instead of alert
            notifications.success('Negative keywords saved successfully!', {
                title: 'Saved',
                description: 'Your negative keywords have been saved.'
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
            const items = await historyService.getByType('negative-keywords');
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
                setUrl(item.data.url || '');
                setCoreKeywords(item.data.coreKeywords || '');
                setUserGoal(item.data.userGoal || '');
                setGeneratedKeywords(item.data.generatedKeywords || []);
                setActiveTab('builder');
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

    // AI Generation Logic using Gemini
    const handleGenerate = async () => {
        // Bug_28: Validate URL before generation
        if (!validateUrl(url)) {
            return;
        }
        
        // URL is now mandatory
        if (!url.trim() || !coreKeywords.trim() || !userGoal) {
            notifications.warning('Please fill in all required fields including the URL', {
                title: 'Missing Fields'
            });
            return;
        }
        
        setIsGenerating(true);
        setShowTerminalConsole(true);
        setTerminalComplete(false);
        setGeneratedKeywords([]);

        try {
            console.log('Attempting AI negative keyword generation via backend...');
            
            const response = await fetch('/api/ai/generate-negative-keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url,
                    coreKeywords,
                    userGoal,
                    count: keywordCount,
                    excludeCompetitors,
                    competitorBrands: competitorBrands.split(',').map(b => b.trim()).filter(Boolean),
                    targetLocation: targetLocation || undefined
                })
            });

            const data = await response.json();
            
            if (data.keywords && Array.isArray(data.keywords)) {
                console.log('AI generation successful:', data.keywords.length, 'keywords');
                
                let negativeKeywords: NegativeKeyword[] = data.keywords.map((item: any) => ({
                    keyword: (item.keyword || '').trim(),
                    category: (item.category || 'Other') as NegativeKeywordCategory,
                    subcategory: item.subcategory,
                    reason: item.reason || 'AI suggested',
                    matchType: (item.matchType || 'exact') as 'exact' | 'phrase' | 'broad'
                }));

                negativeKeywords = deduplicateKeywords(negativeKeywords);
                negativeKeywords = filterProfanity(negativeKeywords);
                
                if (excludeCompetitors && competitorBrands.trim()) {
                    const brands = competitorBrands.split(',').map(b => b.trim()).filter(Boolean);
                    negativeKeywords = handleBrandNames(negativeKeywords, brands);
                }

                negativeKeywords = addMisspellings(negativeKeywords);

                const formattedKeywords: GeneratedKeyword[] = negativeKeywords.map((item, index) => ({
                    id: index + 1,
                    keyword: `[${item.keyword}]`,
                    reason: item.reason,
                    category: NEGATIVE_KEYWORD_CATEGORIES[item.category]?.label || item.category,
                    subcategory: item.subcategory,
                    matchType: item.matchType
                }));

                setGeneratedKeywords(formattedKeywords);
                notifications.success(`Generated ${formattedKeywords.length} contextual negative keywords`, {
                    title: 'AI Generation Complete'
                });
            } else {
                throw new Error(data.error || 'Invalid response format');
            }
        } catch (error) {
            console.error('AI generation error:', error);
            notifications.error('Failed to generate keywords. Please check your connection and try again.', {
                title: 'Generation Failed'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    // Filter keywords by selected categories
    const filteredKeywords = useMemo(() => {
        if (selectedCategories.size === 0) return generatedKeywords;
        
        return generatedKeywords.filter(kw => {
            // Find category key from label - handle both exact match and normalized match
            const categoryKey = Object.keys(NEGATIVE_KEYWORD_CATEGORIES).find(
                key => {
                    const categoryLabel = NEGATIVE_KEYWORD_CATEGORIES[key as NegativeKeywordCategory].label;
                    // Exact match
                    if (categoryLabel === kw.category) return true;
                    // Normalized match (trim whitespace, case-insensitive)
                    if (categoryLabel.trim().toLowerCase() === kw.category.trim().toLowerCase()) return true;
                    return false;
                }
            ) as NegativeKeywordCategory | undefined;
            
            // If category key found and it's in selected categories, include this keyword
            if (categoryKey && selectedCategories.has(categoryKey)) {
                return true;
            }
            
            return false;
        });
    }, [generatedKeywords, selectedCategories]);

    // Get category statistics
    const categoryStats = useMemo(() => {
        if (generatedKeywords.length === 0) return {};
        
        const stats: Record<string, number> = {};
        generatedKeywords.forEach(kw => {
            stats[kw.category] = (stats[kw.category] || 0) + 1;
        });
        return stats;
    }, [generatedKeywords]);

    const handleDownload = async (format: 'standard' | 'google-ads-editor' = 'standard') => {
        if (filteredKeywords.length === 0) {
            notifications.warning('No keywords to export', {
                title: 'No Keywords'
            });
            return;
        }

        // Convert GeneratedKeyword back to NegativeKeyword format
        const negativeKeywords: NegativeKeyword[] = filteredKeywords.map(kw => {
            const cleanKeyword = kw.keyword.replace(/[\[\]"]/g, '');
            const categoryKey = Object.keys(NEGATIVE_KEYWORD_CATEGORIES).find(
                key => NEGATIVE_KEYWORD_CATEGORIES[key as NegativeKeywordCategory].label === kw.category
            ) as NegativeKeywordCategory;
            
            return {
                keyword: cleanKeyword,
                category: categoryKey || 'Other',
                subcategory: kw.subcategory,
                reason: kw.reason,
                matchType: kw.matchType || 'exact'
            };
        });

        let filename: string;

        try {
            if (format === 'google-ads-editor') {
                // Use new Google Ads Editor format
                filename = `negative_keywords_google_ads_editor_${new Date().toISOString().split('T')[0]}.csv`;
                
                const validation = exportNegativeKeywordsToCSV(
                    negativeKeywords,
                    'Negative Keywords Campaign',
                    'All Ad Groups',
                    filename
                );
                
                if (validation.warnings && validation.warnings.length > 0) {
                    const warningMessage = validation.warnings.slice(0, 5).join('\n') + 
                      (validation.warnings.length > 5 ? `\n... and ${validation.warnings.length - 5} more warnings` : '');
                    notifications.warning(
                        warningMessage,
                        { 
                            title: '⚠️  CSV Validation Warnings',
                            description: 'Your campaign will export, but consider fixing these warnings.',
                            duration: 10000
                        }
                    );
                } else {
                    notifications.success('Negative keywords exported successfully!', {
                        title: 'Export Complete',
                        description: `Exported ${negativeKeywords.length} negative keyword(s) to CSV.`
                    });
                }
            } else {
                // For other formats, use legacy export functions from negativeKeywordsGenerator
                let csvContent: string;
                csvContent = exportToCSV(negativeKeywords, exportFormat);
                filename = `negative_keywords_${exportFormat}_${new Date().toISOString().split('T')[0]}.csv`;
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                if (link.download !== undefined) {
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", filename);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }
                
                notifications.success('Negative keywords exported successfully!', {
                    title: 'Export Complete'
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
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">Negative Keywords</h1>
                    <p className="text-xs text-slate-500">AI-powered negative keyword generation to protect your ad spend</p>
                </div>
                <button
                    onClick={handleFillInfo}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                >
                    <RefreshCw className="w-3 h-3" />
                    Sample
                </button>
            </div>

            {/* Shell View - Two Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Card 1: Stats */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs text-slate-400 ml-2 font-mono">negative_stats.sh</span>
                    </div>
                    <div className="p-4 font-mono">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1 text-center">
                                <div className="text-2xl font-bold text-violet-400">{generatedKeywords.length}</div>
                                <div className="text-xs text-slate-400">Generated</div>
                            </div>
                            <div className="space-y-1 text-center">
                                <div className="text-2xl font-bold text-emerald-400">AI</div>
                                <div className="text-xs text-slate-400">Engine</div>
                            </div>
                            <div className="space-y-1 text-center">
                                <div className="text-2xl font-bold text-amber-400">EXACT</div>
                                <div className="text-xs text-slate-400">Match</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Config */}
                <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs text-slate-400 ml-2 font-mono">negative_config.sh</span>
                    </div>
                    <div className="p-4 font-mono space-y-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-500">url:</span>
                            <span className="text-cyan-400 max-w-[180px] truncate">{url || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-500">goal:</span>
                            <span className="text-pink-400">{userGoal || '—'}</span>
                            <span className="text-slate-600 mx-1">|</span>
                            <span className="text-slate-500">core:</span>
                            <span className="text-blue-400">{coreKeywords.split(',').filter(k => k.trim()).length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500">country:</span>
                            <span className="text-orange-400">{filters.country}</span>
                            <span className="text-slate-600 mx-1">|</span>
                            <span className="text-slate-500">categories:</span>
                            <span className="text-emerald-400">18+</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Filters */}
            <div className="mb-4 flex items-center gap-3">
                <KeywordFilters filters={filters} onFiltersChange={setFilters} compact={true} />
            </div>

            {/* Inline Generation Progress */}
            {showTerminalConsole && (
                <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden mb-4">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">generating_negatives.sh</span>
                        </div>
                        {terminalComplete && (
                            <button
                                onClick={() => {
                                    setShowTerminalConsole(false);
                                    setIsGenerating(false);
                                    setShowResultsConsole(true);
                                }}
                                className="text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                            >
                                View Results →
                            </button>
                        )}
                    </div>
                    <div className="p-4 font-mono text-sm space-y-1 max-h-48 overflow-y-auto">
                        <p className="text-green-400">✓ AI engine initialized</p>
                        <p className="text-slate-400">&gt; Analyzing target URL...</p>
                        <p className="text-green-400">✓ Website content extracted</p>
                        <p className="text-slate-400">&gt; Processing core keywords...</p>
                        <p className="text-green-400">✓ Industry identified: {url ? 'detected' : 'pending'}</p>
                        <p className="text-slate-400">&gt; Generating negative keywords...</p>
                        {!terminalComplete ? (
                            <p className="text-cyan-400 animate-pulse">&gt; Processing with AI...</p>
                        ) : (
                            <p className="text-emerald-400">✓ Complete! {generatedKeywords.length} negatives ready</p>
                        )}
                    </div>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList>
                    <TabsTrigger value="builder">Negative Keywords Builder</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="builder">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Inputs */}
                <Card className="lg:col-span-1 border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-xl h-fit">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldAlert className="h-5 w-5 text-indigo-600" />
                                </CardTitle>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleFillInfo}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Fill Info
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Globe className="h-4 w-4 text-slate-400" />
                                Target URL <span className="text-red-500">*</span>
                            </label>
                            <Input 
                                placeholder="https://example.com/landing-page" 
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    if (urlError) {
                                        validateUrl(e.target.value);
                                    }
                                }}
                                onBlur={(e) => validateUrl(e.target.value)}
                                className={`bg-white/80 ${urlError ? 'border-red-500' : ''}`}
                                required
                            />
                            {urlError && (
                                <p className="text-xs text-red-500 mt-1">
                                    {urlError}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Type className="h-4 w-4 text-slate-400" />
                                Core Keywords <span className="text-red-500">*</span>
                            </label>
                            <Textarea 
                                placeholder="e.g. plumbing services, emergency plumber, drain cleaning" 
                                value={coreKeywords}
                                onChange={(e) => setCoreKeywords(e.target.value)}
                                className="bg-white/80 min-h-[100px]"
                            />
                            <p className="text-xs text-slate-500">Enter the main keywords you are targeting.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-slate-400" />
                                User Desire / Goal <span className="text-red-500">*</span>
                            </label>
                            <Select value={userGoal} onValueChange={setUserGoal}>
                                <SelectTrigger className="bg-white/80">
                                    <SelectValue placeholder="Select primary goal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="leads">Leads (High-Intent)</SelectItem>
                                    <SelectItem value="calls">Calls / Appointments</SelectItem>
                                    <SelectItem value="signups">Signups / Trials</SelectItem>
                                    <SelectItem value="branding">Branding / Awareness</SelectItem>
                                    <SelectItem value="ecommerce">E-commerce (Transactional)</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                            size="lg"
                            onClick={handleGenerate}
                            disabled={isGenerating || !url || !coreKeywords || !userGoal}
                        >
                            {isGenerating ? (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                                    Analyzing Website...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Negatives
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Right Panel: Results */}
                <Card className="lg:col-span-2 border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-xl min-h-[600px] flex flex-col">
                    {/* Terminal Results Console */}
                    {showResultsConsole && generatedKeywords.length > 0 && (
                        <div className="p-4">
                            <TerminalResultsConsole
                                title="Negative Keywords Export Console"
                                isVisible={showResultsConsole}
                                stats={[
                                    { label: 'Negative Keywords', value: generatedKeywords.length, color: 'green' },
                                    { label: 'Categories', value: Object.keys(getCategoryStats(generatedKeywords as any)).length, color: 'cyan' },
                                    { label: 'Match Type', value: 'Exact', color: 'yellow' },
                                    { label: 'Target URL', value: url.substring(0, 30) + (url.length > 30 ? '...' : ''), color: 'purple' },
                                ]}
                                onDownloadCSV={() => handleDownload('google-ads-editor')}
                                onSave={handleSave}
                                onGenerateAnother={() => {
                                    setShowResultsConsole(false);
                                    setGeneratedKeywords([]);
                                }}
                                showDownload={true}
                                showSave={true}
                                showCopy={false}
                                downloadButtonText="Download for Google Ads"
                                saveButtonText="Save to History"
                                isSaving={isSaving}
                            />
                        </div>
                    )}

                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle>Generated Keywords</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            {generatedKeywords.length > 0 && (
                                <>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setShowStats(!showStats)}
                                        className="gap-2"
                                    >
                                        <BarChart3 className="h-4 w-4" />
                                        Stats
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Formats</SelectItem>
                                            <SelectItem value="exact">Exact Only</SelectItem>
                                            <SelectItem value="phrase">Phrase Only</SelectItem>
                                            <SelectItem value="broad">Broad Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" onClick={() => handleDownload('standard')} className="gap-2">
                                        <Download className="h-4 w-4" />
                                        CSV
                                    </Button>
                                    <Button variant="outline" onClick={() => handleDownload('google-ads-editor')} className="gap-2">
                                        <FileText className="h-4 w-4" />
                                        Google Ads
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardHeader>
                    
                    {/* Stats & Filters */}
                    {generatedKeywords.length > 0 && (
                        <div className="px-6 py-3 bg-slate-50/50 border-y border-slate-100 space-y-3">
                            {showStats && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                                    {Object.entries(categoryStats).map(([category, count]) => (
                                        <div key={category} className="bg-white rounded-lg p-2 border border-slate-200">
                                            <div className="text-xs text-slate-500">{category}</div>
                                            <div className="text-lg font-semibold text-slate-800">{count}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <CardContent className="p-0 flex-1">
                        {filteredKeywords.length > 0 ? (
                            <div className="max-h-[600px] overflow-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="w-[30%]">Negative Keyword</TableHead>
                                            <TableHead className="w-[15%]">Match Type</TableHead>
                                            <TableHead className="w-[35%]">Reason</TableHead>
                                            <TableHead className="w-[20%]">Category</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredKeywords.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-slate-50/50">
                                                <TableCell className="font-medium text-slate-700 font-mono text-sm">
                                                    {item.keyword}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                        {(item.matchType || 'exact').charAt(0).toUpperCase() + (item.matchType || 'exact').slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm">{item.reason}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <Badge variant="secondary" className="font-normal text-slate-500 bg-slate-100 hover:bg-slate-200 w-fit">
                                                            {item.category}
                                                        </Badge>
                                                        {item.subcategory && (
                                                            <span className="text-xs text-slate-400">{item.subcategory}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : generatedKeywords.length > 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
                                <Filter className="h-12 w-12 text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-800">No Keywords Match Filters</h3>
                                <p className="text-slate-500 max-w-md mt-2">
                                    Try adjusting your category filters to see more results.
                                </p>
                                <Button variant="outline" onClick={() => setSelectedCategories(new Set())} className="mt-4">
                                    Clear All Filters
                                </Button>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-60 min-h-[400px]">
                                <div className="bg-slate-100 rounded-full p-6 mb-4">
                                    <Sparkles className="h-10 w-10 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">Ready to Generate</h3>
                                <p className="text-slate-500 max-w-md mt-2">
                                    Fill out the configuration including your website URL. AI will analyze your website to understand your business and generate a comprehensive list of negative keywords.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                    </div>
                </TabsContent>

                <TabsContent value="history">
                    <Card className="border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-indigo-600" />
                                Saved Negative Keyword Lists
                            </CardTitle>
                            <CardDescription>
                                View, load, or delete your saved negative keyword lists
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                                        {item.data?.coreKeywords && (
                                                            <span className="text-slate-600">
                                                                {item.data.coreKeywords.substring(0, 30)}...
                                                            </span>
                                                        )}
                                                        {item.data?.generatedKeywords && (
                                                            <span className="text-slate-600">
                                                                {item.data.generatedKeywords.length} keywords
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
                                        <Filter className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500">
                                            No saved negative keyword lists found. Save your generated keywords to see them here.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};