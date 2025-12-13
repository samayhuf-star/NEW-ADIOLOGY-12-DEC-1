import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, ArrowLeft, Check, Globe, Link2, Sparkles, Brain, 
  Hash, MapPin, FileText, Download, AlertCircle, CheckCircle2,
  Loader2, Search, Filter, X, Plus, Edit3, Trash2, Save,
  Target, Zap, Layers, TrendingUp, Building2, ShoppingBag,
  Phone, Mail, Calendar, Clock, Eye, FileSpreadsheet, Copy,
  MessageSquare, Gift, Image as ImageIcon, DollarSign, MapPin as MapPinIcon,
  Star, RefreshCw, Smartphone, Megaphone, FolderOpen,
  Type, ChevronUp, ChevronDown, MousePointerClick, Briefcase
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { notifications } from '../utils/notifications';
import { extractLandingPageContent, type LandingPageExtractionResult } from '../utils/campaignIntelligence/landingPageExtractor';
import { mapGoalToIntent } from '../utils/campaignIntelligence/intentClassifier';
import { type IntentResult, IntentId } from '../utils/campaignIntelligence/schemas';
import { generateCampaignStructure, type StructureSettings } from '../utils/campaignStructureGenerator';
import { generateKeywords as generateKeywordsUtil } from '../utils/keywordGenerator';
import {
  generateAds as generateAdsUtility, 
  detectUserIntent,
  type AdGenerationInput,
  type ResponsiveSearchAd,
  type ExpandedTextAd,
  type CallOnlyAd
} from '../utils/googleAdGenerator';
import { exportCampaignToCSVV3, validateCSVBeforeExport } from '../utils/csvGeneratorV3';
import { exportCampaignToGoogleAdsEditorCSV, campaignStructureToCSVRows, GOOGLE_ADS_EDITOR_HEADERS } from '../utils/googleAdsEditorCSVExporter';
import { validateAndFixAds, formatValidationReport } from '../utils/adValidationUtils';
import Papa from 'papaparse';
import { historyService } from '../utils/historyService';
import { generateCSVWithBackend } from '../utils/csvExportBackend';
import { convertBuilderDataToEditorFormat, downloadGoogleAdsEditorCSV } from '../utils/googleAdsEditorCSV';
import type { CampaignStructure } from '../utils/campaignStructureGenerator';
import { api } from '../utils/api';
import { analysisService } from '../utils/analysisService';
import { 
  generateURL, 
  generateCampaignName, 
  generateNegativeKeywords,
  generateLocationInput 
} from '../utils/autoFill';
import { getKeywordMetrics, type KeywordMetrics } from '../utils/keywordPlannerApi';
import { GEO_PRESETS, US_STATES_ALL, US_CITIES_TOP_500, US_ZIP_CODES_EXTENDED, getGeoPresetsForCountry } from '../data/locationPresets';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { generateDKIAdWithAI } from '../utils/dkiAdGeneratorAI';
import { CampaignFlowDiagram } from './CampaignFlowDiagram';

// Campaign Structure Types (14 structures)
const CAMPAIGN_STRUCTURES = [
  { id: 'skag', name: 'SKAG', description: 'Single Keyword Ad Group', icon: Target },
  { id: 'stag', name: 'STAG', description: 'Single Theme Ad Group', icon: Layers },
  { id: 'mix', name: 'Mix', description: 'Hybrid Structure', icon: TrendingUp },
  { id: 'stag_plus', name: 'STAG+', description: 'Smart Grouping with ML', icon: Brain },
  { id: 'intent', name: 'Intent-Based', description: 'Group by Intent', icon: Target },
  { id: 'alpha_beta', name: 'Alpha-Beta', description: 'Winners & Discovery', icon: Zap },
  { id: 'match_type', name: 'Match-Type Split', description: 'Separate by Match Type', icon: Filter },
  { id: 'geo', name: 'GEO-Segmented', description: 'One Campaign per Geo', icon: MapPin },
  { id: 'funnel', name: 'Funnel-Based', description: 'TOF/MOF/BOF', icon: TrendingUp },
  { id: 'brand_split', name: 'Brand Split', description: 'Brand vs Non-Brand', icon: Building2 },
  { id: 'competitor', name: 'Competitor', description: 'Competitor Campaigns', icon: Target },
  { id: 'ngram', name: 'N-Gram Clusters', description: 'Smart Clustering', icon: Brain },
  { id: 'long_tail', name: 'Long-Tail Master', description: '3+ Word Low-Competition Keywords', icon: Search },
  { id: 'seasonal', name: 'Seasonal Sprint', description: 'Time-Based Campaigns', icon: Calendar },
];

// Match Types
const MATCH_TYPES = [
  { id: 'broad', label: 'Broad Match', example: 'keyword' },
  { id: 'phrase', label: 'Phrase Match', example: '"keyword"' },
  { id: 'exact', label: 'Exact Match', example: '[keyword]' },
];

// Keyword Types for filtering
const KEYWORD_TYPES = [
  { id: 'broad', label: 'Broad Match' },
  { id: 'phrase', label: 'Phrase Match' },
  { id: 'exact', label: 'Exact Match' },
  { id: 'negative', label: 'Negative Keywords' },
];

// Default negative keywords (15-20 keywords as specified)
const DEFAULT_NEGATIVE_KEYWORDS = [
  'cheap',
  'discount',
  'cost',
  'reviews',
  'job',
  'apply',
  'information',
  'company',
  'free',
  'best',
  'providers',
  'office',
  'headquater',
  'brand',
];

// Location Presets - Top locations
const LOCATION_PRESETS = {
  countries: [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France',
    'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Sweden', 'Norway',
    'Denmark', 'Finland', 'Poland', 'Austria', 'Ireland', 'Portugal', 'Greece'
  ],
  states: [
    'California', 'Texas', 'New York', 'Florida', 'Illinois', 'Pennsylvania',
    'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia',
    'Washington', 'Arizona', 'Massachusetts', 'Tennessee', 'Indiana', 'Missouri',
    'Maryland', 'Wisconsin', 'Colorado', 'Minnesota', 'South Carolina', 'Alabama',
    'Louisiana', 'Kentucky', 'Oregon', 'Oklahoma', 'Connecticut', 'Utah'
  ],
  cities: [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
    'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle',
    'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville', 'Detroit', 'Oklahoma City',
    'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque',
    'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Raleigh',
    'Miami', 'Long Beach', 'Virginia Beach', 'Oakland', 'Minneapolis', 'Tulsa', 'Tampa',
    'Arlington', 'New Orleans', 'Wichita', 'Cleveland'
  ],
  zipCodes: (() => {
    // Top 5000 most common US ZIP codes (major metropolitan areas)
    const majorMetros = [
      // NYC area
      ...Array.from({ length: 200 }, (_, i) => String(10001 + i).padStart(5, '0')),
      // LA area
      ...Array.from({ length: 300 }, (_, i) => String(90001 + i).padStart(5, '0')),
      // Chicago area
      ...Array.from({ length: 250 }, (_, i) => String(60601 + i).padStart(5, '0')),
      // Houston area
      ...Array.from({ length: 200 }, (_, i) => String(77001 + i).padStart(5, '0')),
      // Phoenix area
      ...Array.from({ length: 150 }, (_, i) => String(85001 + i).padStart(5, '0')),
      // Philadelphia area
      ...Array.from({ length: 200 }, (_, i) => String(19101 + i).padStart(5, '0')),
      // San Antonio
      ...Array.from({ length: 100 }, (_, i) => String(78201 + i).padStart(5, '0')),
      // San Diego
      ...Array.from({ length: 150 }, (_, i) => String(92101 + i).padStart(5, '0')),
      // Dallas
      ...Array.from({ length: 150 }, (_, i) => String(75201 + i).padStart(5, '0')),
      // San Jose
      ...Array.from({ length: 100 }, (_, i) => String(95101 + i).padStart(5, '0')),
      // Austin
      ...Array.from({ length: 100 }, (_, i) => String(78701 + i).padStart(5, '0')),
      // Jacksonville
      ...Array.from({ length: 100 }, (_, i) => String(32201 + i).padStart(5, '0')),
      // Fort Worth
      ...Array.from({ length: 100 }, (_, i) => String(76101 + i).padStart(5, '0')),
      // Columbus
      ...Array.from({ length: 100 }, (_, i) => String(43201 + i).padStart(5, '0')),
      // Charlotte
      ...Array.from({ length: 100 }, (_, i) => String(28201 + i).padStart(5, '0')),
      // San Francisco
      ...Array.from({ length: 100 }, (_, i) => String(94101 + i).padStart(5, '0')),
      // Indianapolis
      ...Array.from({ length: 100 }, (_, i) => String(46201 + i).padStart(5, '0')),
      // Seattle
      ...Array.from({ length: 100 }, (_, i) => String(98101 + i).padStart(5, '0')),
      // Denver
      ...Array.from({ length: 100 }, (_, i) => String(80201 + i).padStart(5, '0')),
      // Washington DC
      ...Array.from({ length: 100 }, (_, i) => String(20001 + i).padStart(5, '0')),
      // Boston
      ...Array.from({ length: 100 }, (_, i) => String(2101 + i).padStart(5, '0')),
      // El Paso
      ...Array.from({ length: 50 }, (_, i) => String(79901 + i).padStart(5, '0')),
      // Nashville
      ...Array.from({ length: 50 }, (_, i) => String(37201 + i).padStart(5, '0')),
      // Detroit
      ...Array.from({ length: 100 }, (_, i) => String(48201 + i).padStart(5, '0')),
      // Oklahoma City
      ...Array.from({ length: 50 }, (_, i) => String(73101 + i).padStart(5, '0')),
      // Portland
      ...Array.from({ length: 50 }, (_, i) => String(97201 + i).padStart(5, '0')),
      // Las Vegas
      ...Array.from({ length: 100 }, (_, i) => String(89101 + i).padStart(5, '0')),
      // Memphis
      ...Array.from({ length: 50 }, (_, i) => String(38101 + i).padStart(5, '0')),
      // Louisville
      ...Array.from({ length: 50 }, (_, i) => String(40201 + i).padStart(5, '0')),
      // Baltimore
      ...Array.from({ length: 100 }, (_, i) => String(21201 + i).padStart(5, '0')),
      // Milwaukee
      ...Array.from({ length: 50 }, (_, i) => String(53201 + i).padStart(5, '0')),
      // Albuquerque
      ...Array.from({ length: 50 }, (_, i) => String(87101 + i).padStart(5, '0')),
      // Tucson
      ...Array.from({ length: 50 }, (_, i) => String(85701 + i).padStart(5, '0')),
      // Fresno
      ...Array.from({ length: 50 }, (_, i) => String(93701 + i).padStart(5, '0')),
      // Sacramento
      ...Array.from({ length: 50 }, (_, i) => String(95814 + i).padStart(5, '0')),
      // Kansas City
      ...Array.from({ length: 50 }, (_, i) => String(64101 + i).padStart(5, '0')),
      // Mesa
      ...Array.from({ length: 50 }, (_, i) => String(85201 + i).padStart(5, '0')),
      // Atlanta
      ...Array.from({ length: 100 }, (_, i) => String(30301 + i).padStart(5, '0')),
      // Omaha
      ...Array.from({ length: 50 }, (_, i) => String(68101 + i).padStart(5, '0')),
      // Raleigh
      ...Array.from({ length: 50 }, (_, i) => String(27601 + i).padStart(5, '0')),
      // Miami
      ...Array.from({ length: 100 }, (_, i) => String(33101 + i).padStart(5, '0')),
      // Long Beach
      ...Array.from({ length: 50 }, (_, i) => String(90801 + i).padStart(5, '0')),
      // Virginia Beach
      ...Array.from({ length: 50 }, (_, i) => String(23451 + i).padStart(5, '0')),
      // Oakland
      ...Array.from({ length: 50 }, (_, i) => String(94601 + i).padStart(5, '0')),
      // Minneapolis
      ...Array.from({ length: 50 }, (_, i) => String(55401 + i).padStart(5, '0')),
      // Tulsa
      ...Array.from({ length: 50 }, (_, i) => String(74101 + i).padStart(5, '0')),
      // Tampa
      ...Array.from({ length: 50 }, (_, i) => String(33601 + i).padStart(5, '0')),
      // Arlington
      ...Array.from({ length: 50 }, (_, i) => String(76001 + i).padStart(5, '0')),
      // New Orleans
      ...Array.from({ length: 50 }, (_, i) => String(70112 + i).padStart(5, '0')),
      // Wichita
      ...Array.from({ length: 50 }, (_, i) => String(67201 + i).padStart(5, '0')),
      // Cleveland
      ...Array.from({ length: 100 }, (_, i) => String(44101 + i).padStart(5, '0')),
    ];
    // Remove duplicates and limit to 5000
    return [...new Set(majorMetros)].slice(0, 5000);
  })(),
};

interface AdGroup {
  id: string;
  name: string;
  keywords: string[];
  negativeKeywords?: string[];
}

interface CampaignData {
  url: string;
  campaignName: string;
  intent: IntentResult | null;
  vertical: string | null;
  cta: string | null;
  selectedStructure: string | null;
  structureRankings: { id: string; score: number }[];
  seedKeywords: string[];
  negativeKeywords: string[];
  generatedKeywords: any[];
  selectedKeywords: any[];
  keywordTypes: { [key: string]: boolean };
  ads: any[];
  adTypes: string[];
  extensions: any[];
  adGroups: AdGroup[];
  selectedAdGroup: string | null;
  targetCountry: string;
  locations: {
    countries: string[];
    states: string[];
    cities: string[];
    zipCodes: string[];
  };
  csvData: any;
  csvErrors: any[];
  startDate?: string;
  endDate?: string;
}

interface CampaignBuilder3Props {
  initialData?: any;
}

export const CampaignBuilder3: React.FC<CampaignBuilder3Props> = ({ initialData }) => {
  const generateDefaultCampaignName = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `Campaign-Search-${dateStr} ${timeStr}`;
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [campaignSaved, setCampaignSaved] = useState(false);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [locationSearchTerm, setLocationSearchTerm] = useState({ countries: '', states: '', cities: '', zipCodes: '' });
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editingCampaignName, setEditingCampaignName] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [seedKeywordsText, setSeedKeywordsText] = useState('');
  const [keywordDataSource, setKeywordDataSource] = useState<'google_ads_api' | 'fallback' | 'estimated' | 'local'>('local');
  const [googleAdsCustomerId, setGoogleAdsCustomerId] = useState<string | null>(null);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<any>(null);
  const [analysisExpanded, setAnalysisExpanded] = useState<{ [key: string]: boolean }>({});
  const [analysisLogs, setAnalysisLogs] = useState<{ timestamp: string; message: string; type: 'info' | 'success' | 'step' | 'data' | 'ai' }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisLogsRef = React.useRef<HTMLDivElement>(null);
  const [showCallAdDialog, setShowCallAdDialog] = useState(false);
  const [callAdPhone, setCallAdPhone] = useState('');
  const [callAdBusinessName, setCallAdBusinessName] = useState('');
  const [showFlowDiagram, setShowFlowDiagram] = useState(false);
  const [selectedStructureForDiagram, setSelectedStructureForDiagram] = useState<{ id: string; name: string } | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    url: '',
    campaignName: generateDefaultCampaignName(),
    intent: null,
    vertical: null,
    cta: null,
    selectedStructure: null,
    structureRankings: [],
    seedKeywords: [],
    negativeKeywords: [...DEFAULT_NEGATIVE_KEYWORDS], // Initialize with default negative keywords
    generatedKeywords: [],
    selectedKeywords: [],
    keywordTypes: { broad: true, phrase: true, exact: true, negative: true }, // Show negative keywords by default
    ads: [],
    adTypes: ['rsa', 'dki'],
    extensions: [],
    adGroups: [],
    selectedAdGroup: 'ALL_AD_GROUPS',
    targetCountry: 'United States',
    locations: { countries: [], states: [], cities: [], zipCodes: [] },
    csvData: null,
    csvErrors: [],
  });

  // Handle initial data from Keyword Planner or saved campaigns
  useEffect(() => {
    if (!initialData) return;

    try {
      // Handle saved campaign data (from CampaignHistoryView)
      if (initialData.campaignName || initialData.url || initialData.ads || initialData.adGroups) {
        console.log('Loading saved campaign data:', initialData);
        
        // Safely extract and validate data
        const safeData = {
          url: initialData.url || '',
          campaignName: initialData.campaignName || '',
          intent: initialData.intent || null,
          vertical: initialData.vertical || null,
          cta: initialData.cta || null,
          selectedStructure: initialData.selectedStructure || initialData.structureType || null,
          structureRankings: initialData.structureRankings || [],
          seedKeywords: Array.isArray(initialData.seedKeywords) 
            ? initialData.seedKeywords 
            : (typeof initialData.seedKeywords === 'string' 
                ? initialData.seedKeywords.split(',').map((s: string) => s.trim()).filter(Boolean)
                : []),
          negativeKeywords: Array.isArray(initialData.negativeKeywords)
            ? initialData.negativeKeywords
            : (typeof initialData.negativeKeywords === 'string'
                ? initialData.negativeKeywords.split('\n').map((s: string) => s.trim()).filter(Boolean)
                : [...DEFAULT_NEGATIVE_KEYWORDS]),
          generatedKeywords: Array.isArray(initialData.generatedKeywords) ? initialData.generatedKeywords : [],
          selectedKeywords: Array.isArray(initialData.selectedKeywords) ? initialData.selectedKeywords : [],
          ads: Array.isArray(initialData.ads) ? initialData.ads : [],
          adGroups: Array.isArray(initialData.adGroups) ? initialData.adGroups : [],
          locations: initialData.locations && typeof initialData.locations === 'object'
            ? {
                countries: Array.isArray(initialData.locations.countries) ? initialData.locations.countries : [],
                states: Array.isArray(initialData.locations.states) ? initialData.locations.states : [],
                cities: Array.isArray(initialData.locations.cities) ? initialData.locations.cities : [],
                zipCodes: Array.isArray(initialData.locations.zipCodes) ? initialData.locations.zipCodes : [],
              }
            : { countries: [], states: [], cities: [], zipCodes: [] },
          csvData: initialData.csvData || null,
        };

        // Determine which step to show based on data availability
        let targetStep = 1;
        if (safeData.url && safeData.selectedStructure) {
          targetStep = 2;
        }
        if (safeData.selectedKeywords && safeData.selectedKeywords.length > 0) {
          targetStep = 3;
        }
        if (safeData.ads && safeData.ads.length > 0) {
          targetStep = 4;
        }

        setCampaignData(prev => ({
          ...prev,
          ...safeData,
          // Ensure negative keywords always include defaults
          negativeKeywords: [...new Set([...DEFAULT_NEGATIVE_KEYWORDS, ...safeData.negativeKeywords])],
        }));

        setCurrentStep(targetStep);

        notifications.success('Campaign loaded successfully', {
          title: 'Campaign Restored',
          description: `Loaded campaign: ${safeData.campaignName || 'Unnamed Campaign'}`
        });
        return;
      }

      // Handle Keyword Planner data (legacy support)
      if (initialData.selectedKeywords && Array.isArray(initialData.selectedKeywords) && initialData.selectedKeywords.length > 0) {
        // Process keywords from Keyword Planner
        const keywords = initialData.selectedKeywords.map((kw: any) => {
          try {
            // Handle both string and object formats
            const kwText = typeof kw === 'string' ? kw : (kw?.text || kw?.keyword || String(kw || ''));
            // Clean keyword text (remove match type formatting for storage)
            let cleanKw = kwText.trim();
            if (cleanKw.startsWith('[') && cleanKw.endsWith(']')) {
              cleanKw = cleanKw.slice(1, -1);
            } else if (cleanKw.startsWith('"') && cleanKw.endsWith('"')) {
              cleanKw = cleanKw.slice(1, -1);
            }
            return {
              text: cleanKw,
              formatted: kwText, // Keep original format
              matchType: kwText.startsWith('[') ? 'exact' : kwText.startsWith('"') ? 'phrase' : 'broad'
            };
          } catch (err) {
            console.warn('Error processing keyword:', kw, err);
            return null;
          }
        }).filter(Boolean);

        // Extract seed keywords from the first few keywords if not provided
        const seedKws = initialData.seedKeywords 
          ? (typeof initialData.seedKeywords === 'string' 
              ? initialData.seedKeywords.split(',').map((s: string) => s.trim()).filter(Boolean)
              : Array.isArray(initialData.seedKeywords) ? initialData.seedKeywords : [])
          : keywords.slice(0, 5).map((k: any) => k.text);

        // Determine structure: use 'SKAG' as default for Keyword Planner imports, or from initialData
        const campaignStructure = initialData.structure 
          ? (typeof initialData.structure === 'string' ? initialData.structure.toLowerCase() : 'skag')
          : 'skag';

        setCampaignData(prev => ({
          ...prev,
          selectedKeywords: keywords,
          generatedKeywords: keywords,
          seedKeywords: seedKws,
          negativeKeywords: initialData.negativeKeywords 
            ? (typeof initialData.negativeKeywords === 'string' 
                ? initialData.negativeKeywords.split('\n').map((s: string) => s.trim()).filter(Boolean)
                : Array.isArray(initialData.negativeKeywords) ? initialData.negativeKeywords : [])
            : prev.negativeKeywords,
          // Set a default URL if not provided (required for campaign)
          url: prev.url || 'https://example.com',
          // Set the campaign structure (SKAG by default from Keyword Planner)
          selectedStructure: campaignStructure,
          // Generate campaign name from seed keywords if not set
          campaignName: prev.campaignName || (seedKws.length > 0 
            ? `${seedKws[0].replace(/[^a-z0-9]/gi, ' ').trim()} Campaign`
            : 'Campaign')
        }));
        
        // Sync the text state
        setSeedKeywordsText(seedKws.join('\n'));

        // Skip to step 3 (Ads Generation) since keywords are already provided
        setCurrentStep(3);
        
        notifications.success('Keywords loaded from Keyword Planner', {
          title: 'Keywords Ready',
          description: `${keywords.length} keywords loaded. Proceeding to ads generation.`
        });
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      notifications.error('Failed to load campaign data', {
        title: 'Load Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred. Please try again.'
      });
    }
  }, [initialData]);

  // Fetch Google Ads customer ID on mount (for Keyword Planner API)
  useEffect(() => {
    const fetchGoogleAdsAccount = async () => {
      try {
        const response = await fetch('/api/google-ads/accounts');
        if (response.ok) {
          const data = await response.json();
          if (data.accounts && data.accounts.length > 0) {
            // Use the first account as default
            setGoogleAdsCustomerId(data.accounts[0]);
          }
        }
      } catch (error) {
        console.log('Google Ads accounts not available, will use fallback data');
      }
    };
    fetchGoogleAdsAccount();
  }, []);

  // Generate smart campaign name from URL domain when user hasn't specified one
  useEffect(() => {
    if (!campaignData.campaignName && campaignData.url && campaignData.url.trim()) {
      try {
        const domain = extractDomain(campaignData.url);
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const domainName = domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        setCampaignData(prev => ({
          ...prev,
          campaignName: `${domainName} - Search Campaign ${dateStr}`
        }));
      } catch {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '').substring(0, 4);
        setCampaignData(prev => ({
          ...prev,
          campaignName: `Search-${dateStr}-${timeStr}`
        }));
      }
    }
  }, [campaignData.url]);


  // Helper function to safely extract domain from URL
  const extractDomain = (url: string): string => {
    if (!url || typeof url !== 'string') return 'example.com';
    try {
      // Add protocol if missing
      let fullUrl = url;
      if (!url.match(/^https?:\/\//)) {
        fullUrl = 'https://' + url;
      }
      const urlObj = new URL(fullUrl);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return url.split('/')[0].replace(/^https?:\/\//, '').replace(/^www\./, '') || 'example.com';
    }
  };

  // Helper function to format URL with protocol
  const formatUrl = (url: string): string => {
    if (!url) return '';
    if (!url.match(/^https?:\/\//)) {
      return 'https://' + url;
    }
    return url;
  };

  // Helper function to add analysis log entries
  const addAnalysisLog = (message: string, type: 'info' | 'success' | 'step' | 'data' | 'ai' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    setAnalysisLogs(prev => [...prev, { timestamp, message, type }]);
    // Auto-scroll to bottom
    setTimeout(() => {
      if (analysisLogsRef.current) {
        analysisLogsRef.current.scrollTop = analysisLogsRef.current.scrollHeight;
      }
    }, 50);
  };

  // Step 1: URL Input & AI Analysis
  const handleUrlSubmit = async () => {
    if (!campaignData.url || !campaignData.url.trim()) {
      notifications.error('Please enter a valid URL', { title: 'URL Required' });
      return;
    }

    setLoading(true);
    setIsAnalyzing(true);
    setAnalysisLogs([]);
    setComprehensiveAnalysis(null);
    
    try {
      // Format URL properly
      const formattedUrl = formatUrl(campaignData.url.trim());
      
      addAnalysisLog(`Starting comprehensive analysis for: ${formattedUrl}`, 'step');
      addAnalysisLog('Initializing Playwright browser...', 'info');
      
      // Try comprehensive server-side analysis first
      let comprehensiveData: any = null;
      try {
        addAnalysisLog('Connecting to target website...', 'info');
        
        const response = await fetch('/api/analyze-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: formattedUrl, extractionDepth: 'comprehensive' })
        });
        
        if (response.ok) {
          comprehensiveData = await response.json();
          if (comprehensiveData.success) {
            setComprehensiveAnalysis(comprehensiveData);
            
            // Log extracted data
            const data = comprehensiveData.data;
            addAnalysisLog('Page loaded successfully', 'success');
            addAnalysisLog('Extracting DOM elements...', 'step');
            
            if (data.seoSignals?.title) {
              addAnalysisLog(`Title: "${data.seoSignals.title}"`, 'data');
            }
            if (data.headings?.length > 0) {
              addAnalysisLog(`Found ${data.headings.length} headings`, 'data');
              const h1 = data.headings.find((h: any) => h.level === 'h1');
              if (h1) addAnalysisLog(`H1: "${h1.text}"`, 'data');
            }
            if (data.ctaElements?.length > 0) {
              addAnalysisLog(`Found ${data.ctaElements.length} call-to-action elements`, 'data');
            }
            if (data.forms?.length > 0) {
              addAnalysisLog(`Found ${data.forms.length} forms`, 'data');
            }
            if (data.services?.length > 0) {
              addAnalysisLog(`Detected ${data.services.length} services/products`, 'data');
            }
            if (data.contactInfo?.phones?.length > 0) {
              addAnalysisLog(`Found ${data.contactInfo.phones.length} phone numbers`, 'data');
            }
            if (data.contactInfo?.emails?.length > 0) {
              addAnalysisLog(`Found ${data.contactInfo.emails.length} email addresses`, 'data');
            }
            if (data.seoSignals?.wordCount) {
              addAnalysisLog(`Page content: ${data.seoSignals.wordCount} words`, 'data');
            }
            
            // AI insights
            if (comprehensiveData.aiInsights) {
              addAnalysisLog('Running AI analysis...', 'step');
              const ai = comprehensiveData.aiInsights;
              if (ai.businessType) addAnalysisLog(`Business Type: ${ai.businessType}`, 'ai');
              if (ai.primaryIntent) addAnalysisLog(`Primary Intent: ${ai.primaryIntent}`, 'ai');
              if (ai.targetAudience) addAnalysisLog(`Target Audience: ${ai.targetAudience}`, 'ai');
              if (ai.uniqueValueProposition) addAnalysisLog(`Value Proposition: ${ai.uniqueValueProposition}`, 'ai');
              if (ai.suggestedKeywords?.length > 0) {
                addAnalysisLog(`Suggested Keywords: ${ai.suggestedKeywords.join(', ')}`, 'ai');
              }
            }
          }
        }
      } catch (serverError) {
        addAnalysisLog('Server analysis unavailable, using fallback...', 'info');
        console.warn('Server-side analysis failed, using client-side fallback:', serverError);
      }
      
      addAnalysisLog('Processing extracted data...', 'step');
      
      // Build landing data from comprehensive analysis or fallback to client extraction
      let landingData: LandingPageExtractionResult;
      if (comprehensiveData?.success && comprehensiveData.data) {
        const data = comprehensiveData.data;
        landingData = {
          domain: extractDomain(formattedUrl),
          title: data.seoSignals?.title || null,
          h1: data.headings?.find((h: any) => h.level === 'h1')?.text || null,
          metaDescription: data.seoSignals?.metaDescription || null,
          services: data.services || [],
          phones: data.contactInfo?.phones || [],
          emails: data.contactInfo?.emails || [],
          hours: null,
          addresses: data.contactInfo?.addresses || [],
          schemas: { org: data.schemas?.[0] || undefined },
          page_text_tokens: data.mainContent?.split(' ').slice(0, 100) || [],
          extractionMethod: 'crawl',
          extractedAt: new Date().toISOString(),
        };
        addAnalysisLog('Landing page data structured', 'success');
      } else {
        // Fallback to client-side extraction
        addAnalysisLog('Using client-side extraction...', 'info');
        try {
          landingData = await extractLandingPageContent(formattedUrl);
          addAnalysisLog('Client extraction complete', 'success');
        } catch (extractError: any) {
          console.warn('Landing page extraction failed, using fallback:', extractError);
          landingData = {
            domain: extractDomain(formattedUrl),
            title: null,
            h1: null,
            metaDescription: null,
            services: [],
            phones: [],
            emails: [],
            hours: null,
            addresses: [],
            schemas: {},
            page_text_tokens: [],
            extractionMethod: 'fallback',
            extractedAt: new Date().toISOString(),
          };
          addAnalysisLog('Using minimal fallback data', 'info');
        }
      }
      
      addAnalysisLog('Detecting campaign intent...', 'step');
      
      // Use AI insights if available, otherwise detect manually
      let intentResult: IntentResult;
      let vertical: string | null;
      let cta: string | null;
      let seedKeywords: string[];
      
      if (comprehensiveData?.aiInsights) {
        const ai = comprehensiveData.aiInsights;
        intentResult = {
          intentId: ai.primaryIntent?.toLowerCase()?.includes('call') ? IntentId.CALL 
            : ai.primaryIntent?.toLowerCase()?.includes('lead') ? IntentId.LEAD
            : ai.primaryIntent?.toLowerCase()?.includes('purchase') ? IntentId.PURCHASE
            : IntentId.VISIT,
          intentLabel: ai.primaryIntent || 'Visit',
          score: 0.9
        };
        vertical = ai.businessType || detectVertical(landingData);
        cta = ai.conversionGoal || detectCTA(landingData, vertical);
        seedKeywords = ai.suggestedKeywords?.slice(0, 5) || await generateSeedKeywords(landingData, intentResult);
        
        addAnalysisLog(`Intent detected: ${intentResult.intentLabel}`, 'success');
        addAnalysisLog(`Vertical: ${vertical}`, 'success');
        addAnalysisLog(`CTA: ${cta}`, 'success');
      } else {
        // Fallback to manual detection
        addAnalysisLog('Using rule-based detection...', 'info');
        intentResult = mapGoalToIntent(
          (landingData?.title || landingData?.h1 || '').trim(),
          { ...landingData, url: formattedUrl, tokens: landingData.page_text_tokens || [] } as any,
          landingData?.phones?.[0] || ''
        );
        vertical = detectVertical(landingData);
        cta = detectCTA(landingData, vertical);
        seedKeywords = await generateSeedKeywords(landingData, intentResult);
        
        addAnalysisLog(`Intent detected: ${intentResult.intentLabel}`, 'success');
        addAnalysisLog(`Vertical: ${vertical}`, 'success');
        addAnalysisLog(`CTA: ${cta}`, 'success');
      }
      
      addAnalysisLog('Generating seed keywords...', 'step');
      addAnalysisLog(`Generated ${seedKeywords.length} seed keywords`, 'success');

      setCampaignData(prev => ({
        ...prev,
        intent: intentResult,
        vertical,
        cta,
        seedKeywords,
      }));
      
      setSeedKeywordsText(seedKeywords.join('\n'));

      // Auto-select best campaign structures
      addAnalysisLog('Ranking campaign structures...', 'step');
      const rankings = rankCampaignStructures(intentResult, vertical);
      setCampaignData(prev => ({
        ...prev,
        structureRankings: rankings,
        selectedStructure: rankings[0]?.id || 'skag',
      }));
      addAnalysisLog(`Recommended structure: ${rankings[0]?.name || 'SKAG'}`, 'success');

      // Save analysis to database
      addAnalysisLog('Saving analysis to database...', 'step');
      analysisService.saveAnalysis({
        url: formattedUrl,
        domain: extractDomain(formattedUrl),
        intent: intentResult,
        vertical: vertical || 'Unknown',
        cta: cta || 'Unknown',
        seedKeywords: seedKeywords,
        contentSummary: comprehensiveData?.aiInsights?.uniqueValueProposition || `Website analyzed: ${formattedUrl}`,
        detectedServices: landingData?.services || [],
        detectedCTAs: comprehensiveData?.data?.ctaElements?.map((c: any) => c.text) || [],
      });

      setShowAnalysisResults(true);
      addAnalysisLog('Analysis complete! Ready to proceed.', 'success');
      
      notifications.success('URL analyzed successfully', {
        title: 'Comprehensive Analysis Complete',
        description: `Detected: ${intentResult.intentLabel} intent, ${vertical} vertical`
      });

    } catch (error) {
      console.error('URL analysis error:', error);
      addAnalysisLog(`Error: ${error instanceof Error ? error.message : 'Analysis failed'}`, 'info');
      notifications.error('Failed to analyze URL', {
        title: 'Analysis Error',
        description: 'Please check the URL and try again'
      });
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  // Step 2: Campaign Structure Selection
  const handleStructureSelect = (structureId: string) => {
    setCampaignData(prev => ({ ...prev, selectedStructure: structureId }));
  };

  const handleNextFromStructure = () => {
    if (!campaignData.selectedStructure) {
      notifications.error('Please select a campaign structure', { title: 'Structure Required' });
      return;
    }
    setCurrentStep(3);
  };

  // Step 3: Keywords Generation
  const handleGenerateKeywords = async () => {
    if (campaignData.seedKeywords.length === 0) {
      notifications.error('Please provide seed keywords', { title: 'Seed Keywords Required' });
      return;
    }

    setLoading(true);
    try {
      // Use local autocomplete-based keyword generator directly
      // This ensures we always use the new autocomplete patterns
      console.log('Using autocomplete-based keyword generator');
      console.log('Seed keywords:', campaignData.seedKeywords);
      console.log('Negative keywords:', campaignData.negativeKeywords);
      
      const seedKeywordsString = campaignData.seedKeywords.join('\n');
      const negativeKeywordsString = campaignData.negativeKeywords.join('\n');
      
      console.log('Calling generateKeywordsUtil with:', {
        seedKeywords: seedKeywordsString,
        negativeKeywords: negativeKeywordsString,
        maxKeywords: 710,
        minKeywords: 410
      });
      
      const localKeywords = generateKeywordsUtil({
        seedKeywords: seedKeywordsString,
        negativeKeywords: negativeKeywordsString,
        vertical: campaignData.vertical || 'Services',
        intentResult: campaignData.intent,
        maxKeywords: 710,
        minKeywords: 410,
      });

      console.log('Generated keywords from utility:', localKeywords.length, localKeywords.slice(0, 10));

      if (!localKeywords || localKeywords.length === 0) {
        throw new Error('Keyword generator returned no keywords. Please check your seed keywords.');
      }

      // If we got very few keywords, something went wrong - generate more variations
      if (localKeywords.length < 50) {
        console.warn('Keyword generator returned only', localKeywords.length, 'keywords. Generating additional variations...');
        
        // Generate additional variations manually
        const additionalKeywords: any[] = [];
        // Ensure seeds are properly split by comma if they contain commas
        const seedList = campaignData.seedKeywords
          .flatMap(s => s.split(/[,]+/).map(k => k.trim()))
          .filter(s => s.length >= 2);
        const negativeList = campaignData.negativeKeywords.map(n => n.trim().toLowerCase()).filter(Boolean);
        
        seedList.forEach((seed, seedIdx) => {
          const cleanSeed = seed.trim().toLowerCase();
          if (negativeList.some(neg => cleanSeed.includes(neg))) return;
          
          // Generate many variations per seed
          const variations = [
            `${cleanSeed} near me`,
            `best ${cleanSeed}`,
            `top ${cleanSeed}`,
            `cheap ${cleanSeed}`,
            `24/7 ${cleanSeed}`,
            `emergency ${cleanSeed}`,
            `${cleanSeed} cost`,
            `${cleanSeed} price`,
            `${cleanSeed} services`,
            `${cleanSeed} company`,
            `professional ${cleanSeed}`,
            `licensed ${cleanSeed}`,
            `same day ${cleanSeed}`,
            `${cleanSeed} repair`,
            `${cleanSeed} replacement`,
            `how to ${cleanSeed}`,
            `what is ${cleanSeed}`,
            `where to ${cleanSeed}`,
            `best ${cleanSeed} near me`,
            `top ${cleanSeed} near me`,
            `24/7 ${cleanSeed} near me`,
            `emergency ${cleanSeed} near me`,
            `${cleanSeed} services near me`,
            `${cleanSeed} cost near me`,
            `${cleanSeed} price near me`,
            `best ${cleanSeed} cost`,
            `top ${cleanSeed} services`,
            `same day ${cleanSeed} repair`,
            `${cleanSeed} repair cost`,
            `${cleanSeed} replacement cost`,
          ];
          
          variations.forEach((variation, varIdx) => {
            if (additionalKeywords.length >= 500) return;
            if (negativeList.some(neg => variation.includes(neg))) return;
            if (localKeywords.some(k => k.text.toLowerCase() === variation.toLowerCase())) return;
            if (additionalKeywords.some(k => k.text.toLowerCase() === variation.toLowerCase())) return;
            
            additionalKeywords.push({
              id: `kw-manual-${seedIdx}-${varIdx}`,
              text: variation,
              volume: 'Medium',
              cpc: '$2.50',
              type: 'Generated',
              matchType: 'BROAD'
            });
          });
        });
        
        console.log('Generated', additionalKeywords.length, 'additional keyword variations');
        localKeywords.push(...additionalKeywords);
      }

      const generated = localKeywords.map((kw, index) => ({
          id: kw.id || `kw-${Date.now()}-${index}`,
          text: kw.text,
          keyword: kw.text,
        matchType: (kw.matchType || 'BROAD').toLowerCase(),
          volume: kw.volume || 'Medium',
          cpc: kw.cpc || '$2.50',
          type: kw.type || 'Generated',
        }));

      console.log('Mapped keywords:', generated.length);

      // Generate 410-710 keywords (random range as specified)
      const targetCount = Math.floor(Math.random() * 300) + 410;
      const finalKeywords = generated.slice(0, Math.min(generated.length, targetCount));
      
      console.log('Final keywords before filtering:', finalKeywords.length);

      // Filter out keywords that match negative keywords
      const negativeList = campaignData.negativeKeywords.map(n => n.trim().toLowerCase()).filter(Boolean);
      console.log('Negative keywords list:', negativeList);
      
      const filteredByNegatives = finalKeywords.filter((kw: any) => {
        const keywordText = (kw.text || kw.keyword || '').toLowerCase();
        const shouldExclude = negativeList.some(neg => keywordText.includes(neg));
        return !shouldExclude;
      });
      
      console.log('Keywords after negative filtering:', filteredByNegatives.length);

      // Apply match types based on selected keyword types
      const formattedKeywords: any[] = [];
      filteredByNegatives.forEach((kw: any) => {
        // Extract base text (remove match type formatting if present)
        let baseText = kw.text || kw.keyword || '';
        baseText = baseText.replace(/^["\[\]]|["\[\]]$/g, '').trim();
        
        // Skip if base text contains negative keywords
        const baseTextLower = baseText.toLowerCase();
        if (negativeList.some(neg => baseTextLower.includes(neg))) {
          return; // Skip this keyword
        }
        
        if (campaignData.keywordTypes.broad) {
          formattedKeywords.push({
            ...kw,
            id: `${kw.id}-broad`,
            text: baseText,
            keyword: baseText,
            matchType: 'broad',
          });
        }
        
        if (campaignData.keywordTypes.phrase) {
          formattedKeywords.push({
            ...kw,
            id: `${kw.id}-phrase`,
            text: `"${baseText}"`,
            keyword: `"${baseText}"`,
            matchType: 'phrase',
          });
        }
        
        if (campaignData.keywordTypes.exact) {
          formattedKeywords.push({
            ...kw,
            id: `${kw.id}-exact`,
            text: `[${baseText}]`,
            keyword: `[${baseText}]`,
            matchType: 'exact',
          });
        }
      });

      // Shuffle for variety
      const shuffled = [...formattedKeywords].sort(() => Math.random() - 0.5);
      
      console.log('Final formatted keywords count:', shuffled.length);
      console.log('Sample keywords:', shuffled.slice(0, 10).map(k => k.text));

      if (shuffled.length === 0) {
        throw new Error('No keywords were generated after formatting. Please check your seed keywords and match type selections.');
      }

      // Fetch metrics from Google Ads Keyword Planner API
      let enrichedKeywords = shuffled;
      let dataSource: 'google_ads_api' | 'fallback' | 'estimated' | 'local' = 'local';
      
      try {
        // Get unique base keywords for API call (without match type formatting)
        const uniqueBaseKeywords = [...new Set(shuffled.map(kw => {
          const text = kw.text || kw.keyword || '';
          return text.replace(/^["\[\]]|["\[\]]$/g, '').trim().toLowerCase();
        }))].slice(0, 50); // API limit
        
        console.log('[Keyword Planner] Fetching metrics for', uniqueBaseKeywords.length, 'unique keywords');
        
        const metricsResponse = await getKeywordMetrics({
          keywords: uniqueBaseKeywords,
          targetCountry: campaignData.targetCountry === 'United States' ? 'US' : 'US',
          customerId: googleAdsCustomerId || undefined,
        });
        
        if (metricsResponse.success && metricsResponse.keywords.length > 0) {
          dataSource = metricsResponse.source;
          
          // Create a map of keyword -> metrics
          const metricsMap = new Map<string, KeywordMetrics>();
          metricsResponse.keywords.forEach(m => {
            metricsMap.set(m.keyword.toLowerCase(), m);
          });
          
          // Enrich keywords with metrics
          enrichedKeywords = shuffled.map(kw => {
            const baseText = (kw.text || kw.keyword || '').replace(/^["\[\]]|["\[\]]$/g, '').trim().toLowerCase();
            const metrics = metricsMap.get(baseText);
            
            return {
              ...kw,
              volume: metrics?.avgMonthlySearches ?? null,
              avgMonthlySearches: metrics?.avgMonthlySearches ?? null,
              cpc: metrics?.avgCpc ?? null,
              avgCpc: metrics?.avgCpc ?? null,
              competition: metrics?.competition ?? null,
              competitionIndex: metrics?.competitionIndex ?? null,
              lowBid: metrics?.lowTopOfPageBid ?? null,
              highBid: metrics?.highTopOfPageBid ?? null,
            };
          });
          
          console.log('[Keyword Planner] Enriched keywords with', dataSource, 'data');
        }
      } catch (apiError) {
        console.warn('[Keyword Planner] Could not fetch metrics, using local data:', apiError);
        dataSource = 'local';
      }
      
      setKeywordDataSource(dataSource);

      // Generate ad groups based on campaign structure
      const adGroups = generateAdGroupsFromKeywords(enrichedKeywords, campaignData.selectedStructure || 'skag');

      setCampaignData(prev => ({
        ...prev,
        generatedKeywords: enrichedKeywords,
        selectedKeywords: enrichedKeywords, // Auto-select all by default
        adGroups: adGroups,
      }));
      
      // Auto-save draft
      await autoSaveDraft();

      const sourceLabel = dataSource === 'google_ads_api' ? 'Google Ads API' : (dataSource === 'fallback' || dataSource === 'estimated') ? 'estimated data' : 'local patterns';
      notifications.success(`Generated ${enrichedKeywords.length} keywords`, {
        title: 'Keywords Generated',
        description: `Generated ${enrichedKeywords.length} keywords with metrics from ${sourceLabel}`
      });

      // Scroll to generated keywords section
      setTimeout(() => {
        const keywordSection = document.querySelector('[data-keywords-section]');
        if (keywordSection) {
          keywordSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    } catch (error) {
      console.error('Keyword generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Fallback: Use seed keywords as manual keywords
      if (campaignData.seedKeywords.length > 0) {
        const seedKeywordsAsKeywords = createKeywordsFromSeeds(campaignData.seedKeywords);
        
        setCampaignData(prev => ({
          ...prev,
          generatedKeywords: seedKeywordsAsKeywords,
          selectedKeywords: seedKeywordsAsKeywords,
        }));

        notifications.warning('Using seed keywords as manual keywords', {
          title: 'Generation Failed',
          description: `Keyword generation failed. Using ${seedKeywordsAsKeywords.length} seed keywords instead. You can proceed to the next step.`
        });
      } else {
        notifications.error('Failed to generate keywords', {
          title: 'Generation Error',
          description: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create keywords from seed keywords
  const createKeywordsFromSeeds = (seeds: string[]): any[] => {
    const keywords: any[] = [];
    const timestamp = Date.now();

    seeds.forEach((seed, seedIndex) => {
      const baseText = seed.trim();
      if (!baseText || baseText.length < 3) return;

      // Apply match types based on selected keyword types
      if (campaignData.keywordTypes.broad) {
        keywords.push({
          id: `seed-${timestamp}-${seedIndex}-broad`,
          text: baseText,
          keyword: baseText,
          matchType: 'broad',
          volume: 'Medium',
          cpc: '$2.50',
          type: 'Seed Keyword',
        });
      }
      
      if (campaignData.keywordTypes.phrase) {
        keywords.push({
          id: `seed-${timestamp}-${seedIndex}-phrase`,
          text: `"${baseText}"`,
          keyword: `"${baseText}"`,
          matchType: 'phrase',
          volume: 'Medium',
          cpc: '$2.50',
          type: 'Seed Keyword',
        });
      }
      
      if (campaignData.keywordTypes.exact) {
        keywords.push({
          id: `seed-${timestamp}-${seedIndex}-exact`,
          text: `[${baseText}]`,
          keyword: `[${baseText}]`,
          matchType: 'exact',
          volume: 'Medium',
          cpc: '$2.50',
          type: 'Seed Keyword',
        });
      }
    });

    return keywords;
  };

  const handleKeywordTypeToggle = (type: string) => {
    setCampaignData(prev => ({
      ...prev,
      keywordTypes: {
        ...prev.keywordTypes,
        [type]: !prev.keywordTypes[type],
      }
    }));
  };

  // Filter keywords based on selected types and negative keywords
  const negativeList = campaignData.negativeKeywords.map(n => n.trim().toLowerCase()).filter(Boolean);
  const filteredKeywords = campaignData.generatedKeywords.filter(kw => {
    // Filter by match type
    if (kw.matchType === 'broad' && !campaignData.keywordTypes.broad) return false;
    if (kw.matchType === 'phrase' && !campaignData.keywordTypes.phrase) return false;
    if (kw.matchType === 'exact' && !campaignData.keywordTypes.exact) return false;
    if (kw.isNegative && !campaignData.keywordTypes.negative) return false;
    
    // Filter out keywords containing negative keywords
    const keywordText = (kw.text || kw.keyword || '').toLowerCase();
    if (negativeList.some(neg => keywordText.includes(neg))) return false;
    
    return true;
  });

  // Auto-fill functions for each step
  const handleAutoFillStep1 = () => {
    const randomUrl = generateURL();
    const randomName = generateCampaignName();
    setCampaignData(prev => ({
      ...prev,
      url: randomUrl,
      campaignName: randomName,
    }));
    notifications.success('Step 1 auto-filled', { title: 'Auto Fill Complete' });
  };

  const handleAutoFillStep2 = () => {
    const randomStructure = CAMPAIGN_STRUCTURES[Math.floor(Math.random() * CAMPAIGN_STRUCTURES.length)];
    setCampaignData(prev => ({
      ...prev,
      selectedStructure: randomStructure.id,
    }));
    notifications.success('Step 2 auto-filled', { title: 'Auto Fill Complete' });
  };

  const handleAutoFillStep3 = () => {
    // Generate relevant keywords based on detected data
    let seedKeywords: string[] = [];
    
    // Try to use detected intent/vertical to generate relevant keywords
    if (campaignData.vertical && campaignData.vertical !== 'General') {
      const verticalExamples: { [key: string]: string[] } = {
        'E-commerce': ['buy online', 'shop now', 'best deals', 'order now'],
        'Services': ['near me', 'services', 'professional', 'call now'],
        'Healthcare': ['healthcare', 'treatment', 'appointment', 'doctors near me'],
        'Legal': ['attorney', 'legal help', 'consultation', 'law firm'],
        'Real Estate': ['homes for sale', 'property', 'real estate', 'listings'],
      };
      seedKeywords = verticalExamples[campaignData.vertical] || [];
    }
    
    // If still empty, fall back to intent-based keywords
    if (seedKeywords.length === 0 && campaignData.intent) {
      const intentId = campaignData.intent.intentId;
      if (intentId === IntentId.CALL) {
        seedKeywords = ['near me', 'phone', 'call', 'contact'];
      } else if (intentId === IntentId.LEAD) {
        seedKeywords = ['quote', 'estimate', 'contact', 'information'];
      } else if (intentId === IntentId.PURCHASE) {
        seedKeywords = ['buy', 'shop', 'order', 'price'];
      } else {
        seedKeywords = ['service', 'help', 'information', 'provider'];
      }
    }
    
    // Last resort: use generic examples
    if (seedKeywords.length === 0) {
      seedKeywords = ['service', 'help', 'information', 'provider'];
    }
    
    setCampaignData(prev => ({
      ...prev,
      seedKeywords: seedKeywords.slice(0, 4),
      negativeKeywords: DEFAULT_NEGATIVE_KEYWORDS,
    }));
    notifications.success('Step 3 auto-filled', { title: 'Auto Fill Complete' });
  };

  // Fill Info button handler - adds 3-4 keywords each time
  const handleFillInfoKeywords = () => {
    // Pool of diverse keywords to choose from
    const keywordPool = [
      'plumber near me', 'emergency plumbing', 'drain cleaning', 'water heater repair',
      'airline number', 'contact airline', 'delta phone', 'united customer service',
      'electrician', 'hvac repair', 'roofing services', 'landscaping',
      'locksmith', 'appliance repair', 'handyman', 'carpet cleaning',
      'pest control', 'tree service', 'window cleaning', 'moving company',
      'auto repair', 'dentist', 'lawyer', 'accountant',
      'web design', 'seo services', 'marketing agency', 'it support'
    ];
    
    // Randomly select 3-4 keywords
    const count = Math.floor(Math.random() * 2) + 3; // 3 or 4
    const shuffled = [...keywordPool].sort(() => 0.5 - Math.random());
    const newKeywords = shuffled.slice(0, count);
    
    // Add to existing keywords (avoid duplicates)
    setCampaignData(prev => {
      const existing = prev.seedKeywords || [];
      const combined = [...existing, ...newKeywords];
      // Remove duplicates
      const unique = Array.from(new Set(combined.map(k => k.toLowerCase().trim())))
        .map(lower => {
          // Find original case from combined array
          return combined.find(k => k.toLowerCase().trim() === lower) || lower;
        });
      
      return {
        ...prev,
        seedKeywords: unique
      };
    });
    
    notifications.success(`Added ${count} keywords`, {
      title: 'Keywords Added',
      description: `Added: ${newKeywords.join(', ')}`
    });
  };

  const handleAutoFillStep5 = () => {
    const randomCountry = LOCATION_PRESETS.countries[Math.floor(Math.random() * LOCATION_PRESETS.countries.length)];
    const randomCities = LOCATION_PRESETS.cities.slice(0, Math.floor(Math.random() * 20) + 5);
    const randomZips = LOCATION_PRESETS.zipCodes.slice(0, Math.floor(Math.random() * 50) + 10);
    
    setCampaignData(prev => ({
      ...prev,
      targetCountry: randomCountry,
      locations: {
        ...prev.locations,
        cities: randomCities,
        zipCodes: randomZips,
      },
    }));
    notifications.success('Step 5 auto-filled', { title: 'Auto Fill Complete' });
  };

  // Auto-save draft functionality
  const autoSaveDraft = async () => {
    try {
      if (campaignData.campaignName || campaignData.url) {
        // Map step number to step name for display
        const stepNames = ['', 'Setup', 'Structure', 'Keywords', 'Ads', 'Locations', 'Extensions', 'Validate', 'Export'];
        const stepName = stepNames[currentStep] || 'Setup';
        
        await historyService.save('campaign', campaignData.campaignName || 'Draft Campaign', {
          name: campaignData.campaignName || 'Draft Campaign',
          url: campaignData.url,
          structure: campaignData.selectedStructure || 'skag',
          keywords: campaignData.selectedKeywords,
          ads: campaignData.ads,
          locations: campaignData.locations,
          intent: campaignData.intent,
          vertical: campaignData.vertical,
          cta: campaignData.cta,
          negativeKeywords: campaignData.negativeKeywords,
          adGroups: campaignData.adGroups,
          step: currentStep,
          stepName: stepName,
          createdAt: new Date().toISOString(),
        }, 'draft');
      }
    } catch (error) {
      // Only log unexpected errors - "Item not found" is now handled gracefully
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('Item not found') && !errorMessage.includes('not found')) {
        console.error('Auto-save failed:', error);
      }
      // Don't show error to user for auto-save failures
    }
  };

  // Generate ad groups based on campaign structure
  const generateAdGroupsFromKeywords = (keywords: any[], structureType: string): AdGroup[] => {
    const groups: AdGroup[] = [];
    
    if (structureType === 'skag') {
      // SKAG: One ad group per keyword (limit to 20)
      keywords.slice(0, 20).forEach((kw, idx) => {
        const baseText = (kw.text || kw.keyword || '').replace(/^["\[\]]|["\[\]]$/g, '').trim();
        groups.push({
          id: `ag-${idx + 1}`,
          name: baseText.substring(0, 50) || `Ad Group ${idx + 1}`,
          keywords: [kw], // Keep full keyword object with matchType
        });
      });
    } else if (structureType === 'stag') {
      // STAG: Group by theme (first word)
      const themeGroups: { [key: string]: any[] } = {};
      keywords.forEach(kw => {
        const baseText = (kw.text || kw.keyword || '').replace(/^["\[\]]|["\[\]]$/g, '').trim();
        const firstWord = baseText.split(' ')[0]?.toLowerCase() || 'general';
        if (!themeGroups[firstWord]) {
          themeGroups[firstWord] = [];
        }
        // Keep full keyword object to preserve matchType
        if (!themeGroups[firstWord].find((k: any) => (k.text || k.keyword) === (kw.text || kw.keyword))) {
          themeGroups[firstWord].push(kw);
        }
      });
      
      Object.entries(themeGroups).slice(0, 10).forEach(([theme, kwList], idx) => {
        groups.push({
          id: `ag-${idx + 1}`,
          name: `Ad Group ${idx + 1} - ${theme.charAt(0).toUpperCase() + theme.slice(1)}`,
          keywords: kwList.slice(0, 20), // Keep full keyword objects
        });
      });
    } else {
      // Default: Create 5-10 ad groups
      const groupSize = Math.ceil(keywords.length / 8);
      for (let i = 0; i < 8 && i * groupSize < keywords.length; i++) {
        const groupKeywords = keywords.slice(i * groupSize, (i + 1) * groupSize)
          .filter(Boolean);
        if (groupKeywords.length > 0) {
          groups.push({
            id: `ag-${i + 1}`,
            name: `Ad Group ${i + 1}`,
            keywords: groupKeywords, // Keep full keyword objects with matchType
          });
        }
      }
    }
    
    return groups;
  };

  // Step 4: Ads Generation - Generate 3 ads (RSA, DKI, Call)
  const handleGenerateAds = async () => {
    if (campaignData.selectedKeywords.length === 0) {
      notifications.error('Please select keywords first', { title: 'Keywords Required' });
      return;
    }

    setLoading(true);
    try {
      const keywordTexts = campaignData.selectedKeywords.map(k => k.text || k.keyword || k).slice(0, 10);
      const ads: any[] = [];

      // Extract business name from campaign name or URL
      let businessName = campaignData.campaignName || 'Your Business';
      if (businessName.length > 25) {
        businessName = businessName.split(' ')[0] || businessName.substring(0, 25);
      }
      
      // Extract domain name from URL for better business name
      if (campaignData.url) {
        try {
          const urlObj = new URL(campaignData.url.startsWith('http') ? campaignData.url : `https://${campaignData.url}`);
          const hostname = urlObj.hostname.replace('www.', '');
          const domainName = hostname.split('.')[0];
          if (domainName && domainName.length > 2 && domainName.length <= 25) {
            businessName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
          }
        } catch (e) {
          // If URL parsing fails, use campaign name
        }
      }
      
      // Determine industry from keywords if vertical is not set
      let industry = campaignData.vertical || 'general';
      if (industry === 'general' && keywordTexts.length > 0) {
        const firstKeyword = keywordTexts[0].toLowerCase();
        if (firstKeyword.includes('plumb') || firstKeyword.includes('plumber')) industry = 'plumbing';
        else if (firstKeyword.includes('electric') || firstKeyword.includes('electrician')) industry = 'electrical';
        else if (firstKeyword.includes('hvac') || firstKeyword.includes('heating') || firstKeyword.includes('cooling')) industry = 'hvac';
        else if (firstKeyword.includes('roof') || firstKeyword.includes('roofing')) industry = 'roofing';
        else if (firstKeyword.includes('airline') || firstKeyword.includes('flight')) industry = 'travel';
        else if (firstKeyword.includes('lawyer') || firstKeyword.includes('legal')) industry = 'legal';
        else if (firstKeyword.includes('dentist') || firstKeyword.includes('dental')) industry = 'dental';
        else if (firstKeyword.includes('doctor') || firstKeyword.includes('medical')) industry = 'medical';
        else if (firstKeyword.includes('restaurant') || firstKeyword.includes('food')) industry = 'food';
        else if (firstKeyword.includes('hotel') || firstKeyword.includes('travel')) industry = 'travel';
        else {
          industry = firstKeyword.split(' ')[0] || 'general';
        }
      }

      // Always generate 3 ads: RSA, DKI, and Call
      const adTypesToGenerate = ['rsa', 'dki', 'call'];
      
      for (const adType of adTypesToGenerate) {
        try {
          const adInput: AdGenerationInput = {
            keywords: keywordTexts,
            baseUrl: campaignData.url || undefined,
            adType: adType === 'rsa' ? 'RSA' : adType === 'dki' ? 'ETA' : 'CALL_ONLY',
            industry: industry,
            businessName: businessName,
            location: campaignData.locations?.cities?.[0] || campaignData.locations?.states?.[0] || undefined,
            filters: {
              matchType: campaignData.keywordTypes.phrase ? 'phrase' : campaignData.keywordTypes.exact ? 'exact' : 'broad',
              campaignStructure: (campaignData.selectedStructure?.toUpperCase() || 'SKAG') as 'SKAG' | 'STAG' | 'IBAG' | 'Alpha-Beta',
              uniqueSellingPoints: [],
              callToAction: campaignData.cta || undefined,
            },
          };

          const ad = generateAdsUtility(adInput);
          
          // Convert to our ad format
          if (adType === 'rsa' && 'headlines' in ad) {
            const rsa = ad as ResponsiveSearchAd;
            ads.push({
              id: `ad-${Date.now()}-${Math.random()}`,
              type: 'rsa',
              adType: 'RSA',
              headlines: rsa.headlines || [],
              descriptions: rsa.descriptions || [],
              displayPath: rsa.displayPath || [],
              finalUrl: rsa.finalUrl || campaignData.url || '',
              selected: false,
              extensions: [],
            });
          } else if (adType === 'dki' && 'headline1' in ad) {
            const dki = ad as ExpandedTextAd;
            ads.push({
              id: `ad-${Date.now()}-${Math.random()}`,
              type: 'dki',
              adType: 'DKI',
              headline1: dki.headline1 || '',
              headline2: dki.headline2 || '',
              headline3: dki.headline3 || '',
              description1: dki.description1 || '',
              description2: dki.description2 || '',
              displayPath: dki.displayPath || [],
              finalUrl: dki.finalUrl || campaignData.url || '',
              selected: false,
              extensions: [],
            });
          } else if (adType === 'call' && 'phoneNumber' in ad) {
            const call = ad as CallOnlyAd;
            ads.push({
              id: `ad-${Date.now()}-${Math.random()}`,
              type: 'call',
              adType: 'CallOnly',
              headline1: call.headline1 || '',
              headline2: call.headline2 || '',
              description1: call.description1 || '',
              description2: call.description2 || '',
              phoneNumber: call.phoneNumber || '',
              businessName: call.businessName || businessName,
              finalUrl: call.verificationUrl || campaignData.url || '',
              selected: false,
              extensions: [],
            });
          }
        } catch (adError) {
          console.error(`Error generating ${adType} ad:`, adError);
          // Continue with other ad types
        }
      }
      
      setCampaignData(prev => ({
        ...prev,
        ads: ads,
        adTypes: adTypesToGenerate, // Update ad types to match generated ads
      }));

      notifications.success(`Generated ${ads.length} ads successfully`, {
        title: 'Ads Generated',
        description: 'RSA, DKI, and Call ads have been created for all ad groups.'
      });
      
      // Auto-save draft
      await autoSaveDraft();
    } catch (error) {
      console.error('Ad generation error:', error);
      notifications.error('Failed to generate ads', {
        title: 'Generation Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract business name from URL
  const extractBusinessNameFromURL = () => {
    let businessName = campaignData.campaignName || 'Your Business';
    if (businessName.length > 25) {
      businessName = businessName.split(' ')[0] || businessName.substring(0, 25);
    }
    if (campaignData.url) {
      try {
        const urlObj = new URL(campaignData.url.startsWith('http') ? campaignData.url : `https://${campaignData.url}`);
        const hostname = urlObj.hostname.replace('www.', '');
        const domainName = hostname.split('.')[0];
        if (domainName && domainName.length > 2 && domainName.length <= 25) {
          businessName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
        }
      } catch (e) {}
    }
    return businessName;
  };

  // Add a single ad of specified type (only if under 3 ads total)
  const handleAddNewAd = async (adType: 'rsa' | 'dki' | 'call') => {
    // Check if we already have 3 ads
    if (campaignData.ads.length >= 3) {
      notifications.warning('Maximum 3 ads allowed per ad group', {
        title: 'Limit Reached',
        description: 'You can only have 3 ads. Please delete an existing ad to add a new one.'
      });
      return;
    }

    // Check if this ad type already exists
    const existingAdType = campaignData.ads.find(ad => 
      (ad.type === adType) || 
      (adType === 'rsa' && ad.adType === 'RSA') ||
      (adType === 'dki' && ad.adType === 'DKI') ||
      (adType === 'call' && (ad.adType === 'CallOnly' || ad.type === 'call'))
    );

    if (existingAdType) {
      notifications.info(`A ${adType.toUpperCase()} ad already exists. Maximum 3 ads allowed.`, {
        title: 'Ad Type Exists'
      });
      return;
    }

    if (campaignData.selectedKeywords.length === 0) {
      notifications.error('Please select keywords first', { title: 'Keywords Required' });
      return;
    }

    // For Call Only ads, show dialog to prompt for phone and business name
    if (adType === 'call') {
      const defaultBusinessName = extractBusinessNameFromURL();
      setCallAdBusinessName(defaultBusinessName);
      setCallAdPhone('');
      setShowCallAdDialog(true);
      return;
    }

    setLoading(true);
    try {
      const keywordTexts = campaignData.selectedKeywords.map(k => k.text || k.keyword || k).slice(0, 10);
      const businessName = extractBusinessNameFromURL();
      
      // Determine industry from keywords if vertical is not set
      let industry = campaignData.vertical || 'general';
      if (industry === 'general' && keywordTexts.length > 0) {
        const firstKeyword = keywordTexts[0].toLowerCase();
        if (firstKeyword.includes('plumb') || firstKeyword.includes('plumber')) industry = 'plumbing';
        else if (firstKeyword.includes('electric') || firstKeyword.includes('electrician')) industry = 'electrical';
        else if (firstKeyword.includes('hvac') || firstKeyword.includes('heating') || firstKeyword.includes('cooling')) industry = 'hvac';
        else if (firstKeyword.includes('roof') || firstKeyword.includes('roofing')) industry = 'roofing';
        else if (firstKeyword.includes('airline') || firstKeyword.includes('flight')) industry = 'travel';
        else if (firstKeyword.includes('lawyer') || firstKeyword.includes('legal')) industry = 'legal';
        else if (firstKeyword.includes('dentist') || firstKeyword.includes('dental')) industry = 'dental';
        else if (firstKeyword.includes('doctor') || firstKeyword.includes('medical')) industry = 'medical';
        else if (firstKeyword.includes('restaurant') || firstKeyword.includes('food')) industry = 'food';
        else if (firstKeyword.includes('hotel') || firstKeyword.includes('travel')) industry = 'travel';
        else {
          industry = firstKeyword.split(' ')[0] || 'general';
        }
      }
      
      let newAd: any = null;
      
      if (adType === 'rsa') {
        const adInput: AdGenerationInput = {
          keywords: keywordTexts,
          baseUrl: campaignData.url || undefined,
          adType: 'RSA',
          industry: industry,
          businessName: businessName,
          location: campaignData.locations?.cities?.[0] || campaignData.locations?.states?.[0] || undefined,
          filters: {
            matchType: campaignData.keywordTypes.phrase ? 'phrase' : campaignData.keywordTypes.exact ? 'exact' : 'broad',
            campaignStructure: (campaignData.selectedStructure?.toUpperCase() || 'STAG') as 'SKAG' | 'STAG' | 'IBAG' | 'Alpha-Beta',
            uniqueSellingPoints: [],
            callToAction: campaignData.cta || undefined,
          },
        };
        const ad = generateAdsUtility(adInput);
        const rsa = ad as ResponsiveSearchAd;
        newAd = {
          id: `ad-${Date.now()}-${Math.random()}`,
          type: 'rsa',
          adType: 'RSA',
          headlines: rsa.headlines || [],
          descriptions: rsa.descriptions || [],
          displayPath: rsa.displayPath || [],
          finalUrl: rsa.finalUrl || campaignData.url || '',
          selected: false,
          extensions: [],
        };
      } else if (adType === 'dki') {
        // Use AI-powered DKI generation
        notifications.info('Generating AI-powered DKI ad...', { title: 'AI Generation' });
        const dkiResult = await generateDKIAdWithAI({
          keywords: keywordTexts,
          industry: industry,
          businessName: businessName,
          url: campaignData.url || undefined,
          location: campaignData.locations?.cities?.[0] || campaignData.locations?.states?.[0] || undefined,
        });
        
        const industryPath = industry.toLowerCase().slice(0, 15);
        newAd = {
          id: `ad-${Date.now()}-${Math.random()}`,
          type: 'dki',
          adType: 'DKI',
          headline1: dkiResult.headline1 || '',
          headline2: dkiResult.headline2 || '',
          headline3: dkiResult.headline3 || '',
          description1: dkiResult.description1 || '',
          description2: dkiResult.description2 || '',
          displayPath: [industryPath, 'services'].slice(0, 2),
          finalUrl: campaignData.url || '',
          selected: false,
          extensions: [],
        };
      }

      if (newAd) {
        setCampaignData(prev => ({
          ...prev,
          ads: [...prev.ads, newAd],
        }));

        notifications.success(`${adType.toUpperCase()} ad added successfully`, {
          title: 'Ad Added',
          description: `${campaignData.ads.length + 1} / 3 ads created`
        });
        
        await autoSaveDraft();
      } else {
        throw new Error(`Failed to generate ${adType} ad`);
      }
    } catch (error) {
      console.error(`Error generating ${adType} ad:`, error);
      notifications.error(`Failed to generate ${adType.toUpperCase()} ad`, {
        title: 'Generation Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Call Only ad creation after dialog submission
  const handleCreateCallAd = async () => {
    setShowCallAdDialog(false);
    setLoading(true);
    
    try {
      const keywordTexts = campaignData.selectedKeywords.map(k => k.text || k.keyword || k).slice(0, 10);
      const businessName = callAdBusinessName || extractBusinessNameFromURL();
      const phoneNumber = callAdPhone || '(555) 123-4567';
      
      let industry = campaignData.vertical || 'general';
      if (industry === 'general' && keywordTexts.length > 0) {
        const firstKeyword = keywordTexts[0].toLowerCase();
        if (firstKeyword.includes('plumb') || firstKeyword.includes('plumber')) industry = 'plumbing';
        else if (firstKeyword.includes('electric') || firstKeyword.includes('electrician')) industry = 'electrical';
        else if (firstKeyword.includes('hvac') || firstKeyword.includes('heating') || firstKeyword.includes('cooling')) industry = 'hvac';
        else {
          industry = firstKeyword.split(' ')[0] || 'general';
        }
      }
      
      const adInput: AdGenerationInput = {
        keywords: keywordTexts,
        baseUrl: campaignData.url || undefined,
        adType: 'CALL_ONLY',
        industry: industry,
        businessName: businessName,
        location: campaignData.locations?.cities?.[0] || campaignData.locations?.states?.[0] || undefined,
        filters: {
          matchType: campaignData.keywordTypes.phrase ? 'phrase' : campaignData.keywordTypes.exact ? 'exact' : 'broad',
          campaignStructure: (campaignData.selectedStructure?.toUpperCase() || 'STAG') as 'SKAG' | 'STAG' | 'IBAG' | 'Alpha-Beta',
          uniqueSellingPoints: [],
          callToAction: campaignData.cta || undefined,
        },
      };

      const ad = generateAdsUtility(adInput);
      const call = ad as CallOnlyAd;
      
      const newAd = {
        id: `ad-${Date.now()}-${Math.random()}`,
        type: 'call',
        adType: 'CallOnly',
        headline1: call.headline1 || '',
        headline2: call.headline2 || '',
        description1: call.description1 || '',
        description2: call.description2 || '',
        phoneNumber: phoneNumber,
        businessName: businessName.substring(0, 25),
        finalUrl: call.verificationUrl || campaignData.url || '',
        selected: false,
        extensions: [],
      };

      setCampaignData(prev => ({
        ...prev,
        ads: [...prev.ads, newAd],
      }));

      notifications.success('Call Only ad added successfully', {
        title: 'Ad Added',
        description: `Phone: ${phoneNumber} | Business: ${businessName}`
      });
      
      await autoSaveDraft();
    } catch (error) {
      console.error('Error generating Call Only ad:', error);
      notifications.error('Failed to generate Call Only ad', {
        title: 'Generation Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
      setCallAdPhone('');
      setCallAdBusinessName('');
    }
  };

  const handleEditAd = (adId: string) => {
    // Toggle edit mode - if already editing this ad, cancel edit
    if (editingAdId === adId) {
      setEditingAdId(null);
    } else {
      setEditingAdId(adId);
    }
  };

  const updateAdField = (adId: string, field: string, value: any) => {
    // Apply Google Ads character limits
    let processedValue = value;
    if (field.startsWith('headline')) {
      // Headlines: max 30 characters
      if (typeof value === 'string' && value.length > 30) {
        processedValue = value.substring(0, 30);
        notifications.warning(`Headline truncated to 30 characters (Google Ads limit)`, {
          title: 'Character Limit',
          description: 'Headlines must be 30 characters or less.',
          duration: 3000
        });
      }
    } else if (field.startsWith('description')) {
      // Descriptions: max 90 characters
      if (typeof value === 'string' && value.length > 90) {
        processedValue = value.substring(0, 90);
        notifications.warning(`Description truncated to 90 characters (Google Ads limit)`, {
          title: 'Character Limit',
          description: 'Descriptions must be 90 characters or less.',
          duration: 3000
        });
      }
    } else if (field === 'path1' || field === 'path2' || (field === 'displayPath' && Array.isArray(value))) {
      // Paths: max 15 characters
      if (field === 'displayPath' && Array.isArray(value)) {
        processedValue = value.map((path: string) => 
          typeof path === 'string' && path.length > 15 ? path.substring(0, 15) : path
        );
      } else if (typeof value === 'string' && value.length > 15) {
        processedValue = value.substring(0, 15);
        notifications.warning(`Path truncated to 15 characters (Google Ads limit)`, {
          title: 'Character Limit',
          description: 'Display URL paths must be 15 characters or less.',
          duration: 3000
        });
      }
    } else if (field === 'headlines' && Array.isArray(value)) {
      // RSA headlines array: each headline max 30 characters
      processedValue = value.map((h: string) => 
        typeof h === 'string' && h.length > 30 ? h.substring(0, 30) : h
      );
    } else if (field === 'descriptions' && Array.isArray(value)) {
      // RSA descriptions array: each description max 90 characters
      processedValue = value.map((d: string) => 
        typeof d === 'string' && d.length > 90 ? d.substring(0, 90) : d
      );
    }
    
    setCampaignData(prev => ({
      ...prev,
      ads: prev.ads.map(ad => 
        ad.id === adId ? { ...ad, [field]: processedValue } : ad
      )
    }));
  };

  const handleSaveAd = (adId: string) => {
    const ad = campaignData.ads.find(a => a.id === adId);
    if (!ad) {
      notifications.error('Ad not found', {
        title: 'Error',
        description: 'The ad you are trying to save could not be found.',
      });
      return;
    }

    // Validate required fields and Google Ads character limits
    const errors: string[] = [];
    
    if (ad.type === 'rsa' || ad.adType === 'RSA') {
      // RSA validation
      if (ad.headlines && Array.isArray(ad.headlines)) {
        ad.headlines.forEach((headline: string, idx: number) => {
          if (headline && headline.length > 30) {
            errors.push(`Headline ${idx + 1} exceeds 30 characters (${headline.length}/30)`);
          }
        });
      }
      if (ad.descriptions && Array.isArray(ad.descriptions)) {
        ad.descriptions.forEach((desc: string, idx: number) => {
          if (desc && desc.length > 90) {
            errors.push(`Description ${idx + 1} exceeds 90 characters (${desc.length}/90)`);
          }
        });
      }
    } else if (ad.type === 'dki' || ad.adType === 'DKI') {
      // DKI validation
      if (!ad.headline1 || ad.headline1.trim() === '') {
        errors.push('Headline 1 is required');
      } else if (ad.headline1.length > 30) {
        errors.push(`Headline 1 exceeds 30 characters (${ad.headline1.length}/30)`);
      }
      if (!ad.headline2 || ad.headline2.trim() === '') {
        errors.push('Headline 2 is required');
      } else if (ad.headline2.length > 30) {
        errors.push(`Headline 2 exceeds 30 characters (${ad.headline2.length}/30)`);
      }
      if (ad.headline3 && ad.headline3.length > 30) {
        errors.push(`Headline 3 exceeds 30 characters (${ad.headline3.length}/30)`);
      }
      if (!ad.description1 || ad.description1.trim() === '') {
        errors.push('Description 1 is required');
      } else if (ad.description1.length > 90) {
        errors.push(`Description 1 exceeds 90 characters (${ad.description1.length}/90)`);
      }
      if (ad.description2 && ad.description2.length > 90) {
        errors.push(`Description 2 exceeds 90 characters (${ad.description2.length}/90)`);
      }
    } else if (ad.type === 'call' || ad.adType === 'CallOnly') {
      // Call-Only validation
      if (!ad.headline1 || ad.headline1.trim() === '') {
        errors.push('Headline 1 is required');
      } else if (ad.headline1.length > 30) {
        errors.push(`Headline 1 exceeds 30 characters (${ad.headline1.length}/30)`);
      }
      if (!ad.headline2 || ad.headline2.trim() === '') {
        errors.push('Headline 2 is required');
      } else if (ad.headline2.length > 30) {
        errors.push(`Headline 2 exceeds 30 characters (${ad.headline2.length}/30)`);
      }
      if (!ad.description1 || ad.description1.trim() === '') {
        errors.push('Description 1 is required');
      } else if (ad.description1.length > 90) {
        errors.push(`Description 1 exceeds 90 characters (${ad.description1.length}/90)`);
      }
      if (!ad.description2 || ad.description2.trim() === '') {
        errors.push('Description 2 is required');
      } else if (ad.description2.length > 90) {
        errors.push(`Description 2 exceeds 90 characters (${ad.description2.length}/90)`);
      }
      if (!ad.phoneNumber || ad.phoneNumber.trim() === '') {
        errors.push('Phone number is required');
      }
      if (!ad.businessName || ad.businessName.trim() === '') {
        errors.push('Business name is required');
      }
    }

    if (errors.length > 0) {
      notifications.error(`Please fix the following errors:\n\n${errors.join('\n')}`, {
        title: 'Validation Error',
        description: 'All fields must comply with Google Ads character limits.',
        priority: 'high',
      });
      return;
    }

    setEditingAdId(null);
    notifications.success('Changes saved successfully', {
      title: 'Ad Updated',
      description: 'Your ad changes have been saved.',
    });
  };

  const handleCancelEdit = () => {
    setEditingAdId(null);
  };

  const handleDuplicateAd = (adId: string) => {
    const adToDuplicate = campaignData.ads.find(ad => ad.id === adId);
    if (!adToDuplicate) {
      notifications.error('Ad not found', { title: 'Error' });
      return;
    }

    if (campaignData.ads.length >= 3) {
      notifications.warning('Maximum 3 ads allowed', { title: 'Limit Reached' });
      return;
    }

    const duplicatedAd = {
      ...adToDuplicate,
      id: `ad-${Date.now()}-${Math.random()}`,
      extensions: adToDuplicate.extensions ? [...adToDuplicate.extensions] : [],
    };

    setCampaignData(prev => ({
      ...prev,
      ads: [...prev.ads, duplicatedAd],
    }));

    notifications.success('Ad duplicated', { title: 'Duplicated' });
  };

  const handleDeleteAd = (adId: string) => {
    setCampaignData(prev => ({
      ...prev,
      ads: prev.ads.filter(ad => ad.id !== adId),
    }));
    notifications.success('Ad deleted', { title: 'Deleted' });
  };

  const handleToggleAdSelection = (adId: string) => {
    setCampaignData(prev => ({
      ...prev,
      ads: prev.ads.map(ad => 
        ad.id === adId ? { ...ad, selected: !ad.selected } : ad
      ),
    }));
  };

  const handleAddExtension = async (adId: string, extensionType: string) => {
    try {
      setLoading(true);
      
      // Import extension generator
      const { generateExtensionsWithAI } = await import('../utils/extensionGeneratorAI');
      
      // Generate AI-based extension
      const extensionData = await generateExtensionsWithAI({
        url: campaignData.url || '',
        keywords: campaignData.seedKeywords || [],
        vertical: campaignData.vertical || 'General',
        intent: campaignData.intent?.intentLabel || undefined,
        cta: campaignData.cta || undefined,
        businessName: campaignData.campaignName || 'Business',
        ads: campaignData.ads,
      }, extensionType);
      
      setCampaignData(prev => ({
        ...prev,
        ads: prev.ads.map(ad => {
          if (ad.id === adId) {
            const currentExtensions = Array.isArray(ad.extensions) ? ad.extensions : [];
            const extensionExists = currentExtensions.some((ext: any) => ext.type === extensionType);
            if (extensionExists) {
              return ad;
            }
            
            const newExtension: any = {
              id: `ext-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: extensionType,
              extensionType: extensionType,
              label: extensionType.charAt(0).toUpperCase() + extensionType.slice(1).replace(/([A-Z])/g, ' $1'),
            };
            
            // Apply AI-generated data
            if (extensionType === 'snippet' && extensionData.header) {
              newExtension.header = extensionData.header;
              newExtension.values = extensionData.values || [];
              newExtension.text = `${newExtension.header}: ${newExtension.values.join(', ')}`;
            } else if (extensionType === 'callout' && extensionData.callouts) {
              newExtension.callouts = extensionData.callouts;
              newExtension.text = newExtension.callouts.join(', ');
            } else if (extensionType === 'sitelink' && extensionData.sitelinks) {
              newExtension.sitelinks = extensionData.sitelinks.map((sl: any) => ({
                text: sl.text || sl.linkText || 'Link',
                description: sl.description || '',
                url: campaignData.url || ''
              }));
              newExtension.text = newExtension.sitelinks.map((sl: any) => sl.text).join(', ');
            } else if (extensionType === 'call' && extensionData.phone) {
              newExtension.phone = extensionData.phone;
              newExtension.phoneNumber = extensionData.phone;
              newExtension.countryCode = 'US';
              newExtension.text = newExtension.phone;
            } else if (extensionType === 'message' && extensionData.message) {
              newExtension.message = extensionData.message;
              newExtension.text = newExtension.message;
            } else if (extensionType === 'promotion' && extensionData.promotionText) {
              newExtension.promotionText = extensionData.promotionText;
              newExtension.text = newExtension.promotionText;
            } else {
              newExtension.text = extensionData.text || 'Extension';
            }
            
            return {
              ...ad,
              extensions: [...currentExtensions, newExtension],
            };
          }
          return ad;
        }),
      }));
      
      notifications.success('AI-generated extension added', { title: 'Extension Added' });
    } catch (error) {
      console.error('Error adding extension:', error);
      notifications.error('Failed to generate extension', { title: 'Extension Error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExtension = (adId: string, extensionId: string) => {
    setCampaignData(prev => ({
        ...prev,
        ads: prev.ads.map(ad => {
          if (ad.id === adId) {
            return {
              ...ad,
            extensions: (ad.extensions || []).filter((ext: any) => ext.id !== extensionId),
            };
          }
          return ad;
        }),
    }));
    notifications.success('Extension removed', { title: 'Removed' });
  };

  const handleAddExtensionToAllAds = (extensionType: string) => {
    if (campaignData.ads.length === 0) {
      notifications.warning('Please create at least one ad before adding extensions', {
        title: 'No Ads Found'
      });
      return;
    }

    setCampaignData(prev => {
      const updatedAds = prev.ads.map((ad, index) => {
        // Ensure extensions array exists
        const currentExtensions = Array.isArray(ad.extensions) ? ad.extensions : [];
        
        // Check if this extension type already exists for this ad
        const extensionExists = currentExtensions.some((ext: any) => ext.type === extensionType);
        if (extensionExists) {
          // Extension already exists, don't add duplicate
          return ad;
        }
        
        // Create unique extension ID
        const extensionId = `ext-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create extension with proper structure based on type
        const newExtension: any = {
          id: extensionId,
          type: extensionType,
          extensionType: extensionType,
          label: extensionType.charAt(0).toUpperCase() + extensionType.slice(1).replace(/([A-Z])/g, ' $1'),
        };
        
        // Add type-specific default values
        switch (extensionType) {
          case 'snippet':
            newExtension.header = 'Types';
            newExtension.values = ['Service 1', 'Service 2', 'Service 3'];
            newExtension.text = `Types: ${newExtension.values.join(', ')}`;
            break;
          case 'callout':
            newExtension.callouts = ['24/7 Support', 'Free Consultation', 'Expert Service'];
            newExtension.text = newExtension.callouts.join(', ');
            break;
          case 'sitelink':
            newExtension.sitelinks = [
              { text: 'Contact Us', description: 'Get in touch', url: campaignData.url || '' },
              { text: 'Services', description: 'Our services', url: campaignData.url || '' }
            ];
            newExtension.text = newExtension.sitelinks.map((sl: any) => sl.text).join(', ');
            break;
          case 'call':
            newExtension.phone = '(555) 123-4567';
            newExtension.phoneNumber = '(555) 123-4567';
            newExtension.countryCode = 'US';
            newExtension.text = newExtension.phone;
            break;
          case 'price':
            newExtension.priceQualifier = 'From';
            newExtension.price = '$99';
            newExtension.currency = 'USD';
            newExtension.unit = 'per service';
            newExtension.text = `${newExtension.priceQualifier} ${newExtension.price} ${newExtension.unit}`;
            break;
          default:
            newExtension.text = newExtension.label;
        }
        
        return {
          ...ad,
          extensions: [...currentExtensions, newExtension],
        };
      });
      
        return {
        ...prev,
        ads: updatedAds,
      };
    });

    // Get extension label for notification
    const extensionLabel = extensionType.charAt(0).toUpperCase() + extensionType.slice(1).replace(/([A-Z])/g, ' $1');
    notifications.success(`Added ${extensionLabel} extension to all ${campaignData.ads.length} ad(s)`, {
      title: 'Extension Added'
    });
  };


  // Step 6: CSV Generation & Validation - Using Master 183-Column Format
  const handleGenerateCSV = async () => {
    setLoading(true);
    try {
      const campaignNameValue = campaignData.campaignName || 'Campaign 1';
      
      // Import the new V5 Master CSV exporter with all 183 columns
      const { generateMasterCSV, convertToV5Format } = await import('../utils/googleAdsEditorCSVExporterV5');
      
      // Collect all extensions from ads - properly handle nested structures
      const sitelinks: any[] = [];
      const callouts: any[] = [];
      const snippets: any[] = [];
      const seenSitelinks = new Set<string>();
      const seenCallouts = new Set<string>();
      const seenSnippets = new Set<string>();
      
      (campaignData.ads || []).forEach((ad: any) => {
        if (ad.extensions && Array.isArray(ad.extensions)) {
          ad.extensions.forEach((ext: any) => {
            if (ext.type === 'sitelink') {
              // Handle nested sitelinks array structure from ADD ALL button
              if (ext.sitelinks && Array.isArray(ext.sitelinks)) {
                ext.sitelinks.forEach((sl: any) => {
                  const slText = sl.text || sl.linkText || '';
                  if (slText && !seenSitelinks.has(slText)) {
                    seenSitelinks.add(slText);
                    sitelinks.push({
                      text: slText,
                      description1: sl.description || sl.description1 || '',
                      description2: sl.description2 || '',
                      finalUrl: sl.url || sl.finalUrl || campaignData.url || '',
                      status: 'Enabled'
                    });
                  }
                });
              } else {
                // Handle flat structure
                const slText = ext.text || ext.linkText || '';
                if (slText && !seenSitelinks.has(slText)) {
                  seenSitelinks.add(slText);
                  sitelinks.push({
                    text: slText,
                    description1: ext.description1 || ext.descriptionLine1 || '',
                    description2: ext.description2 || ext.descriptionLine2 || '',
                    finalUrl: ext.finalUrl || ext.url || campaignData.url || '',
                    status: 'Enabled'
                  });
                }
              }
            } else if (ext.type === 'callout') {
              // Handle nested callouts array structure from ADD ALL button
              if (ext.callouts && Array.isArray(ext.callouts)) {
                ext.callouts.forEach((calloutText: string) => {
                  if (calloutText && !seenCallouts.has(calloutText)) {
                    seenCallouts.add(calloutText);
                    callouts.push({
                      text: calloutText,
                      status: 'Enabled'
                    });
                  }
                });
              } else if (ext.text && !seenCallouts.has(ext.text)) {
                // Handle flat structure
                seenCallouts.add(ext.text);
                callouts.push({
                  text: ext.text,
                  status: 'Enabled'
                });
              }
            } else if (ext.type === 'snippet') {
              // Handle snippet with header and values
              const snippetKey = `${ext.header || ''}:${Array.isArray(ext.values) ? ext.values.join(',') : ext.values || ''}`;
              if (!seenSnippets.has(snippetKey)) {
                seenSnippets.add(snippetKey);
                snippets.push({
                  header: ext.header || 'Types',
                  values: Array.isArray(ext.values) ? ext.values.join(', ') : (ext.values || ''),
                  status: 'Enabled'
                });
              }
            }
          });
        }
      });
      
      console.log('📦 Extensions collected for CSV:', { 
        sitelinks: sitelinks.length, 
        callouts: callouts.length, 
        snippets: snippets.length 
      });
      
      // Build the V5 campaign data structure with all 183 columns
      const v5CampaignData: any = {
        campaignName: campaignNameValue,
        dailyBudget: 100,
        campaignType: 'Search',
        bidStrategy: 'Maximize Conversions',
        networks: 'Google search',
        startDate: campaignData.startDate || '',
        endDate: campaignData.endDate || '',
        status: 'Enabled',
        url: campaignData.url || '',
        adGroups: (campaignData.adGroups || []).map((group: any) => ({
          name: group.name || 'Ad Group',
          maxCpc: 2.00,
          status: 'Enabled',
          keywords: (group.keywords || []).map((kw: any) => {
            const kwText = typeof kw === 'string' ? kw : (kw.text || kw.keyword || '');
            let matchType: 'Broad' | 'Phrase' | 'Exact' = 'Broad';
            if (typeof kw === 'object' && kw.matchType) {
              matchType = kw.matchType;
            } else if (typeof kw === 'string') {
              if (kw.startsWith('[') && kw.endsWith(']')) matchType = 'Exact';
              else if (kw.startsWith('"') && kw.endsWith('"')) matchType = 'Phrase';
            }
            return {
              text: kwText.replace(/^\[|\]$|^"|"$/g, ''),
              matchType,
              status: 'Enabled',
              finalUrl: campaignData.url || ''
            };
          }),
          ads: []
        })),
        negativeKeywords: campaignData.negativeKeywords || [],
        locations: {
          countries: campaignData.locations?.countries || [],
          states: campaignData.locations?.states || [],
          cities: campaignData.locations?.cities || [],
          zipCodes: campaignData.locations?.zipCodes || [],
          countryCode: campaignData.targetCountry === 'United States' ? 'US' : 
                       campaignData.targetCountry === 'Canada' ? 'CA' :
                       campaignData.targetCountry === 'United Kingdom' ? 'GB' :
                       campaignData.targetCountry === 'Australia' ? 'AU' : 'US'
        },
        sitelinks: sitelinks.slice(0, 4),
        callouts: callouts.slice(0, 4),
        snippets: snippets.slice(0, 2)
      };
      
      // Add ads to their respective ad groups
      (campaignData.ads || []).forEach((ad: any) => {
        const adGroupName = ad.adGroup || 'Ad Group 1';
        let targetGroup = v5CampaignData.adGroups.find((ag: any) => ag.name === adGroupName);
        
        if (!targetGroup && v5CampaignData.adGroups.length > 0) {
          targetGroup = v5CampaignData.adGroups[0];
        }
        
        if (targetGroup) {
          targetGroup.ads.push({
            type: ad.type === 'call_only' ? 'CallOnly' : 
                  ad.type === 'dki' ? 'DKI' : 'RSA',
            headlines: [
              ad.headline1 || '',
              ad.headline2 || '',
              ad.headline3 || '',
              ad.headline4 || '',
              ad.headline5 || ''
            ].filter((h: string) => h),
            descriptions: [
              ad.description1 || '',
              ad.description2 || ''
            ].filter((d: string) => d),
            path1: ad.path1 || '',
            path2: ad.path2 || '',
            finalUrl: ad.finalUrl || campaignData.url || '',
            phoneNumber: ad.phoneNumber || '',
            verificationUrl: ad.verificationUrl || '',
            businessName: ad.businessName || ''
          });
        }
      });
      
      // If no specific locations, add the target country
      if (!v5CampaignData.locations?.countries?.length && 
          !v5CampaignData.locations?.states?.length && 
          !v5CampaignData.locations?.cities?.length && 
          !v5CampaignData.locations?.zipCodes?.length) {
        v5CampaignData.locations = {
          ...v5CampaignData.locations,
          countries: [campaignData.targetCountry || 'United States']
        };
      }
      
      // Generate the master CSV with all 183 columns
      const csvContent = generateMasterCSV(v5CampaignData);
      
      // Store CSV data in state (already includes BOM)
      setCampaignData(prev => ({
        ...prev,
        csvData: csvContent,
        csvErrors: [],
      }));
      
      notifications.success('Master CSV generated with 183 columns!', {
        title: 'CSV Ready',
        description: `Your campaign "${campaignNameValue}" is ready for Google Ads Editor import.`
      });
    } catch (error) {
      console.error('CSV generation error:', error);
      notifications.error('Failed to generate CSV', {
        title: 'Generation Error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate export statistics from campaign data (same source as success page)
  const getExportStatistics = () => {
    if (!campaignData.csvData) return null;
    
    try {
      // Parse the CSV only to get total rows count
      const csvText = campaignData.csvData.replace(/^\uFEFF/, ''); // Remove BOM
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      const totalRows = parsed.data?.length || 0;
      
      // Calculate locations count from campaignData
      const { cities, zipCodes, states, countries } = campaignData.locations;
      const locationsCount = cities.length + zipCodes.length + states.length + countries.length;
      
      // Count total ads across all ad groups
      const totalAds = campaignData.adGroups.reduce((sum, group) => {
        return sum + (group.ads?.length || 0);
      }, 0) || campaignData.ads.length;
      
      // Count total keywords across all ad groups
      const totalKeywords = campaignData.adGroups.reduce((sum, group) => {
        return sum + (group.keywords?.length || 0);
      }, 0) || campaignData.selectedKeywords.length;
      
      // Count extensions from ads
      const totalExtensions = campaignData.ads.reduce((sum, ad) => {
        return sum + (ad.extensions?.length || 0);
      }, 0);
      
      const stats = {
        campaigns: 1,
        adGroups: campaignData.adGroups.length,
        keywords: totalKeywords,
        negativeKeywords: campaignData.negativeKeywords.length,
        ads: totalAds,
        extensions: totalExtensions,
        locations: locationsCount || 1, // At least 1 for country-level targeting
        totalRows: totalRows,
      };
      
      return stats;
    } catch (error) {
      console.error('Error calculating export statistics:', error);
      return null;
    }
  };

  const handleDownloadCSV = () => {
    if (!campaignData.csvData) {
      notifications.warning('CSV not generated yet', {
        title: 'No CSV Data',
        description: 'Please generate CSV first before downloading.'
      });
        return;
      }
    
    // Show export brief dialog
    setShowExportDialog(true);
  };

  const confirmDownloadCSV = () => {
    if (!campaignData.csvData) return;
    
    const filename = `${(campaignData.campaignName || 'campaign').replace(/[^a-z0-9]/gi, '_')}_google_ads_editor_${new Date().toISOString().split('T')[0]}.csv`;
    const blob = new Blob([campaignData.csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    setShowExportDialog(false);
    
    // Redirect to dashboard
    setTimeout(() => {
      const event = new CustomEvent('navigate', { detail: { tab: 'dashboard' } });
      window.dispatchEvent(event);
      if (window.location.hash) {
        window.location.hash = '#dashboard';
      }
    }, 1000);
  };

  const handleSaveCampaign = async () => {
    setLoading(true);
    try {
      // Generate CSV first
      await handleGenerateCSV();

      await historyService.save('campaign', campaignData.campaignName, {
        name: campaignData.campaignName,
        url: campaignData.url,
        structure: campaignData.selectedStructure || 'stag',
        keywords: campaignData.selectedKeywords,
        ads: campaignData.ads,
        locations: campaignData.locations,
        intent: campaignData.intent,
        vertical: campaignData.vertical,
        cta: campaignData.cta,
        negativeKeywords: campaignData.negativeKeywords,
        adGroups: campaignData.adGroups,
        csvData: campaignData.csvData,
        createdAt: new Date().toISOString(),
      }, 'completed');

      setCampaignSaved(true);
      setCurrentStep(7); // Show success screen
    } catch (error) {
      console.error('Save error:', error);
      notifications.error('Failed to save campaign', {
        title: 'Save Error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Render functions for each step
  const renderStep1 = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Enter Your Website URL</h2>
        <p className="text-slate-600">AI will analyze your website to identify intent, CTA, and vertical</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Enter your campaign name and landing page URL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="campaignName" className="text-sm font-medium text-slate-700 mb-1.5 block">Campaign Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="campaignName"
                type="text"
                placeholder="Campaign-Search-Dec 12, 2025 4:30 PM"
                value={campaignData.campaignName}
                onChange={(e) => setCampaignData(prev => ({ ...prev, campaignName: e.target.value }))}
                disabled={!editingCampaignName}
                className={`flex-1 ${!editingCampaignName ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setEditingCampaignName(!editingCampaignName)}
                className={`shrink-0 ${editingCampaignName ? 'border-indigo-500 text-indigo-600' : 'text-slate-500'}`}
                title={editingCampaignName ? 'Done editing' : 'Edit campaign name'}
              >
                {editingCampaignName ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Auto-generated name. Click edit icon to customize.</p>
          </div>
          <div>
            <Label htmlFor="websiteUrl" className="text-sm font-medium text-slate-700 mb-1.5 block">Website URL</Label>
            <div className="flex gap-4">
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://www.example.com"
                value={campaignData.url}
                onChange={(e) => setCampaignData(prev => ({ ...prev, url: e.target.value }))}
                className="flex-1"
              />
              <Button onClick={handleUrlSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Analyze
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Analysis Logs - Terminal Style */}
      {(isAnalyzing || analysisLogs.length > 0) && (
        <Card className="mb-6 border-slate-700 bg-slate-900 shadow-xl">
          <CardHeader className="pb-2 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-slate-400 text-sm font-mono">Website Analysis Console</span>
              </div>
              {isAnalyzing && (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-green-400 animate-spin" />
                  <span className="text-green-400 text-xs font-mono">Analyzing...</span>
                </div>
              )}
              {!isAnalyzing && analysisLogs.length > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 text-xs font-mono">Complete</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              ref={analysisLogsRef}
              className="font-mono text-sm max-h-80 overflow-y-auto p-4 space-y-1"
              style={{ scrollBehavior: 'smooth' }}
            >
              {analysisLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-slate-500 text-xs shrink-0">[{log.timestamp}]</span>
                  <span className={`
                    ${log.type === 'step' ? 'text-cyan-400 font-semibold' : ''}
                    ${log.type === 'success' ? 'text-green-400' : ''}
                    ${log.type === 'data' ? 'text-yellow-300' : ''}
                    ${log.type === 'ai' ? 'text-purple-400' : ''}
                    ${log.type === 'info' ? 'text-slate-400' : ''}
                  `}>
                    {log.type === 'step' && <span className="text-cyan-500 mr-1">{'>'}</span>}
                    {log.type === 'success' && <span className="text-green-500 mr-1">✓</span>}
                    {log.type === 'data' && <span className="text-yellow-500 mr-1">•</span>}
                    {log.type === 'ai' && <span className="text-purple-500 mr-1">★</span>}
                    {log.type === 'info' && <span className="text-slate-500 mr-1">→</span>}
                    {log.message}
                  </span>
                </div>
              ))}
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-green-400">
                  <span className="animate-pulse">_</span>
                </div>
              )}
            </div>
            
            {/* Next Button - Shows after complete */}
            {!isAnalyzing && campaignData.intent && (
              <div className="border-t border-slate-700 p-4 bg-slate-800/50">
                <Button 
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold"
                >
                  Next: Select Campaign Structure →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Select Campaign Structure</h2>
        <p className="text-slate-600">AI has ranked the best structures for your vertical. Choose the one that fits your needs.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
        {CAMPAIGN_STRUCTURES.map((structure, idx) => {
          const ranking = campaignData.structureRankings.findIndex(r => r.id === structure.id);
          const isRecommended = ranking === 0 || ranking === 1 || ranking === 2;
          const rankLabel = ranking === 0 ? 'Best' : ranking === 1 ? '2nd' : ranking === 2 ? '3rd' : null;
          const isSelected = campaignData.selectedStructure === structure.id;
          const Icon = structure.icon;

          return (
            <div key={structure.id} className="relative group">
              <Card
                className={`cursor-pointer transition-all p-2 ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 bg-indigo-50'
                    : 'hover:shadow-md hover:border-indigo-200'
                }`}
                onClick={() => handleStructureSelect(structure.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-sm font-semibold text-slate-800 truncate">{structure.name}</span>
                  </div>
                  {isRecommended && rankLabel && (
                    <Badge variant={ranking === 0 ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                      {rankLabel}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{structure.description}</p>
                {isSelected && (
                  <div className="flex items-center gap-1 text-indigo-600 mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="text-xs font-medium">Selected</span>
                  </div>
                )}
              </Card>
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStructureForDiagram({ id: structure.id, name: structure.name });
                  setShowFlowDiagram(true);
                }}
              >
                View Structure
              </Button>
            </div>
          );
        })}
      </div>

      {campaignData.selectedStructure === 'seasonal' && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">Seasonal Campaign Dates</CardTitle>
            </div>
            <CardDescription>Set the start and end dates for your seasonal/promotional campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Start Date</Label>
                <Input
                  type="date"
                  value={campaignData.startDate || ''}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="bg-white"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">End Date</Label>
                <Input
                  type="date"
                  value={campaignData.endDate || ''}
                  onChange={(e) => setCampaignData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="bg-white"
                />
              </div>
            </div>
            <p className="text-sm text-orange-700 mt-3">
              These dates will be included in your CSV export for Google Ads scheduling.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Inline Navigation */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={() => setCurrentStep(3)} disabled={!campaignData.selectedStructure}>
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Keywords Planner</h2>
        <p className="text-slate-600">Generate 410-710 keywords based on your seed keywords and campaign structure</p>
      </div>

      <Card className="mb-6">
            <CardHeader>
              <CardTitle>Seed Keywords</CardTitle>
              <CardDescription>AI-suggested seed keywords from your URL analysis - edit as needed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter seed keywords (one per line or comma-separated)"
                  value={seedKeywordsText}
                  onChange={(e) => setSeedKeywordsText(e.target.value)}
                  onBlur={() => {
                    const keywords = seedKeywordsText
                      .split(/[\n,]+/)
                      .map(k => k.trim())
                      .filter(k => k.length > 0);
                    setCampaignData(prev => ({ ...prev, seedKeywords: keywords }));
                  }}
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  💡 Press <kbd className="px-2 py-1 bg-slate-100 rounded">Enter</kbd> to go to next line. These {seedKeywordsText.split(/[\n,]+/).filter(k => k.trim().length > 0).length} keywords will be used to generate 410-710 variations.
                </p>
              </div>
          <Button 
                onClick={() => {
                  const keywords = seedKeywordsText
                    .split(/[\n,]+/)
                    .map(k => k.trim())
                    .filter(k => k.length > 0);
                  setCampaignData(prev => ({ ...prev, seedKeywords: keywords }));
                  setTimeout(() => handleGenerateKeywords(), 50);
                }} 
                disabled={loading || seedKeywordsText.split(/[\n,]+/).filter(k => k.trim().length > 0).length === 0} 
                className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Keywords
              </Button>
            </CardContent>
          </Card>

      <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Negative Keywords ({campaignData.negativeKeywords.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                {/* Compact Negative Keywords Display */}
                <div className="flex flex-wrap gap-1.5">
                  {campaignData.negativeKeywords.map((neg, idx) => {
                    const isDefault = DEFAULT_NEGATIVE_KEYWORDS.includes(neg);
                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-xs font-medium transition-all ${
                          isDefault
                            ? 'bg-red-100 text-red-700'
                            : 'bg-orange-100 text-orange-700 cursor-pointer hover:bg-orange-200'
                        }`}
                        onClick={() => {
                          if (!isDefault) {
                            const updated = campaignData.negativeKeywords.filter((_, i) => i !== idx);
                            setCampaignData(prev => ({ ...prev, negativeKeywords: updated }));
                          }
                        }}
                        title={isDefault ? "Default" : "Click to remove"}
                      >
                        {neg}
                        {!isDefault && <X className="w-3 h-3" />}
                      </span>
                    );
                  })}
                </div>

                {/* Compact Add Custom */}
                <div className="flex gap-2 items-start">
                  <Input
                    placeholder="Add negative keyword..."
                    className="text-sm h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value && !campaignData.negativeKeywords.includes(value)) {
                          setCampaignData(prev => ({
                            ...prev,
                            negativeKeywords: [...prev.negativeKeywords, value]
                          }));
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <span className="text-xs text-slate-400 whitespace-nowrap mt-2">Press Enter to add</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {campaignData.generatedKeywords.length > 0 && (
        <>
          <Card className="mb-6">
              <CardHeader>
                <CardTitle>Keyword Type Filters</CardTitle>
                <CardDescription>Toggle keyword types to filter the list</CardDescription>
              </CardHeader>
              <CardContent>
              <div className="flex gap-4">
                  {KEYWORD_TYPES.map(type => (
                    <div key={type.id} className="flex items-center gap-2">
                      <Checkbox
                        id={type.id}
                        checked={campaignData.keywordTypes[type.id] || false}
                        onCheckedChange={() => handleKeywordTypeToggle(type.id)}
                      />
                      <Label htmlFor={type.id}>{type.label}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          <Card className="mb-6" data-keywords-section>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Generated Keywords & Negative Keywords ({filteredKeywords.length + campaignData.negativeKeywords.length})</span>
                  <div className="flex items-center gap-2 text-xs font-normal">
                    <span className="text-slate-500">Data Source:</span>
                    <Badge variant="outline" className={`text-xs ${
                      keywordDataSource === 'google_ads_api' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : (keywordDataSource === 'fallback' || keywordDataSource === 'estimated')
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {keywordDataSource === 'google_ads_api' 
                        ? 'Google Ads API' 
                        : (keywordDataSource === 'fallback' || keywordDataSource === 'estimated')
                          ? 'Estimated Data' 
                          : 'Local Patterns'}
                    </Badge>
                  </div>
                </CardTitle>
                <CardDescription>Keywords with search volume, CPC, and competition metrics. Red keywords are negative (excluded).</CardDescription>
              </CardHeader>
            <CardContent>
              {/* Column Headers */}
              <div className="hidden md:grid grid-cols-12 gap-2 p-2 mb-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-t border">
                <div className="col-span-5">Keyword</div>
                <div className="col-span-1 text-center">Type</div>
                <div className="col-span-2 text-center">Volume</div>
                <div className="col-span-2 text-center">CPC</div>
                <div className="col-span-2 text-center">Competition</div>
              </div>
              <ScrollArea className="h-96">
                <div className="space-y-1">
                    {filteredKeywords.length === 0 && campaignData.negativeKeywords.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <p>No keywords match your filters.</p>
                        <p className="text-xs mt-2">Try adjusting keyword type filters or negative keywords.</p>
                      </div>
                    ) : (
                      <>
                        {/* Generated Keywords with Metrics */}
                        {filteredKeywords.map((kw, idx) => {
                          const keywordText = typeof kw === 'string' ? kw : (kw?.text || kw?.keyword || String(kw || ''));
                          const volume = kw?.volume ?? kw?.avgMonthlySearches;
                          const cpc = kw?.cpc ?? kw?.avgCpc;
                          const competition = kw?.competition;
                          
                          const formatVolume = (v: number | null | undefined) => {
                            if (v === null || v === undefined) return '-';
                            if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
                            if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
                            return v.toString();
                          };
                          
                          const formatCpc = (c: number | null | undefined) => {
                            if (c === null || c === undefined) return '-';
                            return '$' + c.toFixed(2);
                          };
                          
                          const getCompetitionStyle = (comp: string | null | undefined) => {
                            switch (comp) {
                              case 'LOW': return 'bg-green-50 text-green-700 border-green-200';
                              case 'MEDIUM': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
                              case 'HIGH': return 'bg-red-50 text-red-700 border-red-200';
                              default: return 'bg-slate-50 text-slate-500 border-slate-200';
                            }
                          };
                          
                          return (
                            <div key={kw?.id || idx} className="grid grid-cols-12 gap-2 items-center p-2 border rounded bg-white hover:bg-slate-50 transition-colors">
                              <div className="col-span-12 md:col-span-5">
                                <span className="text-sm font-medium text-slate-800">{keywordText}</span>
                              </div>
                              <div className="col-span-4 md:col-span-1 flex justify-center">
                                {kw?.matchType && (
                                  <Badge variant="outline" className="text-xs capitalize">{kw.matchType}</Badge>
                                )}
                              </div>
                              <div className="col-span-2 md:col-span-2 text-center">
                                <span className="text-sm font-semibold text-blue-700">{formatVolume(volume)}</span>
                                <span className="text-xs text-slate-400 block md:hidden">vol</span>
                              </div>
                              <div className="col-span-3 md:col-span-2 text-center">
                                <span className="text-sm font-medium text-green-700">{formatCpc(cpc)}</span>
                                <span className="text-xs text-slate-400 block md:hidden">cpc</span>
                              </div>
                              <div className="col-span-3 md:col-span-2 flex justify-center">
                                <Badge variant="outline" className={`text-xs ${getCompetitionStyle(competition)}`}>
                                  {competition || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Negative Keywords Section */}
                        {campaignData.negativeKeywords.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-xs font-semibold text-red-700 mb-2">Negative Keywords (Excluded)</p>
                            <div className="space-y-1">
                              {campaignData.negativeKeywords.map((neg, idx) => (
                                <div key={`neg-${idx}`} className="flex items-center justify-between p-2 border rounded bg-red-50 hover:bg-red-100 border-red-200">
                                  <span className="text-sm text-red-700">{neg}</span>
                                  <X className="w-4 h-4 text-red-600" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
        </>
      )}

      {/* Inline Navigation */}
      <div className="flex justify-between items-center pt-4 mt-6 border-t border-slate-200">
        <Button variant="outline" onClick={() => setCurrentStep(2)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={() => setCurrentStep(4)} disabled={campaignData.selectedKeywords.length === 0}>
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => {
    const allAdGroups = ['ALL_AD_GROUPS', ...campaignData.adGroups.map(ag => ag.name)];
    const displayAds = campaignData.ads.length > 0 ? campaignData.ads : [];
    const extensionTypes = [
      { id: 'snippet', label: 'SNIPPET EXTENSION', icon: FileText },
      { id: 'callout', label: 'CALLOUT EXTENSION', icon: MessageSquare },
      { id: 'sitelink', label: 'SITELINK EXTENSION', icon: Link2 },
      { id: 'call', label: 'CALL EXTENSION', icon: Phone },
      { id: 'price', label: 'PRICE EXTENSION', icon: DollarSign },
      { id: 'app', label: 'APP EXTENSION', icon: Smartphone },
      { id: 'location', label: 'LOCATION EXTENSION', icon: MapPinIcon },
      { id: 'message', label: 'MESSAGE EXTENSION', icon: MessageSquare },
      { id: 'leadform', label: 'LEAD FORM EXTENSION', icon: FileText },
      { id: 'promotion', label: 'PROMOTION EXTENSION', icon: Gift },
      { id: 'image', label: 'IMAGE EXTENSION', icon: ImageIcon },
    ];

    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Ads & Extensions Wizard</h2>
          <p className="text-slate-600">Generate ad copies and add extensions to your campaign</p>
        </div>

        {/* Campaign Info Card - URL (greyed out) and Keywords */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Campaign Information</CardTitle>
            <CardDescription className="text-blue-700">Using information from earlier steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Landing Page URL - Greyed out */}
              <div>
                <Label className="text-sm font-semibold text-blue-800">Landing Page URL</Label>
                <Input
                  type="text"
                  value={campaignData.url || 'Not set'}
                  disabled
                  readOnly
                  className="mt-1 bg-slate-200 text-slate-500 border-slate-300 cursor-not-allowed opacity-70"
                />
              </div>
              
              {/* Keywords */}
              <div>
                <Label className="text-sm font-semibold text-blue-800">Keywords</Label>
                <div className="mt-1 p-2 bg-white rounded border border-blue-200">
                  <div className="flex flex-wrap gap-2">
                    {campaignData.selectedKeywords.length > 0 ? (
                      campaignData.selectedKeywords.slice(0, 5).map((kw, idx) => {
                        const keywordText = typeof kw === 'string' ? kw : (kw?.text || kw?.keyword || String(kw || ''));
                        return (
                          <Badge key={kw?.id || idx} variant="outline" className="text-xs">
                            {keywordText}
                          </Badge>
                        );
                      })
                    ) : (
                      <span className="text-sm text-slate-500">No keywords selected</span>
                    )}
                    {campaignData.selectedKeywords.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{campaignData.selectedKeywords.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Create Ads & Extensions - Compact Inline */}
              <div className="pt-2 space-y-1">
                <div className="flex items-center flex-wrap gap-1.5">
                  <span className="text-xs font-semibold text-blue-800 whitespace-nowrap">Create Ads (Max 3):</span>
                  <Button 
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-0.5 h-6"
                    onClick={() => handleAddNewAd('rsa')}
                    disabled={loading || campaignData.ads.length >= 3 || campaignData.ads.some(ad => ad.type === 'rsa' || ad.adType === 'RSA')}
                  >
                    <Plus className="mr-1 w-3 h-3" /> RSA
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-0.5 h-6"
                    onClick={() => handleAddNewAd('dki')}
                    disabled={loading || campaignData.ads.length >= 3 || campaignData.ads.some(ad => ad.type === 'dki' || ad.adType === 'DKI')}
                  >
                    <Plus className="mr-1 w-3 h-3" /> DKI
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-0.5 h-6"
                    onClick={() => handleAddNewAd('call')}
                    disabled={loading || campaignData.ads.length >= 3 || campaignData.ads.some(ad => ad.type === 'call' || ad.adType === 'CallOnly')}
                  >
                    <Plus className="mr-1 w-3 h-3" /> CALL
                  </Button>
                </div>
                
                <div className="flex items-center flex-wrap gap-1">
                  <span className="text-xs font-semibold text-purple-800 whitespace-nowrap">Extensions:</span>
                  {extensionTypes.map(ext => {
                    const Icon = ext.icon;
                    const shortLabel = ext.label.replace(' EXTENSION', '');
                    return (
                      <Button
                        key={ext.id}
                        variant="outline"
                        size="sm"
                        className="border-purple-200 hover:bg-purple-50 text-xs px-1.5 py-0.5 h-6"
                        onClick={() => handleAddExtensionToAllAds(ext.id)}
                      >
                        <Plus className="mr-0.5 w-2.5 h-2.5" />
                        <Icon className="mr-0.5 w-2.5 h-2.5" />
                        {shortLabel}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ad Group Selector and Ads Display */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Ad Group Selector Only */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4">
                <Label className="text-sm font-semibold mb-2 block">Ad Group</Label>
                <Select 
                  value={campaignData.selectedAdGroup || 'ALL_AD_GROUPS'} 
                  onValueChange={(value: string) => setCampaignData(prev => ({ ...prev, selectedAdGroup: value }))}
                >
                  <SelectTrigger className="w-full bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allAdGroups.map(group => (
                      <SelectItem key={group} value={group}>
                        {group === 'ALL_AD_GROUPS' ? 'ALL AD GROUPS' : group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-2">
                  Ads: {displayAds.length} / 3
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Ads Display */}
          <div className="lg:col-span-3 space-y-4">
            {displayAds.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Sparkles className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No Ads Created Yet</h3>
                  <p className="text-slate-500 mb-4">Click on an ad type button above to create an ad (Maximum 3 ads allowed)</p>
                </CardContent>
              </Card>
            ) : (
              displayAds.map((ad) => (
                <Card key={ad.id} className="border-2">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="outline" className="text-xs">
                        {ad.type?.toUpperCase() || ad.adType || 'RSA'}
                      </Badge>
                        <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditAd(ad.id)} className="text-purple-600 hover:text-purple-700">
                          <Edit3 className="w-4 h-4 mr-1" />
                          EDIT
                          </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDuplicateAd(ad.id)} className="text-purple-600 hover:text-purple-700">
                          <Copy className="w-4 h-4 mr-1" />
                          DUPLICATE
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteAd(ad.id)} className="text-purple-600 hover:text-purple-700">
                          <Trash2 className="w-4 h-4 mr-1" />
                          DELETE
                          </Button>
                        </div>
                      </div>
                      
                      {/* RSA Ad Display */}
                      {ad.type === 'rsa' && ad.headlines && (
                      <div className="space-y-3">
                          <div>
                          <Label className="text-xs text-slate-500 mb-2 block">Headlines / Paths</Label>
                          <div className="flex flex-wrap gap-2">
                              {ad.headlines.slice(0, 5).map((h: string, i: number) => (
                              <span key={i} className="text-sm text-slate-700">{h}</span>
                              ))}
                            {ad.displayPath && ad.displayPath.length > 0 && (
                              <span className="text-sm text-slate-500">| {ad.displayPath.join(' | ')}</span>
                              )}
                            </div>
                          </div>
                        <div>
                          <Label className="text-xs text-slate-500 mb-1 block">Display URL</Label>
                          <p className="text-xs text-blue-600 break-all">{ad.finalUrl || campaignData.url}</p>
                          </div>
                          {ad.descriptions && ad.descriptions.length > 0 && (
                            <div>
                            <Label className="text-xs text-slate-500 mb-1 block">Descriptions</Label>
                            {ad.descriptions.slice(0, 2).map((desc: string, i: number) => (
                              <p key={i} className="text-sm text-slate-600 mb-1">{desc}</p>
                            ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* DKI Ad Display */}
                      {(ad.type === 'dki' || ad.adType === 'DKI') && (
                      <div className="space-y-3">
                          {ad.headline1 && <p className="font-semibold text-sm">{ad.headline1}</p>}
                          {ad.headline2 && <p className="font-semibold text-sm">{ad.headline2}</p>}
                        {ad.headline3 && <p className="font-semibold text-sm">{ad.headline3}</p>}
                          {ad.description1 && <p className="text-sm text-slate-600">{ad.description1}</p>}
                        {ad.description2 && <p className="text-sm text-slate-600">{ad.description2}</p>}
                          {ad.finalUrl && (
                            <p className="text-xs text-blue-600">{ad.finalUrl}</p>
                          )}
                        </div>
                      )}
                      
                      {/* Call-Only Ad Display */}
                      {(ad.type === 'call' || ad.adType === 'CallOnly') && (
                      <div className="space-y-3">
                          {ad.headline1 && <p className="font-semibold text-sm">{ad.headline1}</p>}
                        {ad.headline2 && <p className="font-semibold text-sm">{ad.headline2}</p>}
                          {ad.phoneNumber && (
                            <div className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-green-600" />
                            <span className="text-lg font-medium">{ad.phoneNumber}</span>
                            </div>
                          )}
                          {ad.description1 && <p className="text-sm text-slate-600">{ad.description1}</p>}
                        {ad.description2 && <p className="text-sm text-slate-600">{ad.description2}</p>}
                        </div>
                      )}
                      
                    {/* Extensions Display */}
                        {ad.extensions && ad.extensions.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <Label className="text-xs text-slate-500 mb-2 block">Extensions</Label>
                        <div className="space-y-2">
                            {ad.extensions.map((ext: any) => {
                              // Get extension display text based on type
                              let displayText = ext.text || ext.label || ext.type;
                              
                              if (ext.type === 'snippet' && ext.header && ext.values) {
                                displayText = `${ext.header}: ${ext.values.join(', ')}`;
                              } else if (ext.type === 'callout' && ext.callouts && Array.isArray(ext.callouts)) {
                                displayText = ext.callouts.join(', ');
                              } else if (ext.type === 'sitelink' && ext.sitelinks && Array.isArray(ext.sitelinks)) {
                                displayText = ext.sitelinks.map((sl: any) => sl.text || sl.linkText || 'Sitelink').join(', ');
                              } else if (ext.type === 'call' && (ext.phone || ext.phoneNumber)) {
                                displayText = ext.phone || ext.phoneNumber;
                              } else if (ext.type === 'price' && ext.price) {
                                displayText = `${ext.priceQualifier || 'From'} ${ext.price} ${ext.unit || ''}`.trim();
                              }
                              
                              return (
                                <div key={ext.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                                  <div className="flex items-center gap-3 flex-1">
                                    {ext.type === 'snippet' && <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                                    {ext.type === 'callout' && <MessageSquare className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                                    {ext.type === 'sitelink' && <Link2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                                    {ext.type === 'call' && <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />}
                                    {ext.type === 'price' && <DollarSign className="w-4 h-4 text-yellow-600 flex-shrink-0" />}
                                    {ext.type === 'app' && <Smartphone className="w-4 h-4 text-cyan-600 flex-shrink-0" />}
                                    {ext.type === 'location' && <MapPinIcon className="w-4 h-4 text-red-600 flex-shrink-0" />}
                                    {ext.type === 'message' && <MessageSquare className="w-4 h-4 text-purple-600 flex-shrink-0" />}
                                    {ext.type === 'leadform' && <FileText className="w-4 h-4 text-orange-600 flex-shrink-0" />}
                                    {ext.type === 'promotion' && <Gift className="w-4 h-4 text-pink-600 flex-shrink-0" />}
                                    {ext.type === 'image' && <ImageIcon className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs text-slate-500 uppercase font-semibold block mb-1">
                                        {ext.label || ext.type.charAt(0).toUpperCase() + ext.type.slice(1).replace(/([A-Z])/g, ' $1')}
                                      </span>
                                      <span className="text-sm text-slate-700 font-medium block truncate">
                                        {displayText}
                                </span>
                                    </div>
                          </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveExtension(ad.id, ext.id)}
                                    className="text-red-600 hover:text-red-700 flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                      </div>
                              );
                            })}
              </div>
                      </div>
                    )}

                    {/* Edit Form - shown when editing */}
                    {editingAdId === ad.id && (
                      <div className="mt-6 pt-6 border-t border-slate-200 space-y-4">
                        {/* RSA Edit Form */}
                        {(ad.type === 'rsa' || ad.adType === 'RSA') && (
                          <>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-xs font-semibold text-slate-700 mb-2 block">Headlines (max 30 chars each)</Label>
                                <div className="space-y-2">
                                  {(ad.headlines || []).slice(0, 15).map((headline: string, idx: number) => (
                                    <div key={idx}>
                                      <div className="flex items-center justify-between mb-1">
                                        <Label className="text-xs text-slate-600">Headline {idx + 1}</Label>
                                        <span className={`text-xs ${(headline?.length || 0) > 30 ? 'text-red-600 font-semibold' : (headline?.length || 0) > 25 ? 'text-amber-600' : 'text-slate-500'}`}>
                                          {(headline?.length || 0)}/30
                                        </span>
                                      </div>
                                      <Input
                                        value={headline || ''}
                                        onChange={(e) => {
                                          const newHeadlines = [...(ad.headlines || [])];
                                          newHeadlines[idx] = e.target.value;
                                          updateAdField(ad.id, 'headlines', newHeadlines);
                                        }}
                                        className={`${(headline?.length || 0) > 30 ? 'border-red-500 focus:border-red-500' : ''}`}
                                        maxLength={30}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-slate-700 mb-2 block">Descriptions (max 90 chars each)</Label>
                                <div className="space-y-2">
                                  {(ad.descriptions || []).slice(0, 4).map((desc: string, idx: number) => (
                                    <div key={idx}>
                                      <div className="flex items-center justify-between mb-1">
                                        <Label className="text-xs text-slate-600">Description {idx + 1}</Label>
                                        <span className={`text-xs ${(desc?.length || 0) > 90 ? 'text-red-600 font-semibold' : (desc?.length || 0) > 80 ? 'text-amber-600' : 'text-slate-500'}`}>
                                          {(desc?.length || 0)}/90
                                        </span>
                                      </div>
                                      <Textarea
                                        value={desc || ''}
                                        onChange={(e) => {
                                          const newDescriptions = [...(ad.descriptions || [])];
                                          newDescriptions[idx] = e.target.value;
                                          updateAdField(ad.id, 'descriptions', newDescriptions);
                                        }}
                                        className={`${(desc?.length || 0) > 90 ? 'border-red-500 focus:border-red-500' : ''}`}
                                        rows={2}
                                        maxLength={90}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-slate-700 mb-2 block">Final URL</Label>
                                <Input
                                  value={ad.finalUrl || ''}
                                  onChange={(e) => updateAdField(ad.id, 'finalUrl', e.target.value)}
                                  placeholder="https://www.example.com"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* DKI Edit Form */}
                        {(ad.type === 'dki' || ad.adType === 'DKI') && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Headline 1 *</Label>
                                  <span className={`text-xs ${(ad.headline1?.length || 0) > 30 ? 'text-red-600 font-semibold' : (ad.headline1?.length || 0) > 25 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.headline1?.length || 0)}/30
                                  </span>
                                </div>
                                <Input
                                  value={ad.headline1 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'headline1', e.target.value)}
                                  className={`${(ad.headline1?.length || 0) > 30 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter headline 1"
                                  maxLength={30}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Headline 2 *</Label>
                                  <span className={`text-xs ${(ad.headline2?.length || 0) > 30 ? 'text-red-600 font-semibold' : (ad.headline2?.length || 0) > 25 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.headline2?.length || 0)}/30
                                  </span>
                                </div>
                                <Input
                                  value={ad.headline2 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'headline2', e.target.value)}
                                  className={`${(ad.headline2?.length || 0) > 30 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter headline 2"
                                  maxLength={30}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Headline 3</Label>
                                  <span className={`text-xs ${(ad.headline3?.length || 0) > 30 ? 'text-red-600 font-semibold' : (ad.headline3?.length || 0) > 25 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.headline3?.length || 0)}/30
                                  </span>
                                </div>
                                <Input
                                  value={ad.headline3 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'headline3', e.target.value)}
                                  className={`${(ad.headline3?.length || 0) > 30 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter headline 3"
                                  maxLength={30}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Description 1 *</Label>
                                  <span className={`text-xs ${(ad.description1?.length || 0) > 90 ? 'text-red-600 font-semibold' : (ad.description1?.length || 0) > 80 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.description1?.length || 0)}/90
                                  </span>
                                </div>
                                <Textarea
                                  value={ad.description1 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'description1', e.target.value)}
                                  className={`${(ad.description1?.length || 0) > 90 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter description 1"
                                  rows={2}
                                  maxLength={90}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Description 2</Label>
                                  <span className={`text-xs ${(ad.description2?.length || 0) > 90 ? 'text-red-600 font-semibold' : (ad.description2?.length || 0) > 80 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.description2?.length || 0)}/90
                                  </span>
                                </div>
                                <Textarea
                                  value={ad.description2 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'description2', e.target.value)}
                                  className={`${(ad.description2?.length || 0) > 90 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter description 2"
                                  rows={2}
                                  maxLength={90}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-slate-700">Final URL *</Label>
                              <Input
                                value={ad.finalUrl || ''}
                                onChange={(e) => updateAdField(ad.id, 'finalUrl', e.target.value)}
                                placeholder="https://www.example.com"
                              />
                            </div>
                          </>
                        )}

                        {/* Call-Only Edit Form */}
                        {(ad.type === 'call' || ad.adType === 'CallOnly') && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Headline 1 *</Label>
                                  <span className={`text-xs ${(ad.headline1?.length || 0) > 30 ? 'text-red-600 font-semibold' : (ad.headline1?.length || 0) > 25 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.headline1?.length || 0)}/30
                                  </span>
                                </div>
                                <Input
                                  value={ad.headline1 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'headline1', e.target.value)}
                                  className={`${(ad.headline1?.length || 0) > 30 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter headline 1"
                                  maxLength={30}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Headline 2 *</Label>
                                  <span className={`text-xs ${(ad.headline2?.length || 0) > 30 ? 'text-red-600 font-semibold' : (ad.headline2?.length || 0) > 25 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.headline2?.length || 0)}/30
                                  </span>
                                </div>
                                <Input
                                  value={ad.headline2 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'headline2', e.target.value)}
                                  className={`${(ad.headline2?.length || 0) > 30 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter headline 2"
                                  maxLength={30}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Description 1 *</Label>
                                  <span className={`text-xs ${(ad.description1?.length || 0) > 90 ? 'text-red-600 font-semibold' : (ad.description1?.length || 0) > 80 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.description1?.length || 0)}/90
                                  </span>
                                </div>
                                <Textarea
                                  value={ad.description1 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'description1', e.target.value)}
                                  className={`${(ad.description1?.length || 0) > 90 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter description 1"
                                  rows={2}
                                  maxLength={90}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <Label className="text-xs font-semibold text-slate-700">Description 2 *</Label>
                                  <span className={`text-xs ${(ad.description2?.length || 0) > 90 ? 'text-red-600 font-semibold' : (ad.description2?.length || 0) > 80 ? 'text-amber-600' : 'text-slate-500'}`}>
                                    {(ad.description2?.length || 0)}/90
                                  </span>
                                </div>
                                <Textarea
                                  value={ad.description2 || ''}
                                  onChange={(e) => updateAdField(ad.id, 'description2', e.target.value)}
                                  className={`${(ad.description2?.length || 0) > 90 ? 'border-red-500 focus:border-red-500' : ''}`}
                                  placeholder="Enter description 2"
                                  rows={2}
                                  maxLength={90}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
                                <Input
                                  value={ad.phoneNumber || ''}
                                  onChange={(e) => updateAdField(ad.id, 'phoneNumber', e.target.value)}
                                  placeholder="(555) 123-4567"
                                />
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-slate-700">Business Name *</Label>
                                <Input
                                  value={ad.businessName || ''}
                                  onChange={(e) => updateAdField(ad.id, 'businessName', e.target.value)}
                                  placeholder="Your Business"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="flex gap-2 pt-4 border-t border-slate-300">
                          <Button
                            onClick={() => handleSaveAd(ad.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            className="flex-1"
                            size="sm"
                          >
                            Cancel
                          </Button>
              </div>
                      </div>
                    )}
          </CardContent>
        </Card>
              ))
      )}
          </div>
        </div>

      {/* Inline Navigation */}
      <div className="flex justify-between items-center pt-4 mt-6 border-t border-slate-200">
        <Button variant="outline" onClick={() => setCurrentStep(3)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={() => setCurrentStep(5)} disabled={campaignData.ads.length === 0}>
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
  };

  const renderStep5 = () => {
    const handlePresetSelect = (type: 'cities' | 'states' | 'zips', preset: string) => {
      let items: string[] = [];
      const countryPresets = getGeoPresetsForCountry(campaignData.targetCountry);
      
      if (type === 'cities') {
        if (preset === 'top50') items = countryPresets.cities.top50;
        else if (preset === 'top250') items = countryPresets.cities.top250;
        else if (preset === 'top500') items = countryPresets.cities.top500;
        setCampaignData(prev => ({ 
          ...prev, 
          locations: { ...prev.locations, cities: items, states: [], zipCodes: [] }
        }));
      } else if (type === 'states') {
        if (preset === 'top10') items = countryPresets.states.top10;
        else if (preset === 'top25') items = countryPresets.states.top25;
        else if (preset === 'top50') items = countryPresets.states.top50;
        setCampaignData(prev => ({ 
          ...prev, 
          locations: { ...prev.locations, states: items, cities: [], zipCodes: [] }
        }));
      } else if (type === 'zips') {
        if (preset === 'top1000') items = countryPresets.zips.top1000;
        else if (preset === 'top5000') items = countryPresets.zips.top5000;
        else if (preset === 'top15000') items = countryPresets.zips.top15000;
        else if (preset === 'top25000') items = countryPresets.zips.top25000;
        setCampaignData(prev => ({ 
          ...prev, 
          locations: { ...prev.locations, zipCodes: items, cities: [], states: [] }
        }));
      }
      autoSaveDraft();
      notifications.success(`Selected ${items.length} ${type}`, { title: 'Geo Targeting Updated' });
    };

    const clearLocations = () => {
      setCampaignData(prev => ({ 
        ...prev, 
        locations: { countries: [], states: [], cities: [], zipCodes: [] }
      }));
      notifications.info('Locations cleared - will target entire country');
    };

    const getCurrentSelection = () => {
      const { cities, states, zipCodes } = campaignData.locations;
      if (cities.length > 0) return { type: 'Cities', count: cities.length };
      if (states.length > 0) return { type: 'States', count: states.length };
      if (zipCodes.length > 0) return { type: 'ZIP Codes', count: zipCodes.length };
      return null;
    };

    const currentSelection = getCurrentSelection();

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Geo Target</h2>
          <p className="text-slate-600">Target specific locations or the entire country.</p>
        </div>

        <div className="space-y-6">
          {/* Target Country */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                <CardTitle>Target Country</CardTitle>
              </div>
              <CardDescription>
                Select the base country for your campaign.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={campaignData.targetCountry} 
                onValueChange={(value: string) => {
                  setCampaignData(prev => ({ ...prev, targetCountry: value }));
                  autoSaveDraft();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_PRESETS.countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Location Targeting Tabs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  <CardTitle>Location Targeting</CardTitle>
                </div>
                {currentSelection && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                      {currentSelection.count} {currentSelection.type} selected
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={clearLocations}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <CardDescription>
                Choose to target specific cities, states, or ZIP codes within {campaignData.targetCountry}. 
                Leave empty to target the entire country.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="cities" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="cities" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Cities
                  </TabsTrigger>
                  <TabsTrigger value="states" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    States
                  </TabsTrigger>
                  <TabsTrigger value="zips" className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    ZIP Codes
                  </TabsTrigger>
                </TabsList>

                {/* Cities Tab */}
                <TabsContent value="cities" className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">Quick Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={campaignData.locations.cities.length === 50 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetSelect('cities', 'top50')}
                        className="text-sm"
                      >
                        Top 50 Cities
                      </Button>
                      <Button
                        variant={campaignData.locations.cities.length === 250 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetSelect('cities', 'top250')}
                        className="text-sm"
                      >
                        Top 250 Cities
                      </Button>
                      <Button
                        variant={campaignData.locations.cities.length === 500 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetSelect('cities', 'top500')}
                        className="text-sm"
                      >
                        Top 500 Cities
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-sm font-medium text-slate-700">Manual Entry</Label>
                    <p className="text-xs text-slate-500">Enter city names separated by commas or new lines</p>
                    <textarea
                      className="w-full h-24 p-3 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., New York, Los Angeles, Chicago&#10;or one city per line"
                      onChange={(e) => {
                        const input = e.target.value;
                        if (input.trim()) {
                          const cities = input
                            .split(/[,\n]/)
                            .map(c => c.trim())
                            .filter(c => c.length > 0);
                          setCampaignData(prev => ({
                            ...prev,
                            locations: { ...prev.locations, cities, states: [], zipCodes: [] }
                          }));
                        }
                      }}
                    />
                  </div>
                  {campaignData.locations.cities.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600 mb-2">
                        <strong>{campaignData.locations.cities.length}</strong> cities selected
                      </p>
                      <ScrollArea className="h-24">
                        <div className="flex flex-wrap gap-1">
                          {campaignData.locations.cities.slice(0, 20).map((city, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{city}</Badge>
                          ))}
                          {campaignData.locations.cities.length > 20 && (
                            <Badge variant="secondary" className="text-xs">
                              +{campaignData.locations.cities.length - 20} more
                            </Badge>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </TabsContent>

                {/* States Tab */}
                <TabsContent value="states" className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">Quick Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={campaignData.locations.states.length === 10 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetSelect('states', 'top10')}
                        className="text-sm"
                      >
                        Top 10 States
                      </Button>
                      <Button
                        variant={campaignData.locations.states.length === 25 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetSelect('states', 'top25')}
                        className="text-sm"
                      >
                        Top 25 States
                      </Button>
                      <Button
                        variant={campaignData.locations.states.length === 50 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetSelect('states', 'top50')}
                        className="text-sm"
                      >
                        All 50 States
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-sm font-medium text-slate-700">Manual Entry</Label>
                    <p className="text-xs text-slate-500">Enter state names or abbreviations separated by commas or new lines</p>
                    <textarea
                      className="w-full h-24 p-3 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., California, Texas, Florida&#10;or CA, TX, FL"
                      onChange={(e) => {
                        const input = e.target.value;
                        if (input.trim()) {
                          const states = input
                            .split(/[,\n]/)
                            .map(s => s.trim())
                            .filter(s => s.length > 0);
                          setCampaignData(prev => ({
                            ...prev,
                            locations: { ...prev.locations, states, cities: [], zipCodes: [] }
                          }));
                        }
                      }}
                    />
                  </div>
                  {campaignData.locations.states.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600 mb-2">
                        <strong>{campaignData.locations.states.length}</strong> states selected
                      </p>
                      <ScrollArea className="h-24">
                        <div className="flex flex-wrap gap-1">
                          {campaignData.locations.states.map((state, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{state}</Badge>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </TabsContent>

                {/* ZIP Codes Tab */}
                <TabsContent value="zips" className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">Quick Presets</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={campaignData.locations.zipCodes.length === 1000 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetSelect('zips', 'top1000')}
                        className="text-sm"
                      >
                        Top 1,000 ZIPs
                      </Button>
                      <Button
                        variant={campaignData.locations.zipCodes.length === 5000 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetSelect('zips', 'top5000')}
                        className="text-sm"
                      >
                        Top 5,000 ZIPs
                      </Button>
                      <Button
                        variant={campaignData.locations.zipCodes.length === 15000 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetSelect('zips', 'top15000')}
                        className="text-sm"
                      >
                        Top 15,000 ZIPs
                      </Button>
                      <Button
                        variant={campaignData.locations.zipCodes.length >= 25000 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePresetSelect('zips', 'top25000')}
                        className="text-sm"
                      >
                        Top 25,000 ZIPs
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-sm font-medium text-slate-700">Manual Entry</Label>
                    <p className="text-xs text-slate-500">Enter ZIP codes separated by commas, spaces, or new lines</p>
                    <textarea
                      className="w-full h-24 p-3 text-sm border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 10001, 90210, 60601&#10;or one ZIP per line"
                      onChange={(e) => {
                        const input = e.target.value;
                        if (input.trim()) {
                          const zipCodes = input
                            .split(/[,\s\n]+/)
                            .map(z => z.trim())
                            .filter(z => /^\d{5}(-\d{4})?$/.test(z));
                          setCampaignData(prev => ({
                            ...prev,
                            locations: { ...prev.locations, zipCodes, cities: [], states: [] }
                          }));
                        }
                      }}
                    />
                  </div>
                  {campaignData.locations.zipCodes.length > 0 && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600 mb-2">
                        <strong>{campaignData.locations.zipCodes.length.toLocaleString()}</strong> ZIP codes selected
                      </p>
                      <ScrollArea className="h-24">
                        <div className="flex flex-wrap gap-1">
                          {campaignData.locations.zipCodes.slice(0, 30).map((zip, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{zip}</Badge>
                          ))}
                          {campaignData.locations.zipCodes.length > 30 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(campaignData.locations.zipCodes.length - 30).toLocaleString()} more
                            </Badge>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">Targeting Summary</p>
                  <p className="text-sm text-slate-600">
                    {currentSelection 
                      ? `${currentSelection.count.toLocaleString()} ${currentSelection.type} in ${campaignData.targetCountry}`
                      : `All of ${campaignData.targetCountry} (nationwide)`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inline Navigation */}
          <div className="flex justify-between items-center pt-4 mt-6 border-t border-slate-200">
            <Button variant="outline" onClick={() => setCurrentStep(4)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={() => { setCurrentStep(6); autoSaveDraft(); }}>
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Helper function to get location count and type
  const getLocationCountAndType = () => {
    const { cities, zipCodes, states, countries } = campaignData.locations;
    
    if (cities.length > 0) {
      return { count: cities.length, type: 'Cities' };
    } else if (zipCodes.length > 0) {
      return { count: zipCodes.length, type: 'ZIP Codes' };
    } else if (states.length > 0) {
      return { count: states.length, type: 'States' };
    } else if (countries.length > 0) {
      return { count: countries.length, type: 'Countries' };
    } else {
      // Whole country targeting
      return { count: 1, type: 'Country' };
    }
  };

  const renderStep8 = () => {
    const locationInfo = getLocationCountAndType();
    const structureName = CAMPAIGN_STRUCTURES.find(s => s.id === campaignData.selectedStructure)?.name || 'SKAG';
    const targetLocationText = locationInfo.count === 1 && locationInfo.type === 'Country'
      ? `${campaignData.targetCountry} (Nationwide)`
      : `${campaignData.targetCountry} (${locationInfo.type})`;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-200/50 mb-4 animate-in fade-in zoom-in duration-500">
              <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
              Campaign Created Successfully!
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-900">
              Your campaign is ready to export and implement in Google Ads Editor
            </p>
        </div>

          {/* Metrics Cards - Redesigned */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* 1. Campaigns */}
            <Card className="text-center border-2 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Megaphone className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-0.5">1</div>
                <div className="text-xs font-medium text-slate-700">Campaign</div>
              </CardContent>
            </Card>
            {/* 2. Ad Groups */}
            <Card className="text-center border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Layers className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-0.5">{campaignData.adGroups.length}</div>
                <div className="text-xs font-medium text-slate-700">Ad Groups</div>
              </CardContent>
            </Card>
            {/* 3. Ads */}
            <Card className="text-center border-2 border-orange-100 bg-gradient-to-br from-white to-orange-50/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-0.5">{campaignData.ads.length * Math.max(1, campaignData.adGroups.length)}</div>
                <div className="text-xs font-medium text-slate-700">Ads</div>
              </CardContent>
            </Card>
            {/* 4. Keywords */}
            <Card className="text-center border-2 border-purple-100 bg-gradient-to-br from-white to-purple-50/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Hash className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-0.5">{campaignData.selectedKeywords.length}</div>
                <div className="text-xs font-medium text-slate-700">Keywords</div>
              </CardContent>
            </Card>
            {/* 5. Locations */}
            <Card className="text-center border-2 border-green-100 bg-gradient-to-br from-white to-green-50/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-0.5">{locationInfo.count}</div>
                <div className="text-xs font-medium text-slate-700">Locations</div>
              </CardContent>
            </Card>
            {/* 6. Assets */}
            <Card className="text-center border-2 border-teal-100 bg-gradient-to-br from-white to-teal-50/50 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <Link2 className="w-4 h-4 text-white" />
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-0.5">
                  {campaignData.ads.reduce((total, ad) => total + (ad.extensions?.length || 0), 0)}
                </div>
                <div className="text-xs font-medium text-slate-700">Assets</div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Summary - Redesigned */}
          <Card className="mb-6 border-2 border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 py-3 px-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                  <CardTitle className="text-lg text-slate-900">Campaign Summary</CardTitle>
                  <CardDescription className="text-xs text-slate-600 mt-0.5">All checks passed - ready for export</CardDescription>
              </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Campaign Name</Label>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-base font-semibold text-slate-900">{campaignData.campaignName}</p>
            </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Structure</Label>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-base font-semibold text-slate-900">{structureName}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Target Location</Label>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-base font-semibold text-slate-900">{targetLocationText}</p>
                  </div>
                </div>
              </div>
              
            {/* Cities Summary - Show if cities are selected */}
            {campaignData.locations.cities.length > 0 && (() => {
              const cityCount = campaignData.locations.cities.length;
              const presetCounts = [20, 50, 100, 200, LOCATION_PRESETS.cities.length];
              const isPreset = presetCounts.includes(cityCount);
              const presetLabel = cityCount === 20 ? 'Top 20 Cities' :
                                cityCount === 50 ? 'Top 50 Cities' :
                                cityCount === 100 ? 'Top 100 Cities' :
                                cityCount === 200 ? 'Top 200 Cities' :
                                cityCount === LOCATION_PRESETS.cities.length ? 'All Cities' : null;
              
              return (
                  <div className="pt-6 border-t border-slate-200">
                    <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-2 border-blue-200/60 rounded-xl p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
                          <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <p className="text-base font-bold text-slate-900">
                            {presetLabel || 'Custom Cities'}
                          </p>
                            <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-300 font-semibold px-2.5 py-1">
                            {cityCount} selected
                          </Badge>
                        </div>
                          <div>
                            <p className="text-xs font-medium text-slate-600 mb-2">Selected cities:</p>
                            <div className="flex flex-wrap gap-2">
                            {campaignData.locations.cities.slice(0, 10).map((city, idx) => (
                                <Badge key={idx} className="text-xs bg-white text-slate-700 border-slate-300 shadow-sm font-medium">
                                {city}
                              </Badge>
                            ))}
                            {cityCount > 10 && (
                                <Badge className="text-xs bg-slate-100 text-slate-600 border-slate-300 shadow-sm font-medium">
                                +{cityCount - 10} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          </CardContent>
        </Card>

          {/* Generation Logic Details */}
          <Card className="mb-6 border-2 border-slate-200/60 bg-white/80 backdrop-blur-xl shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 py-3 px-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-900">Generation Logic Details</CardTitle>
                  <CardDescription className="text-xs text-slate-600 mt-0.5">Backend calculations and structure breakdown</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Structure Logic */}
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <h4 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Campaign Structure: {structureName}
                </h4>
                <p className="text-sm text-indigo-700">
                  {campaignData.selectedStructure === 'skag' && 'SKAG (Single Keyword Ad Groups): Each keyword gets its own ad group for maximum relevance and Quality Score. This creates 1 ad group per unique keyword.'}
                  {campaignData.selectedStructure === 'stag' && 'STAG (Single Theme Ad Groups): Keywords are grouped by theme/intent. Related keywords share an ad group for efficient management.'}
                  {campaignData.selectedStructure === 'intent' && 'Intent-Based: Keywords organized by user intent (informational, navigational, transactional). Ads tailored to each intent type.'}
                  {campaignData.selectedStructure === 'alpha_beta' && 'Alpha-Beta: Alpha campaign for exact match winners, Beta for broad match discovery. Optimizes budget allocation.'}
                  {campaignData.selectedStructure === 'funnel' && 'Funnel-Based: Top/Middle/Bottom funnel structure. Targets users at different stages of the buying journey.'}
                  {campaignData.selectedStructure === 'geo' && 'Geo-Based: Location-focused ad groups. Each geographic area gets targeted messaging.'}
                  {campaignData.selectedStructure === 'brand_split' && 'Brand Split: Separates brand vs. non-brand keywords for different bidding strategies.'}
                  {!['skag', 'stag', 'intent', 'alpha_beta', 'funnel', 'geo', 'brand_split'].includes(campaignData.selectedStructure || '') && 'Standard campaign structure with optimized keyword grouping.'}
                </p>
              </div>

              {/* Metrics Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ad Groups Logic */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">{campaignData.adGroups.length} Ad Groups</h4>
                  <p className="text-sm text-blue-700">
                    {campaignData.selectedStructure === 'skag' 
                      ? `Created 1 ad group per keyword. With ${campaignData.selectedKeywords.length} selected keywords, SKAG structure groups them into ${campaignData.adGroups.length} focused ad groups.`
                      : `Keywords grouped by theme/pattern into ${campaignData.adGroups.length} ad groups for optimal organization.`
                    }
                  </p>
                </div>

                {/* Ads Logic */}
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <h4 className="font-semibold text-orange-800 mb-2">{campaignData.ads.length * Math.max(1, campaignData.adGroups.length)} Ads</h4>
                  <p className="text-sm text-orange-700">
                    {campaignData.ads.length} ad template(s) × {campaignData.adGroups.length} ad groups = {campaignData.ads.length * campaignData.adGroups.length} total ads. 
                    Types: {campaignData.ads.map(a => a.type?.toUpperCase()).filter((v, i, arr) => arr.indexOf(v) === i).join(', ') || 'RSA, DKI'}.
                  </p>
                </div>

                {/* Keywords Logic */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">{campaignData.selectedKeywords.length} Keywords</h4>
                  <p className="text-sm text-purple-700">
                    Generated from {campaignData.seedKeywords.length} seed keywords using pattern expansion (modifiers, locations, intents). 
                    Match types: Broad, Phrase, Exact. Excludes {campaignData.negativeKeywords.length} negative keywords.
                  </p>
                </div>

                {/* Assets Logic */}
                <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                  <h4 className="font-semibold text-teal-800 mb-2">{campaignData.ads.reduce((total, ad) => total + (ad.extensions?.length || 0), 0)} Assets</h4>
                  <p className="text-sm text-teal-700">
                    Ad extensions including sitelinks, callouts, structured snippets, and call extensions. 
                    These enhance ad visibility and click-through rates.
                  </p>
                </div>
              </div>

              {/* CSV Export Info */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  CSV Export Format
                </h4>
                <p className="text-sm text-green-700">
                  Master 183-column Google Ads Editor format. Includes campaign settings, ad groups, keywords, RSA ads, 
                  location targeting ({locationInfo.count} {locationInfo.type.toLowerCase()}), and all extensions. 
                  Ready for direct import into Google Ads Editor.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Primary Action Section */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleDownloadCSV}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-200/50 h-14 text-lg font-semibold"
          >
            <Download className="w-5 h-5 mr-2" />
            Download CSV for Google Ads Editor
          </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Dispatch custom event for App.tsx to handle
                  const event = new CustomEvent('navigate', { detail: { tab: 'campaign-history' } });
                  window.dispatchEvent(event);
                  
                  // Fallback: Update URL hash
                  if (window.location.hash !== '#campaign-history') {
                    window.location.hash = '#campaign-history';
                  }
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-200/50 h-14 text-lg font-semibold"
          >
                <FolderOpen className="w-5 h-5 mr-2" />
                View Saved Campaigns
              </Button>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(6)}
              className="border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Review
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Reset and start new campaign
              window.location.reload();
            }}
              className="border-slate-300 hover:bg-slate-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Another Campaign
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Dispatch custom event for App.tsx to handle
              const event = new CustomEvent('navigate', { detail: { tab: 'dashboard' } });
              window.dispatchEvent(event);
              
              // Fallback: Update URL hash
              if (window.location.hash !== '#dashboard') {
                window.location.hash = '#dashboard';
              }
              
              // Additional fallback: Try direct navigation after a short delay
              setTimeout(() => {
                const event2 = new CustomEvent('navigate', { detail: { tab: 'dashboard' } });
                window.dispatchEvent(event2);
              }, 100);
            }}
              className="border-slate-300 hover:bg-slate-50"
          >
            Go to Dashboard
          </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderStep7 = () => (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 flex items-center justify-end">
        <div className="text-sm text-slate-500 mr-4">CSV generation step - no inputs to fill</div>
      </div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">CSV Generation</h2>
        <p className="text-slate-600">Generate your campaign CSV for Google Ads Editor</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>CSV Headers</CardTitle>
          <CardDescription>Brief overview of CSV structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['Campaign', 'Ad Group', 'Row Type', 'Final URL', 'Headline 1', 'Description 1', 'Status'].map(header => (
              <Badge key={header} variant="outline">{header}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerateCSV} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
            Generate CSV
          </Button>
        </CardContent>
      </Card>

      {campaignData.csvData && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            <CardTitle className="text-green-600">CSV Ready</CardTitle>
            </div>
            <CardDescription>Your CSV is ready for export</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button onClick={handleSaveCampaign} className="w-full" size="lg">
                <Star className="w-5 h-5 mr-2" />
              Save Campaign & Go to Dashboard
            </Button>
              <Button 
                variant="outline" 
                onClick={handleDownloadCSV}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inline Navigation */}
      <div className="flex justify-between items-center pt-4 mt-6 border-t border-slate-200">
        <Button variant="outline" onClick={() => setCurrentStep(5)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleGenerateCSV} disabled={loading || !!campaignData.csvData}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
          {campaignData.csvData ? 'CSV Generated' : 'Generate CSV'}
        </Button>
      </div>
    </div>
  );

  // Progress bar
  const steps = [
    { id: 1, label: 'URL Input' },
    { id: 2, label: 'Structure' },
    { id: 3, label: 'Keywords' },
    { id: 4, label: 'Ads & Extensions' },
    { id: 5, label: 'Geo Target' },
    { id: 6, label: 'Success' },
  ];

  // Reset campaign function
  const handleResetCampaign = () => {
    if (!confirm('Are you sure you want to reset the campaign? All progress will be lost.')) {
      return;
    }
    
    setEditingCampaignName(false);
    setCampaignData({
      url: '',
      campaignName: generateDefaultCampaignName(),
      intent: null,
      vertical: null,
      cta: null,
      selectedStructure: 'skag',
      structureRankings: [],
      seedKeywords: [],
      negativeKeywords: [...DEFAULT_NEGATIVE_KEYWORDS],
      generatedKeywords: [],
      selectedKeywords: [],
      keywordTypes: { broad: true, phrase: true, exact: true, negative: true },
      ads: [],
      adTypes: ['rsa', 'dki'],
      extensions: [],
      adGroups: [],
      selectedAdGroup: 'ALL_AD_GROUPS',
      targetCountry: 'United States',
      locations: { countries: [], states: [], cities: [], zipCodes: [] },
      csvData: null,
      csvErrors: [],
    });
    setCurrentStep(1);
    setCampaignSaved(false);
    
    notifications.success('Campaign reset successfully', {
      title: 'Reset Complete',
      description: 'You can now start creating a new campaign from scratch.'
    });
  };

  // Navigation handler for Next button
  const handleNextStep = () => {
    if (currentStep === 1) handleUrlSubmit();
    else if (currentStep === 2) handleNextFromStructure();
    else if (currentStep === 3) {
      // Validation: Check if seed keywords are entered
      if (campaignData.seedKeywords.length === 0) {
        notifications.error('Please enter seed keywords before proceeding', { 
          title: 'Seed Keywords Required',
          description: 'Add at least one seed keyword to generate keyword variations.'
        });
        return;
      }
      
      // Validation: Check if keywords have been generated
      if (campaignData.generatedKeywords.length === 0) {
        notifications.error('Please click "Generate Keywords" before proceeding', { 
          title: 'Keywords Not Generated',
          description: 'You must generate keywords using the Generate Keywords button before moving to the next step.'
        });
        return;
      }
      
      // Ensure SKAG structure is set when coming from keywords to ads wizard
      setCampaignData(prev => ({
        ...prev,
        selectedStructure: prev.selectedStructure || 'skag',
      }));
      setCurrentStep(4);
    }
    else if (currentStep === 4) {
      if (campaignData.ads.length === 0) {
        notifications.warning('Please generate ads first', { title: 'Ads Required' });
        return;
      }
      setCurrentStep(5);
    }
    else if (currentStep === 5) {
      handleSaveCampaign();
      setCurrentStep(6);
    }
    else if (currentStep === 6) {
      // Success screen - no action needed
    }
  };

  // Navigation handler for Back button
  const handleBackStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50">
      {/* Navigation Above Wizard */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBackStep}
              disabled={currentStep === 1}
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleResetCampaign}
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Campaign
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={loading || currentStep === 6}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {currentStep === 5 ? 'Save & Finish' : currentStep === 6 ? 'Download CSV' : 'Next Step'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-[57px] z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max">
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center flex-shrink-0">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base ${
                      currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <span className={`ml-2 text-xs sm:text-sm font-medium whitespace-nowrap ${
                    currentStep === step.id ? 'text-indigo-600' : 'text-slate-600'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 sm:mx-4 min-w-[20px] ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Top Navigation (Legacy - keeping for compatibility) */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleBackStep}
              disabled={currentStep === 1}
            size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          <span className="text-sm text-slate-600">
            Step {currentStep} of {steps.length}
          </span>
            <Button
              onClick={handleNextStep}
              disabled={loading || currentStep === 6}
            size="sm"
            >
            {currentStep === 5 ? 'Save & Finish' : currentStep === 6 ? 'Download CSV' : 'Next Step'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

      {/* Content */}
      <div className="py-8">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep8()}
      </div>

        
        {/* Call Only Ad Dialog */}
        <Dialog open={showCallAdDialog} onOpenChange={setShowCallAdDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                Call Only Ad Details
              </DialogTitle>
              <DialogDescription>
                Enter the business phone number and name for your call-only ad.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="call-phone">Phone Number *</Label>
                <Input
                  id="call-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={callAdPhone}
                  onChange={(e) => setCallAdPhone(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Enter the phone number customers will call. Premium rate numbers are not allowed.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="call-business">Business Name (max 25 chars)</Label>
                <Input
                  id="call-business"
                  type="text"
                  placeholder="Your Business Name"
                  maxLength={25}
                  value={callAdBusinessName}
                  onChange={(e) => setCallAdBusinessName(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  {callAdBusinessName.length}/25 characters
                </p>
              </div>
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setShowCallAdDialog(false);
                setCallAdPhone('');
                setCallAdBusinessName('');
              }}>
                Cancel
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setCallAdPhone('(555) 123-4567');
                  handleCreateCallAd();
                }}
              >
                Skip (Use Defaults)
              </Button>
              <Button 
                onClick={handleCreateCallAd}
                disabled={!callAdPhone.trim()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Phone className="w-4 h-4 mr-2" />
                Create Ad
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Export Campaign CSV</DialogTitle>
              <DialogDescription>
                Review your campaign export details before downloading
              </DialogDescription>
            </DialogHeader>
            
            {getExportStatistics() && (() => {
              const stats = getExportStatistics()!;
              
              return (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{stats.campaigns}</div>
                    <div className="text-sm text-slate-600">Campaigns</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{stats.adGroups}</div>
                    <div className="text-sm text-slate-600">Ad Groups</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{stats.keywords}</div>
                    <div className="text-sm text-slate-600">Keywords</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{stats.ads}</div>
                    <div className="text-sm text-slate-600">Ads</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{stats.negativeKeywords}</div>
                    <div className="text-sm text-slate-600">Negative Keywords</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">{stats.extensions}</div>
                    <div className="text-sm text-slate-600">Extensions</div>
                  </div>
                  <div className="p-4 border rounded-lg col-span-2">
                    <div className="text-2xl font-bold text-indigo-600">{stats.locations}</div>
                    <div className="text-sm text-slate-600">Locations (Countries, States, Cities, Zip Codes)</div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-600">Total CSV Rows</div>
                  <div className="text-xl font-semibold text-slate-800">{stats.totalRows}</div>
                </div>
              </div>
              );
            })()}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmDownloadCSV} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
};

// Helper functions
function detectVertical(landingData: LandingPageExtractionResult): string {
  const text = (landingData.title || '') + ' ' + (landingData.h1 || '') + ' ' + landingData.page_text_tokens.join(' ');
  const lowerText = text.toLowerCase();
  const domain = (landingData.domain || '').toLowerCase();

  // Travel & Tourism
  if (lowerText.includes('flight') || lowerText.includes('hotel') || lowerText.includes('booking') || 
      lowerText.includes('travel') || lowerText.includes('airline') || lowerText.includes('resort') ||
      lowerText.includes('vacation') || lowerText.includes('destination') || domain.includes('flight') || 
      domain.includes('hotel') || domain.includes('travel')) {
    return 'Travel';
  }

  // E-commerce / Shopping
  if (lowerText.includes('product') || lowerText.includes('shop') || lowerText.includes('buy') || 
      lowerText.includes('cart') || lowerText.includes('store') || lowerText.includes('ecommerce') ||
      lowerText.includes('checkout') || lowerText.includes('order') || lowerText.includes('shipping') ||
      domain.includes('shop') || domain.includes('store') || domain.includes('amazon') || domain.includes('ebay')) {
    return 'E-commerce';
  }

  // Healthcare
  if (lowerText.includes('health') || lowerText.includes('medical') || lowerText.includes('doctor') ||
      lowerText.includes('hospital') || lowerText.includes('clinic') || lowerText.includes('pharmacy') ||
      domain.includes('health') || domain.includes('medical')) {
    return 'Healthcare';
  }

  // Legal
  if (lowerText.includes('law') || lowerText.includes('legal') || lowerText.includes('attorney') ||
      lowerText.includes('lawyer') || lowerText.includes('court') || domain.includes('law')) {
    return 'Legal';
  }

  // Real Estate
  if (lowerText.includes('real estate') || lowerText.includes('property') || lowerText.includes('home') ||
      lowerText.includes('apartment') || lowerText.includes('house') || lowerText.includes('rent') ||
      domain.includes('real-estate') || domain.includes('property')) {
    return 'Real Estate';
  }

  // Finance
  if (lowerText.includes('bank') || lowerText.includes('financial') || lowerText.includes('loan') ||
      lowerText.includes('investment') || lowerText.includes('insurance') || domain.includes('finance') ||
      domain.includes('bank')) {
    return 'Finance';
  }

  // Education
  if (lowerText.includes('school') || lowerText.includes('university') || lowerText.includes('course') ||
      lowerText.includes('training') || lowerText.includes('education') || domain.includes('education')) {
    return 'Education';
  }

  // Services
  if (lowerText.includes('service') || lowerText.includes('consulting') || lowerText.includes('agency') ||
      lowerText.includes('repair') || lowerText.includes('maintenance')) {
    return 'Services';
  }

  return 'General';
}

function detectCTA(landingData: LandingPageExtractionResult, vertical?: string): string {
  const text = (landingData.title || '') + ' ' + (landingData.h1 || '') + ' ' + landingData.page_text_tokens.join(' ');
  const lowerText = text.toLowerCase();

  // For Travel vertical, "Book" is the primary CTA
  if (vertical === 'Travel') {
    // Travel sites typically have booking functionality
    if (lowerText.includes('book') || lowerText.includes('reserve') || lowerText.includes('booking') ||
        lowerText.includes('reservation') || lowerText.includes('schedule') || lowerText.includes('search flight') ||
        lowerText.includes('search hotel') || lowerText.includes('find flight') || lowerText.includes('find hotel')) {
      return 'Book';
    }
    // Default for travel is Book
    return 'Book';
  }

  // Booking/Reservation specific
  if (lowerText.includes('book') || lowerText.includes('reserve') || lowerText.includes('booking') ||
      lowerText.includes('reservation') || lowerText.includes('schedule')) {
    return 'Book';
  }

  // Call-based
  if (lowerText.includes('call') || lowerText.includes('phone') || landingData.phones?.length > 0) {
    return 'Call';
  }

  // Contact/Lead
  if (lowerText.includes('contact') || lowerText.includes('form') || lowerText.includes('quote') ||
      lowerText.includes('inquiry') || lowerText.includes('request')) {
    return 'Contact/Lead';
  }

  // Purchase/Buy
  if (lowerText.includes('buy') || lowerText.includes('purchase') || lowerText.includes('order') ||
      lowerText.includes('checkout') || lowerText.includes('add to cart')) {
    return 'Purchase';
  }

  // Download
  if (lowerText.includes('download') || lowerText.includes('get started')) {
    return 'Download';
  }

  // Search/Browse
  if (lowerText.includes('search') || lowerText.includes('explore') || lowerText.includes('browse')) {
    return 'Search';
  }

  return 'Visit';
}

async function generateSeedKeywords(
  landingData: LandingPageExtractionResult,
  intent: IntentResult
): Promise<string[]> {
  try {
    // Build context from landing page data
    const context = [
      landingData.title || '',
      landingData.h1 || '',
      landingData.metaDescription || '',
      landingData.services.join(', ') || '',
      landingData.page_text_tokens?.slice(0, 50).join(' ') || ''
    ].filter(Boolean).join(' ');

    // Call server endpoint for AI seed keyword generation
    const response = await fetch('/api/ai/generate-seed-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        vertical: intent.intentLabel || 'General',
        services: landingData.services.slice(0, 5),
        pageText: landingData.page_text_tokens?.slice(0, 30).join(' ') || '',
        maxKeywords: 5
      })
    });

    const data = await response.json();
    
    if (data.keywords && Array.isArray(data.keywords) && data.keywords.length > 0) {
      console.log('✅ AI generated seed keywords:', data.keywords);
      return data.keywords.slice(0, 5);
    }
  } catch (error) {
    console.warn('AI seed keyword generation failed, using fallback:', error);
  }

  // Fallback: Generate keywords from landing page content if AI fails
  const keywords: string[] = [];
  const domain = landingData.domain?.replace(/^www\./, '').split('.')[0] || '';
  
  const mainTerms = [
    landingData.title,
    landingData.h1,
    ...landingData.services.slice(0, 3),
  ].filter(Boolean);

  // Extract meaningful keywords from terms
  mainTerms.forEach(term => {
    if (term && keywords.length < 5) {
      const cleanTerm = term.toLowerCase().trim();
      if (cleanTerm.length >= 3 && cleanTerm.length <= 50) {
        keywords.push(cleanTerm);
      }
    }
  });

  // Add intent-based keywords
  const baseTerm = mainTerms[0]?.toLowerCase() || domain;
  if (baseTerm && keywords.length < 5) {
    if (intent.intentId === IntentId.CALL) {
      keywords.push(`${baseTerm} phone number`);
    } else if (intent.intentId === IntentId.LEAD) {
      keywords.push(`${baseTerm} quote`);
    } else {
      keywords.push(`${baseTerm} near me`);
    }
  }

  // Add domain-based fallback if still not enough
  if (keywords.length < 4 && domain) {
    keywords.push(domain);
    keywords.push(`${domain} services`);
  }

  return keywords.slice(0, 5);
}

function rankCampaignStructures(intent: IntentResult, vertical: string): { id: string; score: number }[] {
  // AI-based ranking logic - enhanced for different verticals
  const scores: { [key: string]: number } = {};

  // Initialize all structures with base score
  CAMPAIGN_STRUCTURES.forEach(struct => {
    scores[struct.id] = 1; // Everyone starts at 1
  });

  // ===== VERTICAL-SPECIFIC SCORING =====
  
  if (vertical === 'Travel') {
    // Travel/Booking sites benefit from funnel, intent-based, and seasonal
    scores['funnel'] += 5;        // TOF/MOF/BOF for awareness → consideration → booking
    scores['intent'] += 4;         // Search intent matters (flights vs hotels)
    scores['seasonal'] += 4;       // Seasonal variations (holidays, summer)
    scores['stag'] += 3;           // Theme grouping (destinations)
    scores['alpha_beta'] += 2;     // A/B testing for offers
  } 
  else if (vertical === 'E-commerce') {
    // E-commerce needs brand split and funnel
    scores['funnel'] += 5;         // Awareness → Consideration → Purchase
    scores['brand_split'] += 4;    // Brand vs product keywords
    scores['mix'] += 3;            // Mixed approach
    scores['seasonal'] += 3;       // Holiday campaigns
  } 
  else if (vertical === 'Healthcare') {
    // Healthcare is local and intent-driven
    scores['geo'] += 5;            // Local doctors/hospitals matter
    scores['intent'] += 4;         // Specific health issues/services
    scores['skag'] += 3;           // Single keyword groups work well
    scores['stag'] += 3;           // Theme-based (symptoms/services)
  } 
  else if (vertical === 'Real Estate') {
    // Real estate is heavily location-based
    scores['geo'] += 5;            // Location is everything
    scores['intent'] += 4;         // Buy vs rent intent
    scores['brand_split'] += 3;    // Brand vs properties
    scores['stag'] += 3;           // Theme by property type
  } 
  else if (vertical === 'Legal') {
    // Legal is service + expertise + location
    scores['geo'] += 4;            // Local laws matter
    scores['intent'] += 4;         // Type of legal service
    scores['skag'] += 3;           // Specific legal terms
    scores['stag'] += 3;           // Service types
  } 
  else if (vertical === 'Finance') {
    // Finance benefits from intent and funnel
    scores['funnel'] += 4;         // Awareness → Research → Apply
    scores['intent'] += 4;         // Loan type, product type
    scores['brand_split'] += 3;    // Brand vs product offers
  } 
  else if (vertical === 'Education') {
    // Education is funnel + seasonal
    scores['funnel'] += 4;         // Awareness → Consideration → Enrollment
    scores['seasonal'] += 4;       // Enrollment cycles
    scores['intent'] += 3;         // Degree/course type
    scores['stag'] += 3;           // Program themes
  } 
  else if (vertical === 'Services') {
    // Generic services benefit from geo + intent
    scores['geo'] += 4;            // Local services
    scores['intent'] += 4;         // Type of service
    scores['skag'] += 3;           // Specific services
    scores['stag'] += 3;           // Service categories
  }

  // ===== INTENT-SPECIFIC SCORING (applied after vertical) =====
  
  if (intent.intentId === IntentId.CALL) {
    // Phone-based CTAs
    scores['geo'] += 2;            // Local calls matter
    scores['skag'] += 2;           // Specific keyword calls
    scores['match_type'] += 1;     // Match type variations help
  } 
  else if (intent.intentId === IntentId.LEAD) {
    // Form/quote submissions
    scores['funnel'] += 2;         // Lead funnel
    scores['stag'] += 2;           // Theme grouping
    scores['intent'] += 2;         // Intent variations
  } 
  else if (intent.intentId === IntentId.PURCHASE) {
    // E-commerce purchase intent
    scores['funnel'] += 2;         // Shopping funnel
    scores['brand_split'] += 2;    // Brand keywords matter
  }

  // ===== EDGE CASE: Prevent zero-score structures =====
  // Ensure top structures have clear differentiation
  const sortedScores = Object.entries(scores)
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);

  // If top structures are too close, add small tiebreaker
  if (sortedScores.length > 1 && sortedScores[0].score === sortedScores[1].score) {
    // Add small bonus to first one for consistency
    const topId = sortedScores[0].id;
    sortedScores[0].score += 0.5;
  }

  return sortedScores;
}

function detectIsProduct(url: string, intent: IntentResult | null): boolean {
  // Simple detection - can be enhanced
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('shop') || lowerUrl.includes('product') || lowerUrl.includes('buy') || 
         (intent?.intentId === IntentId.PURCHASE);
}


