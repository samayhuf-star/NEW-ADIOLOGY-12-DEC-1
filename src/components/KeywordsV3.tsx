import { useState, useEffect } from 'react';
import { Search, ArrowRight, Copy, Download, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { notifications } from '../utils/notifications';
import { KeywordFilters, KeywordFiltersState, DEFAULT_FILTERS, formatSearchVolume, formatCPC, getDifficultyBadge } from './KeywordFilters';
import Papa from 'papaparse';

interface KeywordResult {
  keyword: string;
  searchVolume: number;
  competition: string;
  cpc: number;
  trend: 'up' | 'down';
}

export function KeywordsV3() {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [platform, setPlatform] = useState<'google' | 'youtube'>('google');
  const [isSearching, setIsSearching] = useState(false);
  const [keywords, setKeywords] = useState<KeywordResult[]>([]);
  const [filters, setFilters] = useState<KeywordFiltersState>(DEFAULT_FILTERS);
  const [sortColumn, setSortColumn] = useState<'keyword' | 'searchVolume' | 'competition' | 'cpc'>('searchVolume');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      notifications.warning('Please enter a keyword to search');
      return;
    }

    setIsSearching(true);
    setKeywords([]);

    try {
      const response = await fetch('/api/keywords-v3/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: searchKeyword.trim(),
          platform,
          country: filters.country,
          device: filters.device,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate keywords');
      }

      const data = await response.json();
      
      // Parse and normalize the keywords
      const parsedKeywords: KeywordResult[] = (data.keywords || []).map((kw: any) => ({
        keyword: kw.keyword || '',
        searchVolume: kw.searchVolume || kw.volume || 0,
        competition: kw.competition || kw.difficulty || 'LOW',
        cpc: kw.cpc || 0,
        trend: kw.trend || (Math.random() > 0.5 ? 'up' : 'down'),
      }));

      setKeywords(parsedKeywords);
      
      if (parsedKeywords.length > 0) {
        notifications.success(`Generated ${parsedKeywords.length} keywords!`, {
          title: 'Keywords Generated',
        });
      }
    } catch (error: any) {
      console.error('Error generating keywords:', error);
      notifications.error(error.message || 'Failed to generate keywords', {
        title: 'Error',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSort = (column: 'keyword' | 'searchVolume' | 'competition' | 'cpc') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedKeywords = [...keywords].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    // Map sortColumn to actual property names
    if (sortColumn === 'searchVolume') {
      aVal = a.searchVolume;
      bVal = b.searchVolume;
    } else if (sortColumn === 'keyword') {
      aVal = a.keyword.toLowerCase();
      bVal = b.keyword.toLowerCase();
    } else if (sortColumn === 'competition') {
      const order = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3 };
      aVal = order[a.competition as keyof typeof order] || 0;
      bVal = order[b.competition as keyof typeof order] || 0;
    } else if (sortColumn === 'cpc') {
      aVal = a.cpc;
      bVal = b.cpc;
    } else {
      // Fallback
      aVal = a[sortColumn as keyof KeywordResult];
      bVal = b[sortColumn as keyof KeywordResult];
    }

    if (sortDirection === 'asc') {
      // Ascending: smaller values first
      return aVal < bVal ? -1 : (aVal > bVal ? 1 : 0);
    } else {
      // Descending: larger values first
      return aVal > bVal ? -1 : (aVal < bVal ? 1 : 0);
    }
  });

  const handleCopyToClipboard = async () => {
    if (keywords.length === 0) {
      notifications.warning('No keywords to copy');
      return;
    }

    const keywordList = keywords.map(kw => kw.keyword).join('\n');
    try {
      await navigator.clipboard.writeText(keywordList);
      notifications.success('Keywords copied to clipboard!', {
        title: 'Copied',
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      notifications.error('Failed to copy keywords to clipboard. Please try again.', {
        title: 'Copy Failed',
      });
    }
  };

  const handleExportCSV = () => {
    if (keywords.length === 0) {
      notifications.warning('No keywords to export');
      return;
    }

    const csvData = keywords.map(kw => ({
      Keyword: kw.keyword,
      'Search Volume': kw.searchVolume,
      Competition: kw.competition,
      CPC: `$${kw.cpc.toFixed(2)}`,
      Trend: kw.trend,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `keywords-${platform}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke the blob URL to prevent memory leak
    URL.revokeObjectURL(url);

    notifications.success('Keywords exported to CSV!', {
      title: 'Exported',
    });
  };

  const getCompetitionBadge = (competition: string) => {
    const badge = getDifficultyBadge(competition);
    return (
      <Badge className={badge.className}>
        {badge.label}
      </Badge>
    );
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (trend === 'down') {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <div className="w-4 h-4 border-t-2 border-slate-400" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-3">
            Keyword Research Made Simple
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Meet Keywords V3, the best Google & Youtube Keyword Research with the latest Search Trends.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 border-slate-200 dark:border-slate-700 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Type a keyword and start using Keywords V3"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSearching) {
                      handleSearch();
                    }
                  }}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
              
              <Select value={platform} onValueChange={(value: 'google' | 'youtube') => setPlatform(value)}>
                <SelectTrigger className="w-full sm:w-[140px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      {platform === 'google' ? '🔍' : '📺'}
                      <span className="capitalize">{platform}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">
                    <span className="flex items-center gap-2">
                      🔍 Google
                    </span>
                  </SelectItem>
                  <SelectItem value="youtube">
                    <span className="flex items-center gap-2">
                      📺 Youtube
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchKeyword.trim()}
                className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white px-6 py-3 h-auto"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    Search Keywords
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {keywords.length > 0 && (
          <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
            <CardContent className="p-6">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <KeywordFilters filters={filters} onFiltersChange={setFilters} compact={true} />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCopyToClipboard}
                    className="border-slate-200 dark:border-slate-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    className="border-slate-200 dark:border-slate-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th
                        className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                        onClick={() => handleSort('keyword')}
                      >
                        KEYWORDS
                        {sortColumn === 'keyword' && (
                          <span className="ml-2">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                        onClick={() => handleSort('searchVolume')}
                      >
                        SEARCH VOLUME
                        {sortColumn === 'searchVolume' && (
                          <span className="ml-2">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                        onClick={() => handleSort('competition')}
                      >
                        COMPETITION
                        {sortColumn === 'competition' && (
                          <span className="ml-2">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th
                        className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                        onClick={() => handleSort('cpc')}
                      >
                        CPC
                        {sortColumn === 'cpc' && (
                          <span className="ml-2">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        TREND
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedKeywords.map((keyword, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-slate-900 dark:text-white font-medium">
                          {keyword.keyword}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {formatSearchVolume(keyword.searchVolume)}
                        </td>
                        <td className="py-3 px-4">
                          {getCompetitionBadge(keyword.competition)}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {formatCPC(keyword.cpc)}
                        </td>
                        <td className="py-3 px-4">
                          {getTrendIcon(keyword.trend)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {keywords.length === 0 && (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  No keywords found. Try a different search term.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {keywords.length === 0 && !isSearching && (
          <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Start Your Keyword Research
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Enter a keyword above and click "Search Keywords" to generate 750+ keyword suggestions
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

