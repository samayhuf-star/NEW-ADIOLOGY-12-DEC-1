import React, { useState, useMemo } from 'react';
import { Search, Download, Eye, Package, Zap, TrendingUp, X, Clock, Target, ArrowLeft } from 'lucide-react';
import { presetCampaigns, PresetCampaign } from '../data/presetCampaigns';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { notifications } from '../utils/notifications';
import { generateCampaignStructure, StructureSettings, Ad } from '../utils/campaignStructureGenerator';
import { exportCampaignToGoogleAdsEditorCSV, validateCSVRows, campaignStructureToCSVRows } from '../utils/googleAdsEditorCSVExporter';

interface PresetCampaignsProps {
  onLoadPreset?: (presetData: any) => void;
}

type StructureFilter = 'all' | 'skag' | 'stag';

function convertPresetToStructureSettings(preset: PresetCampaign): StructureSettings {
  const ads: Ad[] = [{
    headline1: preset.adTemplate.headlines[0] || 'Professional Service',
    headline2: preset.adTemplate.headlines[1] || 'Expert Solutions',
    headline3: preset.adTemplate.headlines[2] || 'Call Now',
    headline4: preset.adTemplate.headlines[3] || '',
    headline5: preset.adTemplate.headlines[4] || '',
    headline6: preset.adTemplate.headlines[5] || '',
    headline7: preset.adTemplate.headlines[6] || '',
    headline8: preset.adTemplate.headlines[7] || '',
    headline9: preset.adTemplate.headlines[8] || '',
    headline10: preset.adTemplate.headlines[9] || '',
    headline11: preset.adTemplate.headlines[10] || '',
    headline12: preset.adTemplate.headlines[11] || '',
    headline13: preset.adTemplate.headlines[12] || '',
    headline14: preset.adTemplate.headlines[13] || '',
    headline15: preset.adTemplate.headlines[14] || '',
    description1: preset.adTemplate.descriptions[0] || 'Get professional service you can trust.',
    description2: preset.adTemplate.descriptions[1] || 'Contact us today for expert assistance.',
    description3: preset.adTemplate.descriptions[2] || '',
    description4: preset.adTemplate.descriptions[3] || '',
    final_url: 'https://www.example.com',
    path1: preset.vertical.toLowerCase().replace(/\s+/g, '-').substring(0, 15),
    path2: 'services',
    type: 'rsa'
  }];

  return {
    structureType: preset.structure,
    campaignName: `${preset.name} Campaign`,
    keywords: preset.keywords,
    matchTypes: preset.matchTypes,
    url: 'https://www.example.com',
    negativeKeywords: preset.negativeKeywords,
    ads: ads,
    targetCountry: 'United States'
  };
}

function getIntentIcon(intent: string) {
  switch (intent.toLowerCase()) {
    case 'emergency':
      return <Zap className="w-3 h-3" />;
    case 'project':
      return <Target className="w-3 h-3" />;
    case 'recurring':
      return <Clock className="w-3 h-3" />;
    default:
      return <TrendingUp className="w-3 h-3" />;
  }
}

function getIntentColor(intent: string): string {
  switch (intent.toLowerCase()) {
    case 'emergency':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'project':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'recurring':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export const PresetCampaigns: React.FC<PresetCampaignsProps> = ({ onLoadPreset }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [structureFilter, setStructureFilter] = useState<StructureFilter>('all');
  const [selectedPreset, setSelectedPreset] = useState<PresetCampaign | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const filteredPresets = useMemo(() => {
    return presetCampaigns.filter(preset => {
      const matchesSearch = preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.vertical.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preset.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStructure = structureFilter === 'all' || preset.structure === structureFilter;
      
      return matchesSearch && matchesStructure;
    });
  }, [searchQuery, structureFilter]);

  const handleExportCSV = async (preset: PresetCampaign, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setIsExporting(preset.id);
    
    try {
      const settings = convertPresetToStructureSettings(preset);
      const structure = generateCampaignStructure(preset.keywords, settings);
      
      const rows = campaignStructureToCSVRows(structure);
      const validation = validateCSVRows(rows);
      
      if (!validation.isValid) {
        const errorMessage = validation.errors.slice(0, 3).join('\n');
        notifications.error(errorMessage, {
          title: 'CSV Validation Failed',
          duration: 8000
        });
        return;
      }
      
      if (validation.warnings.length > 0) {
        notifications.warning(`${validation.warnings.length} warnings found`, {
          title: 'CSV Validation Warnings',
          duration: 5000
        });
      }
      
      const filename = `${preset.id}-google-ads-${new Date().toISOString().split('T')[0]}.csv`;
      await exportCampaignToGoogleAdsEditorCSV(structure, filename);
      
      notifications.success(`${preset.name} campaign exported successfully!`, {
        title: 'Export Complete'
      });
    } catch (error: any) {
      console.error('Export error:', error);
      notifications.error(error?.message || 'An unexpected error occurred during export', {
        title: 'Export Failed'
      });
    } finally {
      setIsExporting(null);
    }
  };

  const handlePreview = (preset: PresetCampaign, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedPreset(preset);
    setIsPreviewOpen(true);
  };

  const handleLoadPreset = (preset: PresetCampaign) => {
    if (onLoadPreset) {
      const settings = convertPresetToStructureSettings(preset);
      onLoadPreset({
        ...settings,
        presetId: preset.id,
        presetName: preset.name
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Home Service Campaign Presets
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Ready-to-use Google Ads campaigns for 20 home service verticals
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              placeholder="Search by vertical name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Structure Filter Buttons */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setStructureFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                structureFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({presetCampaigns.length})
            </button>
            <button
              onClick={() => setStructureFilter('skag')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                structureFilter === 'skag'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              SKAG ({presetCampaigns.filter(p => p.structure === 'skag').length})
            </button>
            <button
              onClick={() => setStructureFilter('stag')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                structureFilter === 'stag'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              STAG ({presetCampaigns.filter(p => p.structure === 'stag').length})
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      {searchQuery && (
        <p className="text-sm text-slate-500 mb-4">
          Found {filteredPresets.length} preset{filteredPresets.length !== 1 ? 's' : ''} matching "{searchQuery}"
        </p>
      )}

      {/* Presets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPresets.map((preset) => (
          <Card
            key={preset.id}
            className={`group relative overflow-hidden transition-all hover:shadow-lg cursor-pointer border-2 ${
              preset.structure === 'skag'
                ? 'hover:border-purple-300'
                : 'hover:border-blue-300'
            }`}
            onClick={() => handlePreview(preset)}
          >
            {/* Gradient accent bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${
                preset.structure === 'skag'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}
            />

            <CardHeader className="pb-2 pt-4">
              {/* Badges Row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge
                  className={`text-xs font-semibold ${
                    preset.structure === 'skag'
                      ? 'bg-purple-100 text-purple-700 border-purple-200'
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                  }`}
                  variant="outline"
                >
                  {preset.structureLabel}
                </Badge>
                <Badge
                  className={`text-xs ${getIntentColor(preset.targetIntent)}`}
                  variant="outline"
                >
                  <span className="flex items-center gap-1">
                    {getIntentIcon(preset.targetIntent)}
                    {preset.targetIntent}
                  </span>
                </Badge>
              </div>

              <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                {preset.name}
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 line-clamp-2 mt-1">
                {preset.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0 pb-4">
              {/* Stats */}
              <div className="flex items-center gap-3 text-sm text-slate-600 mb-4">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  {preset.keywords.length} keywords
                </span>
                <span className="text-slate-300">|</span>
                <span className="font-medium text-green-600">
                  {preset.estimatedCPC} CPC
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => handlePreview(preset, e)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  className={`flex-1 ${
                    preset.structure === 'skag'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                  } text-white`}
                  onClick={(e) => handleExportCSV(preset, e)}
                  disabled={isExporting === preset.id}
                >
                  {isExporting === preset.id ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-spin">...</span>
                    </span>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-1" />
                      CSV
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredPresets.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600 mb-2">No presets found</h3>
          <p className="text-slate-500">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          {selectedPreset && (
            <>
              <DialogHeader className="shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    className={`text-xs font-semibold ${
                      selectedPreset.structure === 'skag'
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-blue-100 text-blue-700 border-blue-200'
                    }`}
                    variant="outline"
                  >
                    {selectedPreset.structureLabel}
                  </Badge>
                  <Badge
                    className={`text-xs ${getIntentColor(selectedPreset.targetIntent)}`}
                    variant="outline"
                  >
                    <span className="flex items-center gap-1">
                      {getIntentIcon(selectedPreset.targetIntent)}
                      {selectedPreset.targetIntent}
                    </span>
                  </Badge>
                  <span className="text-sm text-green-600 font-medium">
                    {selectedPreset.estimatedCPC} CPC
                  </span>
                </div>
                <DialogTitle className="text-xl">{selectedPreset.name}</DialogTitle>
                <DialogDescription>{selectedPreset.description}</DialogDescription>
              </DialogHeader>

              <div className="flex-1 mt-4 min-h-0 overflow-y-auto max-h-[60vh]">
                <div className="space-y-6 pr-4">
                  {/* Keywords Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Keywords ({selectedPreset.keywords.length})
                    </h3>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-slate-50 rounded-lg">
                      {selectedPreset.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-white">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Headlines Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Headlines ({selectedPreset.adTemplate.headlines.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedPreset.adTemplate.headlines.map((headline, idx) => (
                        <div
                          key={idx}
                          className="text-sm p-2 bg-indigo-50 rounded-lg text-indigo-800 border border-indigo-100"
                        >
                          {idx + 1}. {headline}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Descriptions Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Descriptions ({selectedPreset.adTemplate.descriptions.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedPreset.adTemplate.descriptions.map((desc, idx) => (
                        <div
                          key={idx}
                          className="text-sm p-3 bg-emerald-50 rounded-lg text-emerald-800 border border-emerald-100"
                        >
                          {idx + 1}. {desc}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Negative Keywords Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Negative Keywords ({selectedPreset.negativeKeywords.length})
                    </h3>
                    <div className="flex flex-wrap gap-2 p-3 bg-red-50 rounded-lg">
                      {selectedPreset.negativeKeywords.map((keyword, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs bg-white text-red-600 border-red-200"
                        >
                          -{keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Match Types */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Match Types</h3>
                    <div className="flex items-center gap-3">
                      {selectedPreset.matchTypes.broad && (
                        <Badge variant="secondary">Broad</Badge>
                      )}
                      {selectedPreset.matchTypes.phrase && (
                        <Badge variant="secondary">Phrase</Badge>
                      )}
                      {selectedPreset.matchTypes.exact && (
                        <Badge variant="secondary">Exact</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-4 pt-4 mt-4 border-t shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  {onLoadPreset && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLoadPreset(selectedPreset);
                        setIsPreviewOpen(false);
                      }}
                    >
                      Load to Builder
                    </Button>
                  )}
                  <Button
                    className={`${
                      selectedPreset.structure === 'skag'
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                    } text-white`}
                    onClick={() => handleExportCSV(selectedPreset)}
                    disabled={isExporting === selectedPreset.id}
                  >
                    {isExporting === selectedPreset.id ? (
                      <span>Exporting...</span>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download CSV
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PresetCampaigns;
