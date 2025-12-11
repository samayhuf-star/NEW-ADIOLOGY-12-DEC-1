import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Save, AlertCircle, Download, FolderOpen, Trash2, FileDown, ArrowRight, Lightbulb, Plus, Link, TrendingUp, DollarSign, BarChart3, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { generateKeywords as generateKeywordsFromGoogleAds } from '../utils/api/googleAds';
import { getKeywordIdeas, getKeywordMetrics, KeywordMetrics } from '../utils/keywordPlannerApi';
import { historyService } from '../utils/historyService';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { copyToClipboard } from '../utils/clipboard';
import { notifications } from '../utils/notifications';
import { DEFAULT_SEED_KEYWORDS, DEFAULT_NEGATIVE_KEYWORDS as DEFAULT_NEG_KW } from '../utils/defaultExamples';
import { generateSeedKeywordSuggestions } from '../utils/seedKeywordSuggestions';

interface SavedList {
    id: string;
    name: string;
    seedKeywords: string;
    negativeKeywords: string;
    generatedKeywords: string[];
    matchTypes: { broad: boolean; phrase: boolean; exact: boolean };
    createdAt: string;
}

// Default negative keywords list
const DEFAULT_NEGATIVE_KEYWORDS = [
    'cheap',
    'discount',
    'reviews',
    'job',
    'headquater',
    'apply',
    'free',
    'best',
    'company',
    'information',
    'when',
    'why',
    'where',
    'how',
    'career',
    'hiring',
    'scam',
    'feedback'
].join('\n');

type KeywordPlannerFillPreset = {
    seeds: string[];
    negatives: string[];
    matchTypes?: {
        broad: boolean;
        phrase: boolean;
        exact: boolean;
    };
};

const KEYWORD_PLANNER_FILL_INFO: KeywordPlannerFillPreset[] = [
    {
        seeds: [
            'airline cancellation help',
            'flight credit assistance',
            'speak to airline agent',
            '24/7 airline hotline',
            'upgrade my flight'
        ],
        negatives: ['jobs', 'salary', 'complaint', 'cheap', 'diy', 'review', 'reddit', 'wiki', 'map'],
        matchTypes: { broad: true, phrase: true, exact: true }
    },
    {
        seeds: [
            'emergency plumber',
            'water heater repair',
            'slab leak detection',
            'licensed plumbing company',
            'same day plumber'
        ],
        negatives: ['training', 'course', 'manual', 'parts', 'supplies', 'job', 'free', 'discount', 'review'],
        matchTypes: { broad: true, phrase: false, exact: true }
    },
    {
        seeds: [
            'b2b saas security',
            'zero trust platform',
            'managed soc service',
            'cloud compliance audit',
            'endpoint hardening'
        ],
        negatives: ['open source', 'github', 'template', 'internship', 'career', 'cheap', 'free download', 'wikipedia'],
        matchTypes: { broad: false, phrase: true, exact: true }
    }
];

const pickRandomPreset = <T,>(items: T[]): T => {
    return items[Math.floor(Math.random() * items.length)];
};

const formatSeeds = (seeds: string[]) => {
    if (seeds.length === 0) return '';
    const shuffled = [...seeds].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(5, shuffled.length)).join(', ');
};

const formatNegatives = (negatives: string[]) => {
    if (negatives.length === 0) return '';
    const shuffled = [...negatives].sort(() => Math.random() - 0.5);
    const count = Math.min(15, shuffled.length);
    return shuffled.slice(0, count).join('\n');
};

function normalizeListInput(value: string): string[] {
    if (!value) {
        return [];
    }
    return value
        .split(/[\n\r,]+/)
        .map(entry => entry.trim())
        .filter(Boolean);
}

interface EnrichedKeyword {
    text: string;
    matchType: 'broad' | 'phrase' | 'exact';
    metrics?: KeywordMetrics;
}

export const KeywordPlanner = ({ initialData }: { initialData?: any }) => {
    const [seedKeywords, setSeedKeywords] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
    const [negativeKeywords, setNegativeKeywords] = useState(DEFAULT_NEGATIVE_KEYWORDS);
    const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([]);
    const [enrichedKeywords, setEnrichedKeywords] = useState<EnrichedKeyword[]>([]);
    const [keywordMetricsMap, setKeywordMetricsMap] = useState<Map<string, KeywordMetrics>>(new Map());
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingSeedFromUrl, setIsGeneratingSeedFromUrl] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [apiStatus, setApiStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
    const [dataSource, setDataSource] = useState<'google_ads_api' | 'fallback' | 'local'>('local');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [listName, setListName] = useState('');
    const [savedLists, setSavedLists] = useState<SavedList[]>([]);
    const [activeTab, setActiveTab] = useState('planner');
    const [googleAdsCustomerId, setGoogleAdsCustomerId] = useState<string | null>(null);
    const [showMetrics, setShowMetrics] = useState(true);
    
    // Match types - all selected by default
    const [matchTypes, setMatchTypes] = useState({
        broad: true,
        phrase: true,
        exact: true
    });

    // Fetch Google Ads customer ID on mount
    useEffect(() => {
        const fetchGoogleAdsAccount = async () => {
            try {
                const response = await fetch('/api/google-ads/accounts');
                if (response.ok) {
                    const data = await response.json();
                    if (data.accounts && data.accounts.length > 0) {
                        setGoogleAdsCustomerId(data.accounts[0]);
                    }
                }
            } catch (error) {
                console.log('Google Ads accounts not available');
            }
        };
        fetchGoogleAdsAccount();
    }, []);

    const handleFillInfo = () => {
        const preset = pickRandomPreset(KEYWORD_PLANNER_FILL_INFO);
        if (!preset) return;

        setSeedKeywords(formatSeeds(preset.seeds));
        setNegativeKeywords(formatNegatives(preset.negatives));
        setMatchTypes(preset.matchTypes || { broad: true, phrase: true, exact: true });
    };

    const applySuggestedKeyword = (keyword: string) => {
        const current = seedKeywords.trim();
        const newKeywords = current ? `${current}, ${keyword}` : keyword;
        setSeedKeywords(newKeywords);
        notifications.success(`Added "${keyword}" to seed keywords`, {
            title: 'Keyword Added'
        });
    };

    useEffect(() => {
        if (initialData) {
            const seeds = initialData.seedKeywords;
            if (Array.isArray(seeds)) {
                setSeedKeywords(seeds.join(', '));
            } else if (typeof seeds === 'string') {
                setSeedKeywords(seeds);
            } else {
                setSeedKeywords('');
            }
            const negatives = initialData.negativeKeywords;
            if (Array.isArray(negatives)) {
                setNegativeKeywords(negatives.join('\n'));
            } else if (typeof negatives === 'string') {
                setNegativeKeywords(negatives);
            } else {
                setNegativeKeywords(DEFAULT_NEGATIVE_KEYWORDS);
            }
            setGeneratedKeywords(initialData.generatedKeywords || []);
            setMatchTypes(initialData.matchTypes || { broad: true, phrase: true, exact: true });

            // Auto-generate seed keyword suggestions if no seeds provided
            if (!seeds || (Array.isArray(seeds) && seeds.length === 0) || (typeof seeds === 'string' && !seeds.trim())) {
                const suggestions = generateSeedKeywordSuggestions(
                    initialData.urlAnalysis,
                    initialData.intent,
                    initialData.campaignStructure,
                    initialData.url
                );
                setSuggestedKeywords(suggestions);
                
                if (suggestions.length > 0) {
                    notifications.success(`${suggestions.length} keyword suggestions generated from your URL!`, {
                        title: 'Keywords Ready',
                        description: 'Click any suggestion to add it to your seed keywords'
                    });
                }
            }
        }
    }, [initialData]);

    // Generate seed keywords from URL using Keyword Planner API
    const handleGenerateSeedsFromUrl = async () => {
        if (!urlInput.trim()) {
            notifications.warning('Please enter a URL', { title: 'URL Required' });
            return;
        }

        setIsGeneratingSeedFromUrl(true);
        try {
            const response = await getKeywordIdeas({
                url: urlInput.trim(),
                targetCountry: 'US',
                customerId: googleAdsCustomerId || undefined,
            });

            if (response.success && response.keywords.length > 0) {
                // Extract top keyword suggestions as seeds
                const topKeywords = response.keywords.slice(0, 10).map(k => k.keyword);
                const currentSeeds = seedKeywords.trim();
                const newSeeds = currentSeeds 
                    ? `${currentSeeds}, ${topKeywords.join(', ')}` 
                    : topKeywords.join(', ');
                setSeedKeywords(newSeeds);
                setDataSource(response.source as any);
                notifications.success(`Added ${topKeywords.length} seed keywords from URL`, {
                    title: 'Seeds Generated',
                    description: `Source: ${response.source === 'google_ads_api' ? 'Google Ads API' : 'Estimated Data'}`
                });
            } else {
                notifications.warning('Could not extract keywords from URL. Try adding seed keywords manually.', {
                    title: 'No Keywords Found'
                });
            }
        } catch (error) {
            console.error('URL seed generation error:', error);
            notifications.error('Failed to generate seeds from URL', { title: 'Error' });
        } finally {
            setIsGeneratingSeedFromUrl(false);
        }
    };

    const handleGenerate = async (isAppend: boolean = false) => {
        const seedKeywordsStr = typeof seedKeywords === 'string' ? seedKeywords : '';
        if (!seedKeywordsStr.trim()) {
            notifications.warning('Please enter seed keywords', {
                title: 'Seed Keywords Required'
            });
            return;
        }

        const seedKeywordsArray = seedKeywordsStr.split(',').map(k => k.trim()).filter(Boolean);
        const MIN_KEYWORD_LENGTH = 3;
        const invalidKeywords = seedKeywordsArray.filter(k => k.length < MIN_KEYWORD_LENGTH);
        
        if (invalidKeywords.length > 0) {
            notifications.error(
                `Each keyword must be at least ${MIN_KEYWORD_LENGTH} characters long. Please check: ${invalidKeywords.slice(0, 3).join(', ')}${invalidKeywords.length > 3 ? '...' : ''}`,
                { 
                    title: 'Invalid Keywords',
                    description: `Keywords must be at least ${MIN_KEYWORD_LENGTH} characters long.`
                }
            );
            return;
        }

        const normalizedNegativeKeywords = normalizeListInput(negativeKeywords);

        setIsGenerating(true);

        try {
            console.log('[Keyword Planner] Calling API with:', { seeds: seedKeywordsArray });
            
            // Use the new Keyword Planner API for ideas and metrics
            const ideasResponse = await getKeywordIdeas({
                seedKeywords: seedKeywordsArray,
                targetCountry: 'US',
                customerId: googleAdsCustomerId || undefined,
            });

            console.log('[Keyword Planner] Ideas Response:', ideasResponse);

            if (ideasResponse.success && ideasResponse.keywords.length > 0) {
                setDataSource(ideasResponse.source as any);
                
                // Filter out negative keywords
                const filteredKeywords = ideasResponse.keywords.filter(k => 
                    !normalizedNegativeKeywords.some(neg => 
                        k.keyword.toLowerCase().includes(neg.toLowerCase())
                    )
                );

                // Build metrics map
                const metricsMap = new Map<string, KeywordMetrics>();
                filteredKeywords.forEach(k => {
                    metricsMap.set(k.keyword.toLowerCase(), k);
                });
                setKeywordMetricsMap(metricsMap);

                // Apply match type formatting and create enriched keywords
                const formattedKeywords: string[] = [];
                const enriched: EnrichedKeyword[] = [];
                
                filteredKeywords.forEach((kw) => {
                    if (matchTypes.broad) {
                        formattedKeywords.push(kw.keyword);
                        enriched.push({ text: kw.keyword, matchType: 'broad', metrics: kw });
                    }
                    if (matchTypes.phrase) {
                        formattedKeywords.push(`"${kw.keyword}"`);
                        enriched.push({ text: `"${kw.keyword}"`, matchType: 'phrase', metrics: kw });
                    }
                    if (matchTypes.exact) {
                        formattedKeywords.push(`[${kw.keyword}]`);
                        enriched.push({ text: `[${kw.keyword}]`, matchType: 'exact', metrics: kw });
                    }
                });

                if (isAppend) {
                    setGeneratedKeywords(prev => [...prev, ...formattedKeywords]);
                    setEnrichedKeywords(prev => [...prev, ...enriched]);
                } else {
                    setGeneratedKeywords(formattedKeywords);
                    setEnrichedKeywords(enriched);
                }
                setApiStatus('ok');

                const sourceLabel = ideasResponse.source === 'google_ads_api' ? 'Google Ads API' : 'Estimated Data';
                notifications.success(`Generated ${formattedKeywords.length} keywords with metrics`, {
                    title: 'Keywords Generated',
                    description: `Source: ${sourceLabel}`
                });
            } else {
                // Fallback to old method
                throw new Error('No keywords returned from API');
            }
        } catch (error: any) {
            console.log('[Keyword Planner] API unavailable - using local fallback');
            setDataSource('local');
            
            // FALLBACK: Generate quality keywords locally
            const seeds = seedKeywords.split(',').map(s => s.trim()).filter(Boolean);
            const negatives = normalizedNegativeKeywords.map(n => n.toLowerCase());
            
            const mockKeywords: string[] = [];
            
            const preModifiers = [
                'best', 'top', 'professional', 'reliable', 'trusted', 'local',
                'affordable', 'certified', 'licensed', '24/7', 'emergency', 'same day'
            ];
            
            const postModifiers = [
                'near me', 'services', 'company', 'companies', 'contractor',
                'specialist', 'expert', 'repair', 'cost', 'prices', 'quote'
            ];
            
            const questionTemplates = [
                'how much does {seed} cost',
                '{seed} pricing guide',
                'where to get {seed}',
                '{seed} options near me',
                'compare {seed} prices'
            ];
            
            seeds.forEach(seed => {
                if (seed.split(' ').length >= 2 && !negatives.some(neg => seed.toLowerCase().includes(neg))) {
                    mockKeywords.push(seed);
                }
                
                preModifiers.forEach(modifier => {
                    const combined = `${modifier} ${seed}`;
                    if (!negatives.some(neg => combined.toLowerCase().includes(neg))) {
                        mockKeywords.push(combined);
                    }
                });
                
                postModifiers.forEach(modifier => {
                    const combined = `${seed} ${modifier}`;
                    if (!negatives.some(neg => combined.toLowerCase().includes(neg))) {
                        mockKeywords.push(combined);
                    }
                });
                
                questionTemplates.forEach(template => {
                    const combined = template.replace('{seed}', seed);
                    if (!negatives.some(neg => combined.toLowerCase().includes(neg))) {
                        mockKeywords.push(combined);
                    }
                });
            });
            
            const formattedKeywords: string[] = [];
            const enriched: EnrichedKeyword[] = [];
            
            mockKeywords.forEach((keyword: string) => {
                if (matchTypes.broad) {
                    formattedKeywords.push(keyword);
                    enriched.push({ text: keyword, matchType: 'broad' });
                }
                if (matchTypes.phrase) {
                    formattedKeywords.push(`"${keyword}"`);
                    enriched.push({ text: `"${keyword}"`, matchType: 'phrase' });
                }
                if (matchTypes.exact) {
                    formattedKeywords.push(`[${keyword}]`);
                    enriched.push({ text: `[${keyword}]`, matchType: 'exact' });
                }
            });
            
            if (isAppend) {
                setGeneratedKeywords(prev => [...prev, ...formattedKeywords]);
                setEnrichedKeywords(prev => [...prev, ...enriched]);
            } else {
                setGeneratedKeywords(formattedKeywords);
                setEnrichedKeywords(enriched);
            }
            
            setApiStatus('error');
            notifications.warning(`Generated ${formattedKeywords.length} keywords (local fallback)`, {
                title: 'Fallback Mode',
                description: 'Using local patterns - connect Google Ads for real metrics'
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyAll = async () => {
        const text = generatedKeywords.join('\n');
        const success = await copyToClipboard(text);
        if (success) {
            notifications.success('Keywords copied to clipboard!', {
                title: 'Copied'
            });
        } else {
            notifications.warning('Please manually copy the text from the visible text area.', {
                title: 'Copy Failed'
            });
        }
    };

    const handleSave = async () => {
        if (generatedKeywords.length === 0) return;
        setIsSaving(true);
        try {
            await historyService.save(
                'keyword-planner',
                `Plan: ${seedKeywords.substring(0, 30)}...`,
                { seedKeywords, negativeKeywords, generatedKeywords, matchTypes }
            );
            notifications.success('Keyword plan saved!', {
                title: 'Saved Successfully'
            });
            // Refresh the saved lists to show the newly saved item
            await handleLoadSavedLists();
        } catch (error) {
            console.error("Save failed", error);
            notifications.error('Failed to save. Please try again.', {
                title: 'Save Failed'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenSaveDialog = () => {
        setShowSaveDialog(true);
    };

    const handleCloseSaveDialog = () => {
        setShowSaveDialog(false);
    };

    const handleSaveWithCustomName = async () => {
        if (generatedKeywords.length === 0) return;
        
        // Bug_42: Validate that listName is not empty or whitespace-only
        const trimmedName = listName.trim();
        if (!trimmedName || trimmedName.length === 0) {
            notifications.warning('Please enter a plan name', {
                title: 'Plan Name Required',
                description: 'The plan name cannot be empty.'
            });
            return;
        }
        
        setIsSaving(true);
        try {
            await historyService.save(
                'keyword-planner',
                trimmedName || `Plan: ${seedKeywords.substring(0, 30)}...`,
                { seedKeywords, negativeKeywords, generatedKeywords, matchTypes }
            );
            // Bug_43: Use toast notification instead of alert
            notifications.success('Keyword plan saved successfully!', {
                title: 'Saved',
                description: 'Your keyword plan has been saved.'
            });
            setListName('');
            setShowSaveDialog(false);
            // Refresh the saved lists to show the newly saved item
            await handleLoadSavedLists();
        } catch (error) {
            console.error("Save failed", error);
            notifications.error('Failed to save. Please try again.', {
                title: 'Save Failed'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadSavedList = async (listId: string) => {
        try {
            // Load from localStorage using historyService
            const allItems = await historyService.getAll();
            const item = allItems.find(i => i.id === listId);
            if (item && item.data) {
                setSeedKeywords(item.data.seedKeywords || '');
                setNegativeKeywords(item.data.negativeKeywords || '');
                setGeneratedKeywords(item.data.generatedKeywords || []);
                setMatchTypes(item.data.matchTypes || { broad: true, phrase: true, exact: true });
                setActiveTab('planner');
            }
        } catch (error) {
            console.error("Load failed", error);
            notifications.error('Failed to load list. Please try again.', {
                title: 'Load Failed'
            });
        }
    };

    const handleDeleteSavedList = async (listId: string) => {
        if (!confirm('Are you sure you want to delete this list?')) return;
        
        try {
            await historyService.delete(listId);
            setSavedLists(prev => prev.filter(list => list.id !== listId));
            notifications.success('List deleted successfully!', {
                title: 'Deleted'
            });
        } catch (error) {
            console.error("Delete failed", error);
            notifications.error('Failed to delete list. Please try again.', {
                title: 'Delete Failed'
            });
        }
    };

    const handleDownloadKeywords = () => {
        const text = generatedKeywords.join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'keywords.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleLoadSavedLists = async () => {
        try {
            const items = await historyService.getByType('keyword-planner');
            const formattedLists: SavedList[] = items.map(item => ({
                id: item.id,
                name: item.name,
                seedKeywords: item.data.seedKeywords || '',
                negativeKeywords: item.data.negativeKeywords || '',
                generatedKeywords: item.data.generatedKeywords || [],
                matchTypes: item.data.matchTypes || { broad: true, phrase: true, exact: true },
                createdAt: item.timestamp
            }));
            setSavedLists(formattedLists);
        } catch (error) {
            console.error("Load all failed", error);
        }
    };

    useEffect(() => {
        handleLoadSavedLists();
    }, []);

    return (
        <div className="p-4 max-w-5xl mx-auto">
            <div className="mb-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
                    AI Keyword Planner
                </h1>
                <p className="text-sm text-slate-500">
                    Generate comprehensive keyword lists using AI based on your seed keywords and negative filters
                </p>
            </div>

            {/* Tabs at the top */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList>
                    <TabsTrigger value="planner">Keyword Planner</TabsTrigger>
                    <TabsTrigger value="saved">Saved Lists</TabsTrigger>
                </TabsList>
                
                <TabsContent value="planner">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left Panel: Analysis Configuration */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-slate-200/60 shadow-lg flex flex-col">
                            <div className="relative mb-3">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800 mb-1">
                                            Analysis Configuration
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Provide details to guide the AI model
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleFillInfo}
                                        className="shrink-0 text-xs"
                                    >
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Fill Info
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto">
                                {/* URL-based Seed Generation */}
                                <div className="space-y-1.5 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                                    <Label htmlFor="urlInput" className="flex items-center gap-1.5 text-sm text-slate-700">
                                        <Link className="w-4 h-4 text-blue-600" />
                                        Generate Seeds from URL
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="urlInput"
                                            placeholder="https://example.com/your-landing-page"
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            className="text-sm flex-1"
                                        />
                                        <Button
                                            onClick={handleGenerateSeedsFromUrl}
                                            disabled={isGeneratingSeedFromUrl || !urlInput.trim()}
                                            size="sm"
                                            variant="outline"
                                            className="shrink-0"
                                        >
                                            {isGeneratingSeedFromUrl ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4 mr-1" />
                                                    Extract
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Enter a URL to automatically extract seed keywords using Google Ads Keyword Planner.
                                    </p>
                                </div>

                                {/* Seed Keywords */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="seedKeywords" className="flex items-center gap-1.5 text-sm text-slate-700">
                                        <span className="text-red-500">*</span>
                                        Seed Keywords
                                    </Label>
                                    <Input
                                        id="seedKeywords"
                                        placeholder="airline number, contact airline, delta phone number"
                                        value={seedKeywords}
                                        onChange={(e) => setSeedKeywords(e.target.value)}
                                        className="text-sm"
                                    />
                                    <p className="text-xs text-slate-500">
                                        Enter the main keywords you are targeting (3-5 core ideas, comma-separated).
                                    </p>
                                    
                                    {/* AI Suggestions */}
                                    {suggestedKeywords.length > 0 && (
                                        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Lightbulb className="w-4 h-4 text-blue-600" />
                                                <span className="text-xs font-semibold text-blue-900">AI Suggestions</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {suggestedKeywords.map((keyword, idx) => (
                                                    <Button
                                                        key={idx}
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => applySuggestedKeyword(keyword)}
                                                        className="text-xs h-7 bg-white border-blue-300 hover:bg-blue-100 hover:border-blue-400"
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        {keyword}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Target Match Types */}
                                <div className="space-y-1.5">
                                    <Label className="flex items-center gap-1.5 text-sm text-slate-700">
                                        <span className="text-red-500">*</span>
                                        Target Match Types
                                    </Label>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <Checkbox 
                                                id="broad-planner" 
                                                checked={matchTypes.broad}
                                                onCheckedChange={(c: boolean) => setMatchTypes(prev => ({...prev, broad: c as boolean}))}
                                                className="border-amber-400"
                                            />
                                            <label htmlFor="broad-planner" className="text-xs text-slate-600 cursor-pointer">
                                                Broad Match
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Checkbox 
                                                id="phrase-planner" 
                                                checked={matchTypes.phrase}
                                                onCheckedChange={(c: boolean) => setMatchTypes(prev => ({...prev, phrase: c as boolean}))}
                                                className="border-blue-400"
                                            />
                                            <label htmlFor="phrase-planner" className="text-xs text-slate-600 cursor-pointer">
                                                Phrase Match "keyword"
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Checkbox 
                                                id="exact-planner" 
                                                checked={matchTypes.exact}
                                                onCheckedChange={(c: boolean) => setMatchTypes(prev => ({...prev, exact: c as boolean}))}
                                                className="border-emerald-400"
                                            />
                                            <label htmlFor="exact-planner" className="text-xs text-slate-600 cursor-pointer">
                                                Exact Match [keyword]
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Negative Keywords */}
                                <div className="space-y-1.5">
                                    <Label className="text-sm text-slate-700">
                                        Negative Keywords
                                    </Label>
                                    <Textarea
                                        placeholder="cheap, discount, reviews, job, free, best..."
                                        value={negativeKeywords}
                                        onChange={(e) => setNegativeKeywords(e.target.value)}
                                        className="min-h-[100px] text-xs resize-none"
                                    />
                                    <p className="text-xs text-slate-500">
                                        Enter negative keywords (one per line or comma-separated). AI will avoid generating keywords containing these terms.
                                    </p>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <div className="pt-4 border-t border-slate-200 mt-4">
                                <Button
                                    onClick={() => handleGenerate(false)}
                                    disabled={isGenerating || !(typeof seedKeywords === 'string' && seedKeywords.trim())}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2.5"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                                            Generating Keywords...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Generate Keywords
                                        </>
                                    )}
                                </Button>
                                {generatedKeywords.length > 0 && (
                                    <Button
                                        onClick={() => handleGenerate(true)}
                                        disabled={isGenerating || !(typeof seedKeywords === 'string' && seedKeywords.trim())}
                                        variant="outline"
                                        className="w-full mt-2 text-sm py-2"
                                    >
                                        Append More ({generatedKeywords.length} total)
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Generated Keywords */}
                        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-slate-200/60 shadow-lg flex flex-col">
                            <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Generated Keywords ({generatedKeywords.length})
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        {generatedKeywords.length > 0 && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowMetrics(!showMetrics)}
                                                    className="text-xs h-7"
                                                >
                                                    <BarChart3 className="w-3 h-3 mr-1" />
                                                    {showMetrics ? 'Hide' : 'Show'} Metrics
                                                </Button>
                                                <Badge variant="outline" className={`text-xs ${
                                                    dataSource === 'google_ads_api' 
                                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                                        : dataSource === 'fallback' 
                                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                                                            : 'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                    {dataSource === 'google_ads_api' 
                                                        ? 'Google Ads API' 
                                                        : dataSource === 'fallback' 
                                                            ? 'Estimated' 
                                                            : 'Local'}
                                                </Badge>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {showMetrics && enrichedKeywords.some(k => k.metrics) 
                                        ? 'Keywords with volume, CPC, and competition data' 
                                        : 'Results will appear here after generation'}
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {generatedKeywords.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                            <Sparkles className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-700 mb-2">
                                            Ready to Generate
                                        </h3>
                                        <p className="text-xs text-slate-500 max-w-xs">
                                            Fill out the configuration including your seed keywords. AI will analyze your inputs and generate a comprehensive list of keywords.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Action Buttons */}
                                        <div className="flex gap-2 flex-wrap">
                                            <Button
                                                onClick={handleOpenSaveDialog}
                                                disabled={isSaving || generatedKeywords.length === 0}
                                                variant="default"
                                                size="sm"
                                                className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </Button>
                                            <Button
                                                onClick={handleCopyAll}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs gap-1.5"
                                            >
                                                <Copy className="w-3.5 h-3.5" />
                                                Copy All
                                            </Button>
                                            <Button
                                                onClick={handleDownloadKeywords}
                                                variant="outline"
                                                size="sm"
                                                className="text-xs gap-1.5"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Download
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    // Navigate to campaign builder with generated keywords
                                                    // Use SKAG structure by default and pass data for AD Generation step
                                                    const event = new CustomEvent('navigate', { 
                                                        detail: { 
                                                            tab: 'builder-3',
                                                            data: {
                                                                selectedKeywords: generatedKeywords,
                                                                seedKeywords: seedKeywords,
                                                                negativeKeywords: negativeKeywords,
                                                                matchTypes: matchTypes,
                                                                structure: 'SKAG',
                                                                skipToAdsGeneration: true
                                                            }
                                                        } 
                                                    });
                                                    window.dispatchEvent(event);
                                                    
                                                    // Fallback: Update URL hash
                                                    if (window.location.hash !== '#builder-3') {
                                                        window.location.hash = '#builder-3';
                                                    }
                                                }}
                                                disabled={generatedKeywords.length === 0}
                                                variant="default"
                                                size="sm"
                                                className="text-xs gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                                            >
                                                <ArrowRight className="w-3.5 h-3.5" />
                                                Create Campaign
                                            </Button>
                                        </div>

                                        {/* Keywords List with Metrics */}
                                        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                                            {showMetrics && enrichedKeywords.some(k => k.metrics) && (
                                                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 sticky top-0">
                                                    <div className="col-span-5">Keyword</div>
                                                    <div className="col-span-2 text-center">Volume</div>
                                                    <div className="col-span-2 text-center">CPC</div>
                                                    <div className="col-span-3 text-center">Competition</div>
                                                </div>
                                            )}
                                            {(showMetrics && enrichedKeywords.length > 0 ? enrichedKeywords : generatedKeywords.map(k => ({ text: k }))).map((item, idx) => {
                                                const kw = typeof item === 'string' ? { text: item } : item;
                                                const metrics = (kw as EnrichedKeyword).metrics;
                                                
                                                return showMetrics && metrics ? (
                                                    <div
                                                        key={idx}
                                                        className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 rounded-lg hover:bg-indigo-50 transition-colors text-xs"
                                                    >
                                                        <div className="col-span-5 font-mono text-slate-700 truncate" title={kw.text}>
                                                            {kw.text}
                                                        </div>
                                                        <div className="col-span-2 text-center flex items-center justify-center gap-1">
                                                            <TrendingUp className="w-3 h-3 text-blue-500" />
                                                            <span className="text-slate-600">
                                                                {metrics.avgMonthlySearches 
                                                                    ? metrics.avgMonthlySearches >= 1000 
                                                                        ? `${(metrics.avgMonthlySearches / 1000).toFixed(1)}K`
                                                                        : metrics.avgMonthlySearches.toLocaleString()
                                                                    : '-'}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-2 text-center flex items-center justify-center gap-1">
                                                            <DollarSign className="w-3 h-3 text-green-500" />
                                                            <span className="text-slate-600">
                                                                {metrics.avgCpc ? `$${metrics.avgCpc.toFixed(2)}` : '-'}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-3 text-center">
                                                            <Badge variant="outline" className={`text-xs ${
                                                                metrics.competition === 'HIGH' 
                                                                    ? 'bg-red-50 text-red-600 border-red-200' 
                                                                    : metrics.competition === 'MEDIUM' 
                                                                        ? 'bg-yellow-50 text-yellow-600 border-yellow-200' 
                                                                        : 'bg-green-50 text-green-600 border-green-200'
                                                            }`}>
                                                                {metrics.competition || 'Low'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        key={idx}
                                                        className="px-3 py-2 bg-slate-50 rounded-lg hover:bg-indigo-50 transition-colors text-xs text-slate-700 font-mono"
                                                    >
                                                        {kw.text}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="saved">
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 shadow-xl">
                        <h2 className="text-xl font-bold text-indigo-600 mb-6">
                            3. Saved Keyword Lists
                        </h2>
                        {savedLists.length > 0 ? (
                            <div className="space-y-4">
                                {savedLists.map(list => (
                                    <div
                                        key={list.id}
                                        className="px-3 py-2 bg-white rounded border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-sm text-slate-700 font-mono"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <span className="font-bold">{list.name}</span>
                                                <span className="text-xs text-slate-500">
                                                    Created: {new Date(list.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleLoadSavedList(list.id)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2"
                                                >
                                                    <FolderOpen className="w-4 h-4" />
                                                    Load
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteSavedList(list.id)}
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
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500">
                                        No saved keyword lists found.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Save Dialog */}
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Save Keyword Plan</DialogTitle>
                        <DialogDescription>
                            Enter a name for your keyword plan and save it for future use.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                placeholder="My Keyword Plan"
                                value={listName}
                                onChange={(e) => setListName(e.target.value)}
                                className="bg-white border-slate-300"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleCloseSaveDialog}
                            variant="outline"
                            className="gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveWithCustomName}
                            disabled={isSaving}
                            className="gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};