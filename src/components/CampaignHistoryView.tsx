import React, { useState, useEffect } from 'react';
import { 
  FileText, Clock, Eye, Trash2, Search, AlertCircle,
  CheckCircle2, Download, FolderOpen, Plus, Sparkles,
  LayoutGrid, List, RefreshCw, Filter, X, ChevronDown,
  ArrowUp, ArrowDown, Link2, Unlink, Upload, Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TerminalCard, TerminalLine } from './ui/terminal-card';
import { historyService } from '../utils/historyService';
import { notifications } from '../utils/notifications';
import { getStatusBadgeClasses, getStructureBadgeClasses } from '../utils/badgeTheme';
import { campaignStructureToCSVRows, GOOGLE_ADS_EDITOR_HEADERS } from '../utils/googleAdsEditorCSVExporter';
import { validateAndFixAds, formatValidationReport } from '../utils/adValidationUtils';
import Papa from 'papaparse';

interface GoogleAdsAccount {
  id: string;
  name: string;
}

const STRUCTURE_TYPES = [
  { id: 'skag', name: 'SKAG' },
  { id: 'stag', name: 'STAG' },
  { id: 'mix', name: 'MIX' },
  { id: 'stag_plus', name: 'STAG Plus' },
  { id: 'intent', name: 'Intent-Based' },
  { id: 'alpha_beta', name: 'Alpha/Beta' },
  { id: 'match_type', name: 'Match Type Split' },
  { id: 'funnel', name: 'Funnel-Based' },
  { id: 'brand_split', name: 'Brand Split' },
  { id: 'competitor', name: 'Competitor-Based' },
  { id: 'ngram', name: 'N-Gram' }
];

const STATUS_OPTIONS = [
  { id: 'all', name: 'All Status' },
  { id: 'draft', name: 'Draft' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'completed', name: 'Completed' },
  { id: 'started', name: 'Started' }
];

const STEP_OPTIONS = [
  { id: 'all', name: 'All Steps' },
  { id: '1', name: 'Setup' },
  { id: '2', name: 'Keywords' },
  { id: '3', name: 'Ads & Extensions' },
  { id: '4', name: 'Geo Target' },
  { id: '5', name: 'Review' },
  { id: '6', name: 'Validate' }
];

interface CampaignHistoryViewProps {
  onLoadCampaign: (data: any) => void;
}

interface SavedCampaign {
  id: string;
  name: string;
  timestamp: string;
  data: any;
  status?: 'draft' | 'completed' | 'in_progress';
}

interface HistoryEntry {
  id: string;
  type: string;
  name: string;
  timestamp: string;
  data: any;
  status?: string;
}

export const CampaignHistoryView: React.FC<CampaignHistoryViewProps> = ({ onLoadCampaign }) => {
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [allHistory, setAllHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const [filterStructure, setFilterStructure] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStep, setFilterStep] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [googleAdsConnected, setGoogleAdsConnected] = useState(false);
  const [googleAdsLoading, setGoogleAdsLoading] = useState(true);
  const [googleAdsAccounts, setGoogleAdsAccounts] = useState<GoogleAdsAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [pushingCampaign, setPushingCampaign] = useState<string | null>(null);
  const [pushError, setPushError] = useState<{ campaignId: string; message: string } | null>(null);
  const [pushSuccess, setPushSuccess] = useState<{ campaignId: string; message: string } | null>(null);

  useEffect(() => {
    loadSavedCampaigns();
    checkGoogleAdsConnection();
    
    // Check for OAuth callback - refresh connection status when returning from Google OAuth
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('oauth') === 'success' || urlParams.get('code')) {
      // Clear URL params and refresh connection status
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => checkGoogleAdsConnection(), 500);
    }
    
    // Also listen for window focus to refresh connection status (in case OAuth opened in popup)
    const handleFocus = () => {
      checkGoogleAdsConnection();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const checkGoogleAdsConnection = async () => {
    try {
      setGoogleAdsLoading(true);
      const response = await fetch('/api/google-ads/status');
      const data = await response.json();
      setGoogleAdsConnected(data.connected);
      
      if (data.connected) {
        const accountsResponse = await fetch('/api/google-ads/accounts');
        const accountsData = await accountsResponse.json();
        if (accountsData.accounts) {
          setGoogleAdsAccounts(accountsData.accounts.map((acc: string) => ({
            id: acc.replace('customers/', ''),
            name: `Account ${acc.replace('customers/', '')}`
          })));
        }
      }
    } catch (err) {
      console.error('Failed to check Google Ads connection:', err);
    } finally {
      setGoogleAdsLoading(false);
    }
  };

  const connectGoogleAds = async () => {
    try {
      const response = await fetch('/api/google-ads/auth-url');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        notifications.error('Could not get Google Ads auth URL', { title: 'Connection Error' });
      }
    } catch (err) {
      console.error('Failed to get auth URL:', err);
      notifications.error('Failed to connect to Google Ads', { title: 'Connection Error' });
    }
  };

  const pushCampaignToGoogleAds = async (campaign: SavedCampaign) => {
    if (!selectedAccount) {
      notifications.error('Please select a Google Ads account first', { title: 'No Account Selected' });
      return;
    }

    setPushingCampaign(campaign.id);
    setPushError(null);
    setPushSuccess(null);

    try {
      const data = campaign.data || campaign;
      
      const response = await fetch('/api/google-ads/push-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedAccount,
          campaign: {
            name: campaign.name || data.campaignName,
            adGroups: data.adGroups || [],
            ads: data.ads || data.generatedAds || [],
            keywords: data.selectedKeywords || [],
            negativeKeywords: data.negativeKeywords || [],
            url: data.url || '',
            targetCountry: data.targetCountry || 'United States',
            locations: data.locations || {}
          }
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || result.message || 'Failed to push campaign');
      }

      setPushSuccess({
        campaignId: campaign.id,
        message: `Campaign "${campaign.name}" pushed successfully! It's now paused in your Google Ads account.`
      });
      
      notifications.success('Campaign pushed to Google Ads (Paused)', {
        title: 'Success',
        description: 'Your campaign is now in your Google Ads account and is paused. Review and enable it when ready.'
      });
    } catch (err: any) {
      console.error('Failed to push campaign:', err);
      setPushError({
        campaignId: campaign.id,
        message: err.message || 'Failed to push campaign to Google Ads'
      });
      notifications.error(err.message || 'Failed to push campaign', { title: 'Push Error' });
    } finally {
      setPushingCampaign(null);
    }
  };

  const loadSavedCampaigns = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const historyItems = await historyService.getAll();
      
      console.log('📋 All history items:', historyItems);
      console.log('📋 History items count:', historyItems.length);
      
      // Store ALL history items for the History tab (sorted by timestamp, newest first)
      const sortedHistory = [...historyItems].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setAllHistory(sortedHistory);
      
      // Filter for campaigns only (for Saved Campaigns tab)
      const campaigns = historyItems.filter(item => {
        const type = (item.type || '').toLowerCase();
        const matches = type === 'builder-2-campaign' || 
               type === 'campaign' ||
               type === 'builder-2' ||
               type.includes('campaign') ||
               type.includes('builder');
        
        if (historyItems.length > 0) {
          console.log(`🔍 Filtering item: type="${item.type}" (normalized: "${type}"), matches=${matches}`);
        }
        
        return matches;
      }).map(item => ({
        id: item.id,
        name: item.name,
        timestamp: item.timestamp,
        data: item.data,
        status: item.status || 'completed'
      }));

      console.log('✅ Filtered campaigns:', campaigns);
      console.log('✅ Campaign count:', campaigns.length);

      campaigns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setSavedCampaigns(campaigns);
    } catch (error) {
      console.error('Failed to load saved campaigns', error);
      setError(error instanceof Error ? error.message : 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      await historyService.delete(id);
      setSavedCampaigns(savedCampaigns.filter(c => c.id !== id));
      notifications.success('Campaign deleted successfully', { title: 'Deleted' });
    } catch (error) {
      console.error('Failed to delete campaign', error);
      notifications.error('Failed to delete campaign', { title: 'Error' });
    }
  };

  const handleRegenerateCSV = async (campaign: SavedCampaign) => {
    try {
      const data = campaign.data || campaign;
      
      notifications.info('Regenerating CSV...', {
        title: 'CSV Generation',
        description: 'Please wait while we regenerate your CSV file.',
        duration: 3000
      });

      if (data.csvData) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                          new Date().toTimeString().split(' ')[0].replace(/:/g, '-').substring(0, 8);
        const campaignName = (campaign.name || data.campaignName || 'campaign').replace(/[^a-z0-9]/gi, '_');
        const filename = `${campaignName}_google_ads_editor_${timestamp}.csv`;
        
        const blob = new Blob([data.csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        notifications.success('CSV downloaded successfully', {
          title: 'Download Complete',
          description: `File: ${filename}`
        });
        return;
      }

      const adGroups = data.adGroups || [];
      if (adGroups.length === 0) {
        notifications.error('No ad groups found in campaign', {
          title: 'Cannot Generate CSV',
          description: 'This campaign does not have ad groups. Please continue editing the campaign first.'
        });
        return;
      }

      const { ads: validatedAds, report: validationReport } = validateAndFixAds(data.ads || []);
      
      if (validationReport.fixed > 0) {
        console.log('Ad validation report:', formatValidationReport(validationReport));
      }
      
      const convertedAds = validatedAds.map((ad: any) => {
        const convertedAd: any = {
          type: ad.type === 'rsa' ? 'rsa' : ad.type === 'dki' ? 'dki' : 'callonly',
          final_url: ad.finalUrl || data.url || '',
          path1: (ad.displayPath && Array.isArray(ad.displayPath) ? ad.displayPath[0] : '') || ad.path1 || '',
          path2: (ad.displayPath && Array.isArray(ad.displayPath) ? ad.displayPath[1] : '') || ad.path2 || '',
        };
        
        if (ad.headlines && Array.isArray(ad.headlines)) {
          ad.headlines.forEach((headline: string, idx: number) => {
            if (idx < 15 && headline && headline.trim()) {
              convertedAd[`headline${idx + 1}`] = headline.trim().substring(0, 30);
            }
          });
        } else {
          if (ad.headline1) convertedAd.headline1 = ad.headline1.trim().substring(0, 30);
          if (ad.headline2) convertedAd.headline2 = ad.headline2.trim().substring(0, 30);
          if (ad.headline3) convertedAd.headline3 = ad.headline3.trim().substring(0, 30);
          if (ad.headline4) convertedAd.headline4 = ad.headline4.trim().substring(0, 30);
          if (ad.headline5) convertedAd.headline5 = ad.headline5.trim().substring(0, 30);
        }
        
        if (ad.extensions) convertedAd.extensions = ad.extensions;
        
        return convertedAd;
      });

      const structure = {
        campaigns: [{
          campaign_name: data.campaignName || campaign.name || 'Campaign',
          adgroups: adGroups.map((group: any) => ({
            adgroup_name: group.name || 'Default Ad Group',
            keywords: (group.keywords || []).map((kw: any) => {
              if (typeof kw === 'string') return kw;
              return kw.text || kw.keyword || String(kw);
            }).filter((kw: string) => kw && kw.trim().length > 0),
            match_types: [],
            ads: convertedAds.length > 0 ? convertedAds : [{
              type: 'rsa' as const,
              headline1: 'Professional Service',
              headline2: 'Expert Solutions',
              headline3: 'Quality Guaranteed',
              description1: 'Get professional service you can trust.',
              description2: 'Contact us today for expert assistance.',
              final_url: data.url || 'https://example.com',
              path1: '',
              path2: ''
            }],
            negative_keywords: (group.negativeKeywords || data.negativeKeywords || []).map((neg: any) => {
              if (typeof neg === 'string') {
                return neg.startsWith('-') ? neg : `-${neg}`;
              }
              const negText = neg.text || neg.keyword || String(neg);
              return negText.startsWith('-') ? negText : `-${negText}`;
            }).filter((neg: string) => neg && neg.trim().length > 0),
          })),
          states: data.locations?.states || [],
          cities: data.locations?.cities || [],
          zip_codes: data.locations?.zipCodes || [],
          targetCountry: data.targetCountry || 'United States',
          budget: '100',
          budget_type: 'Daily',
          bidding_strategy: 'Manual CPC',
          start_date: '',
          end_date: '',
          location_type: 'COUNTRY',
          location_code: (data.targetCountry === 'United States' ? 'US' : (data.targetCountry || 'US').substring(0, 2).toUpperCase()),
        }]
      };

      const rows = campaignStructureToCSVRows(structure);
      
      const csv = Papa.unparse(rows, {
        columns: GOOGLE_ADS_EDITOR_HEADERS,
        header: true,
        newline: '\r\n',
      });
      
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csv;
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                        new Date().toTimeString().split(' ')[0].replace(/:/g, '-').substring(0, 8);
      const campaignName = (campaign.name || data.campaignName || 'campaign').replace(/[^a-z0-9]/gi, '_');
      const filename = `${campaignName}_google_ads_editor_${timestamp}.csv`;
      
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      notifications.success('CSV regenerated and downloaded', {
        title: 'Download Complete',
        description: `File: ${filename}`
      });
    } catch (error) {
      console.error('CSV regeneration error:', error);
      notifications.error('Failed to regenerate CSV', {
        title: 'Generation Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLabel = status === 'in_progress' ? 'In Progress' : 
                        status === 'completed' ? 'Completed' :
                        status === 'draft' ? 'Draft' :
                        status === 'started' ? 'Started' : 'Unknown';
    return <Badge className={getStatusBadgeClasses(status)}>{statusLabel}</Badge>;
  };

  const getStepLabel = (stepNum: number) => {
    const steps = ['Setup', 'Keywords', 'Ads & Extensions', 'Geo Target', 'Review', 'Validate'];
    return steps[stepNum - 1] || 'Unknown';
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterStructure('all');
    setFilterStatus('all');
    setFilterStep('all');
  };

  const hasActiveFilters = searchQuery || filterStructure !== 'all' || filterStatus !== 'all' || filterStep !== 'all';

  const filteredCampaigns = savedCampaigns.filter(campaign => {
    const data = campaign.data || campaign;
    const name = campaign.name || data.campaignName || '';
    const structure = data.structureType || '';
    const status = campaign.status || data.status || 'started';
    const step = String(data.step || 1);
    
    const matchesSearch = !searchQuery || 
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      structure.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStructure = filterStructure === 'all' || structure === filterStructure;
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    const matchesStep = filterStep === 'all' || step === filterStep;
    
    return matchesSearch && matchesStructure && matchesStatus && matchesStep;
  }).sort((a, b) => {
    const aData = a.data || a;
    const bData = b.data || b;
    let aVal: any;
    let bVal: any;

    switch (sortBy) {
      case 'name':
        aVal = (a.name || aData.campaignName || '').toLowerCase();
        bVal = (b.name || bData.campaignName || '').toLowerCase();
        break;
      case 'structure':
        aVal = aData.structureType || '';
        bVal = bData.structureType || '';
        break;
      case 'step':
        aVal = aData.step || 0;
        bVal = bData.step || 0;
        break;
      case 'keywords':
        aVal = aData.selectedKeywords?.length || 0;
        bVal = bData.selectedKeywords?.length || 0;
        break;
      case 'ads':
        aVal = aData.generatedAds?.length || 0;
        bVal = bData.generatedAds?.length || 0;
        break;
      case 'status':
        aVal = a.status || aData.status || 'started';
        bVal = b.status || bData.status || 'started';
        break;
      case 'timestamp':
      default:
        aVal = new Date(a.timestamp || aData.timestamp).getTime();
        bVal = new Date(b.timestamp || bData.timestamp).getTime();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return <div className="w-4 h-4" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-indigo-600" />
      : <ArrowDown className="w-4 h-4 text-indigo-600" />;
  };

  const loadCampaignData = (data: any) => {
    try {
      const campaignData = {
        ...data,
        ads: Array.isArray(data.ads) ? data.ads : [],
        adGroups: Array.isArray(data.adGroups) ? data.adGroups : [],
        selectedKeywords: Array.isArray(data.selectedKeywords) ? data.selectedKeywords : [],
        generatedKeywords: Array.isArray(data.generatedKeywords) ? data.generatedKeywords : [],
        seedKeywords: Array.isArray(data.seedKeywords) ? data.seedKeywords : [],
        negativeKeywords: Array.isArray(data.negativeKeywords) ? data.negativeKeywords : [],
        locations: data.locations && typeof data.locations === 'object' ? data.locations : {
          countries: [],
          states: [],
          cities: [],
          zipCodes: []
        }
      };
      onLoadCampaign(campaignData);
    } catch (error) {
      console.error('Error loading campaign:', error);
      notifications.error('Failed to load campaign', {
        title: 'Load Error',
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Google Ads Connection Card */}
        <Card className={`mb-6 border-2 ${googleAdsConnected ? 'border-indigo-200 bg-indigo-50' : 'border-blue-200 bg-blue-50'}`}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${googleAdsConnected ? 'bg-indigo-100' : 'bg-blue-100'}`}>
                  {googleAdsLoading ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : googleAdsConnected ? (
                    <Link2 className="w-6 h-6 text-indigo-600" />
                  ) : (
                    <Unlink className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className={`font-semibold ${googleAdsConnected ? 'text-green-800' : 'text-blue-800'}`}>
                    {googleAdsLoading ? 'Checking Connection...' : googleAdsConnected ? 'Google Ads Connected' : 'Connect Google Ads'}
                  </h3>
                  <p className={`text-sm ${googleAdsConnected ? 'text-indigo-600' : 'text-blue-600'}`}>
                    {googleAdsConnected 
                      ? 'Push campaigns directly to your Google Ads account' 
                      : 'Connect your Google Ads account to push campaigns with one click'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {googleAdsConnected && googleAdsAccounts.length > 0 && (
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger className="w-[200px] bg-white">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-[9999]">
                      {googleAdsAccounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {!googleAdsLoading && (
                  <div className="relative">
                    <Button
                      disabled
                      className="bg-gray-400 cursor-not-allowed text-white opacity-70"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Connect Account
                    </Button>
                    <Badge className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5">Coming Soon</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Error/Success Messages */}
            {pushError && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Push Failed</p>
                  <p className="text-sm text-red-700">{pushError.message}</p>
                </div>
                <button onClick={() => setPushError(null)} className="ml-auto text-red-600 hover:text-red-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {pushSuccess && (
              <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Campaign Pushed Successfully</p>
                  <p className="text-sm text-indigo-700">{pushSuccess.message}</p>
                </div>
                <button onClick={() => setPushSuccess(null)} className="ml-auto text-green-600 hover:text-green-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Saved Campaigns
              </h1>
              <p className="text-slate-600">
                All your campaigns are automatically saved. Continue where you left off or start a new one.
              </p>
            </div>
            {!loading && filteredCampaigns.length > 0 && (
              <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 px-3 ${viewMode === 'grid' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-8 px-3 ${viewMode === 'list' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Terminal-Style Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <TerminalCard title="Campaign Statistics" showDots={true} variant="compact">
            <div className="space-y-1.5">
              <TerminalLine prefix="$" label="saved_campaigns:" value={`${savedCampaigns.length}`} valueColor="green" />
              <TerminalLine prefix="$" label="filtered_results:" value={`${filteredCampaigns.length}`} valueColor="cyan" />
              <TerminalLine prefix="$" label="history_items:" value={`${allHistory.length}`} valueColor="yellow" />
              <TerminalLine prefix="$" label="view_mode:" value={viewMode.toUpperCase()} valueColor="purple" />
            </div>
          </TerminalCard>

          <TerminalCard title="Connection Status" showDots={true} variant="compact">
            <div className="space-y-1.5">
              <TerminalLine prefix=">" label="google_ads:" value={googleAdsConnected ? 'CONNECTED' : googleAdsLoading ? 'CHECKING...' : 'DISCONNECTED'} valueColor={googleAdsConnected ? 'green' : googleAdsLoading ? 'slate' : 'yellow'} />
              <TerminalLine prefix=">" label="accounts:" value={`${googleAdsAccounts.length}`} valueColor="cyan" />
              <TerminalLine prefix=">" label="selected_account:" value={selectedAccount ? selectedAccount.substring(0, 12) + '...' : 'NONE'} valueColor={selectedAccount ? 'green' : 'slate'} />
              <TerminalLine prefix=">" label="status:" value={loading ? 'LOADING' : error ? 'ERROR' : 'READY'} valueColor={loading ? 'yellow' : error ? 'yellow' : 'green'} />
            </div>
          </TerminalCard>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="saved-campaigns" className="w-full">
          <TabsList className="mb-6 bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
            <TabsTrigger 
              value="saved-campaigns" 
              className="px-6 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Saved Campaigns
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="px-6 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-md transition-all"
            >
              <Clock className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Saved Campaigns Tab */}
          <TabsContent value="saved-campaigns" className="mt-0">
            {/* Search & Filters Card */}
            <Card className="border-slate-200/60 bg-white shadow-xl mb-6">
          <CardContent className="p-4 sm:p-6">
            {/* Search Bar */}
            <div className="flex gap-3 items-center mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10" />
                <Input
                  placeholder="Search campaigns by name or structure..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 bg-white border-slate-200 h-11 text-base"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-11 px-4 gap-2 ${showFilters || hasActiveFilters ? 'bg-purple-50 border-purple-300 text-purple-700' : ''}`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <Badge className="bg-indigo-600 text-white text-xs px-1.5 py-0 ml-1">
                    {[filterStructure !== 'all', filterStatus !== 'all', filterStep !== 'all'].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Filter Dropdowns */}
            {showFilters && (
              <div className="pt-4 border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Structure Type</label>
                    <Select value={filterStructure} onValueChange={setFilterStructure}>
                      <SelectTrigger className="h-10 bg-white">
                        <SelectValue placeholder="All Structures" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-[9999]">
                        <SelectItem value="all">All Structures</SelectItem>
                        {STRUCTURE_TYPES.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Status</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-10 bg-white">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-[9999]">
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Current Step</label>
                    <Select value={filterStep} onValueChange={setFilterStep}>
                      <SelectTrigger className="h-10 bg-white">
                        <SelectValue placeholder="All Steps" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-[9999]">
                        {STEP_OPTIONS.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearAllFilters}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Results Summary */}
            {!loading && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-600">
                    Showing <span className="font-bold text-slate-900">{filteredCampaigns.length}</span> of <span className="font-semibold text-slate-700">{savedCampaigns.length}</span> campaigns
                  </p>
                  {hasActiveFilters && (
                    <Badge variant="outline" className="text-purple-600 border-purple-300 bg-purple-50">
                      Filtered
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadSavedCampaigns}
                  className="text-slate-600 hover:text-slate-900"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaigns List */}
        {loading ? (
          <Card className="border-slate-200/60 bg-white shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-slate-500">Loading campaigns...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-slate-200/60 bg-white shadow-xl">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500 opacity-50" />
              <p className="font-semibold mb-2 text-red-600">Failed to load campaigns</p>
              <p className="text-sm text-slate-500 mb-4">{error}</p>
              <Button onClick={loadSavedCampaigns} className="bg-indigo-600 hover:bg-indigo-700">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : filteredCampaigns.length === 0 ? (
          <Card className="border-slate-200/60 bg-white shadow-xl">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Campaigns Found</h3>
              <p className="text-slate-500 mb-6">
                {hasActiveFilters ? 'No campaigns match your filters. Try adjusting or clearing them.' : 'Start creating a campaign and it will be automatically saved here.'}
              </p>
              {hasActiveFilters ? (
                <Button 
                  onClick={clearAllFilters}
                  variant="outline"
                  className="border-purple-300 text-purple-600 hover:bg-purple-50"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All Filters
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    window.location.hash = '#builder-2';
                    window.location.reload();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Campaign
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign, index) => {
              const data = campaign.data || campaign;
              const status = campaign.status || data.status || 'started';
              const stepNum = data.step || 1;
              const timestamp = new Date(campaign.timestamp || data.timestamp);
              const campaignName = campaign.name || data.campaignName || 'Unnamed Campaign';
              const baseName = campaignName.replace(/\s*\(Draft\s*-\s*[^)]+\)/gi, '').replace(/\s*\(Completed\s*-\s*[^)]+\)/gi, '');
              
              return (
                <Card 
                  key={campaign.id} 
                  className="border-slate-200/60 bg-white shadow-lg hover:shadow-xl transition-all flex flex-col overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle 
                              className="text-base sm:text-lg font-semibold leading-tight line-clamp-2 break-words" 
                              title={campaignName}
                            >
                              {baseName}
                            </CardTitle>
                            {index === 0 && (
                              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-0.5 border-0 shadow-sm">
                                Latest
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusBadge(status)}
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-1.5 text-xs sm:text-sm ml-11">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                      <span className="truncate text-slate-500">{timestamp.toLocaleString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 flex flex-col">
                    <div className="space-y-2.5 flex-1 bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm gap-2">
                        <span className="text-slate-500 flex-shrink-0">Structure:</span>
                        <span className="font-medium text-slate-700 truncate text-right">
                          {STRUCTURE_TYPES.find(s => s.id === data.structureType)?.name || 'Not Selected'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm gap-2">
                        <span className="text-slate-500 flex-shrink-0">Current Step:</span>
                        <span className="font-medium text-slate-700 truncate text-right">
                          {getStepLabel(stepNum)}
                        </span>
                      </div>
                      {data.selectedKeywords && data.selectedKeywords.length > 0 && (
                        <div className="flex items-center justify-between text-sm gap-2">
                          <span className="text-slate-500 flex-shrink-0">Keywords:</span>
                          <span className="font-medium text-slate-700">{data.selectedKeywords.length}</span>
                        </div>
                      )}
                      {data.generatedAds && data.generatedAds.length > 0 && (
                        <div className="flex items-center justify-between text-sm gap-2">
                          <span className="text-slate-500 flex-shrink-0">Ads:</span>
                          <span className="font-medium text-slate-700">{data.generatedAds.length}</span>
                        </div>
                      )}
                    </div>
                    <Separator className="my-3" />
                    <div className="flex gap-2 pt-1">
                      <Button 
                        onClick={() => loadCampaignData(data)}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white min-w-0"
                      >
                        <Eye className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Continue</span>
                      </Button>
                      {googleAdsConnected && selectedAccount && (
                        <Button 
                          variant="outline"
                          onClick={() => pushCampaignToGoogleAds(campaign)}
                          disabled={pushingCampaign === campaign.id}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 flex-shrink-0 px-3"
                          title="Push to Google Ads (Paused)"
                        >
                          {pushingCampaign === campaign.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        onClick={() => handleRegenerateCSV(campaign)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex-shrink-0 px-3"
                        title="Regenerate and download CSV"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => deleteCampaign(campaign.id)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex-shrink-0 px-3"
                        title="Delete campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-slate-200/60 bg-white shadow-xl overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-4 hidden lg:block">
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                <div className="w-12 text-center">S.No</div>
                <button 
                  onClick={() => handleSort('name')}
                  className="flex-1 min-w-0 hover:text-indigo-600 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                  title="Click to sort by campaign details"
                >
                  <span>Campaign Details</span>
                  <SortIcon column="name" />
                </button>
                <button 
                  onClick={() => handleSort('structure')}
                  className="w-28 text-center hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  title="Click to sort by structure"
                >
                  <span>Structure</span>
                  <SortIcon column="structure" />
                </button>
                <button 
                  onClick={() => handleSort('step')}
                  className="w-28 text-center hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  title="Click to sort by step"
                >
                  <span>Step</span>
                  <SortIcon column="step" />
                </button>
                <button 
                  onClick={() => handleSort('keywords')}
                  className="w-20 text-center hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  title="Click to sort by keywords"
                >
                  <span>Keywords</span>
                  <SortIcon column="keywords" />
                </button>
                <button 
                  onClick={() => handleSort('ads')}
                  className="w-16 text-center hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  title="Click to sort by ads"
                >
                  <span>Ads</span>
                  <SortIcon column="ads" />
                </button>
                <button 
                  onClick={() => handleSort('status')}
                  className="w-24 text-center hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  title="Click to sort by status"
                >
                  <span>Status</span>
                  <SortIcon column="status" />
                </button>
                <div className="w-40 text-center">Actions</div>
              </div>
            </div>
            
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200">
                {filteredCampaigns.map((campaign, index) => {
                  const data = campaign.data || campaign;
                  const status = campaign.status || data.status || 'started';
                  const stepNum = data.step || 1;
                  const timestamp = new Date(campaign.timestamp || data.timestamp);
                  const campaignName = campaign.name || data.campaignName || 'Unnamed Campaign';
                  const baseName = campaignName.replace(/\s*\(Draft\s*-\s*[^)]+\)/gi, '').replace(/\s*\(Completed\s*-\s*[^)]+\)/gi, '');
                  
                  return (
                    <div 
                      key={campaign.id} 
                      className="px-6 py-4 hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Desktop View */}
                      <div className="hidden lg:flex items-center gap-4">
                        <div className="w-12 flex justify-center">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow">
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-900 truncate" title={campaignName}>
                              {baseName}
                            </h3>
                            {index === 0 && (
                              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-0.5 border-0 shadow-sm">
                                Latest
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{timestamp.toLocaleString('en-GB', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}</span>
                          </div>
                        </div>
                        <div className="w-28 text-center">
                          <Badge variant="outline" className="text-xs bg-slate-50">
                            {STRUCTURE_TYPES.find(s => s.id === data.structureType)?.name || '-'}
                          </Badge>
                        </div>
                        <div className="w-28 text-center">
                          <span className="text-sm font-medium text-slate-700">{getStepLabel(stepNum)}</span>
                        </div>
                        <div className="w-20 text-center">
                          <span className="text-sm font-semibold text-slate-900">
                            {data.selectedKeywords?.length || 0}
                          </span>
                        </div>
                        <div className="w-16 text-center">
                          <span className="text-sm font-semibold text-slate-900">
                            {data.generatedAds?.length || 0}
                          </span>
                        </div>
                        <div className="w-24 flex justify-center">
                          {getStatusBadge(status)}
                        </div>
                        <div className="w-40 flex items-center justify-end gap-1">
                          <Button 
                            onClick={() => loadCampaignData(data)}
                            size="sm"
                            className="w-8 h-8 p-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                            title="Continue editing campaign"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {googleAdsConnected && selectedAccount && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => pushCampaignToGoogleAds(campaign)}
                              disabled={pushingCampaign === campaign.id}
                              className="w-8 h-8 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              title="Push to Google Ads (Paused)"
                            >
                              {pushingCampaign === campaign.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegenerateCSV(campaign)}
                            className="w-8 h-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            title="Download CSV"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCampaign(campaign.id)}
                            className="w-8 h-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            title="Delete campaign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Mobile/Tablet View */}
                      <div className="lg:hidden">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-base font-semibold text-slate-900 line-clamp-2" title={campaignName}>
                                {baseName}
                              </h3>
                              {getStatusBadge(status)}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{timestamp.toLocaleString('en-GB', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 mb-3 ml-11">
                          <span>Structure: <span className="font-medium text-slate-700">{STRUCTURE_TYPES.find(s => s.id === data.structureType)?.name || '-'}</span></span>
                          <span>Step: <span className="font-medium text-slate-700">{getStepLabel(stepNum)}</span></span>
                          {data.selectedKeywords?.length > 0 && (
                            <span>Keywords: <span className="font-medium text-slate-700">{data.selectedKeywords.length}</span></span>
                          )}
                          {data.generatedAds?.length > 0 && (
                            <span>Ads: <span className="font-medium text-slate-700">{data.generatedAds.length}</span></span>
                          )}
                        </div>
                        <div className="flex gap-2 ml-11">
                          <Button 
                            onClick={() => loadCampaignData(data)}
                            size="sm"
                            className="w-9 h-9 p-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                            title="Continue editing campaign"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {googleAdsConnected && selectedAccount && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => pushCampaignToGoogleAds(campaign)}
                              disabled={pushingCampaign === campaign.id}
                              className="w-9 h-9 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              title="Push to Google Ads (Paused)"
                            >
                              {pushingCampaign === campaign.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegenerateCSV(campaign)}
                            className="w-9 h-9 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            title="Download CSV"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCampaign(campaign.id)}
                            className="w-9 h-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            title="Delete campaign"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-0">
            <Card className="border-slate-200/60 bg-white shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Campaign History
                </CardTitle>
                <CardDescription>
                  View your campaign activity and changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                    <p className="text-slate-600">Loading history...</p>
                  </div>
                ) : savedCampaigns.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Clock className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No History Yet</h3>
                    <p className="text-slate-500 max-w-md">
                      Your campaign activity will appear here once you start creating campaigns.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedCampaigns.map((campaign) => {
                      const data = campaign.data || campaign;
                      const timestamp = new Date(campaign.timestamp);
                      const formattedDate = timestamp.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      });
                      const formattedTime = timestamp.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <div 
                          key={campaign.id}
                          className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-slate-900 truncate">
                                {campaign.name || data.campaignName || 'Untitled Campaign'}
                              </h4>
                              {getStatusBadge(campaign.status || 'started')}
                            </div>
                            <p className="text-sm text-slate-600 mb-2">
                              {data.structureType ? `${STRUCTURE_TYPES.find(s => s.id === data.structureType)?.name || data.structureType} structure` : 'Campaign created'}
                              {data.selectedKeywords?.length > 0 && ` with ${data.selectedKeywords.length} keywords`}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formattedDate} at {formattedTime}
                              </span>
                              {data.url && (
                                <span className="truncate max-w-[200px]" title={data.url}>
                                  {data.url}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => loadCampaignData(data)}
                            className="flex-shrink-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
