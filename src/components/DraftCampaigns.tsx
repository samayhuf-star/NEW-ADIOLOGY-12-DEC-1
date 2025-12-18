import React, { useState, useEffect } from 'react';
import { 
  FileText, Clock, Trash2, Download, Play, Pencil,
  RefreshCw, Search, Filter, ChevronDown, Sparkles, Zap,
  Globe, Calendar, MoreHorizontal
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { historyService } from '../utils/historyService';
import { notifications } from '../utils/notifications';

interface DraftCampaignsProps {
  onLoadCampaign: (data: any, mode: 'resume' | 'edit') => void;
}

interface CampaignItem {
  id: string;
  name: string;
  timestamp: string;
  lastModified?: string;
  status: 'draft' | 'completed' | 'in_progress';
  data: any;
  type: string;
}

export function DraftCampaigns({ onLoadCampaign }: DraftCampaignsProps) {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [builderFilter, setBuilderFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const allItems = await historyService.getAll();
      const campaignItems = allItems
        .filter(item => 
          item.type === 'campaign' || 
          item.type === 'campaign-preset' ||
          item.type === 'one-click-campaign'
        )
        .map(item => ({
          id: item.id,
          name: item.name || 'Untitled Campaign',
          timestamp: item.timestamp,
          lastModified: item.lastModified,
          status: (item.status || 'completed') as 'draft' | 'completed' | 'in_progress',
          data: item.data,
          type: item.type
        }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setCampaigns(campaignItems);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      notifications.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const extractDomain = (campaign: CampaignItem): string => {
    try {
      const url = campaign.data?.url || campaign.data?.websiteUrl || '';
      if (!url) return 'N/A';
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return campaign.data?.url || 'N/A';
    }
  };

  const getBuilderType = (campaign: CampaignItem): '1-click' | 'builder-3' => {
    if (campaign.type === 'one-click-campaign') return '1-click';
    if (campaign.data?.builderType === '1-click') return '1-click';
    if (campaign.data?.builderType === 'one-click') return '1-click';
    return 'builder-3';
  };

  const formatDateTime = (timestamp: string): { date: string; time: string } => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">Draft</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleResume = (campaign: CampaignItem) => {
    onLoadCampaign(campaign.data, 'resume');
    notifications.success(`Resuming "${campaign.name}"`);
  };

  const handleEdit = (campaign: CampaignItem) => {
    onLoadCampaign(campaign.data, 'edit');
    notifications.success(`Editing "${campaign.name}"`);
  };

  const handleDelete = async () => {
    if (!campaignToDelete) return;
    
    try {
      await historyService.delete(campaignToDelete);
      setCampaigns(prev => prev.filter(c => c.id !== campaignToDelete));
      notifications.success('Campaign deleted successfully');
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      notifications.error('Failed to delete campaign');
    } finally {
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  };

  const handleDownload = (campaign: CampaignItem) => {
    try {
      if (campaign.data?.csvData) {
        const blob = new Blob([campaign.data.csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${campaign.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        notifications.success('CSV downloaded successfully');
      } else {
        notifications.warning('No CSV data available. Complete the campaign to generate CSV.');
      }
    } catch (error) {
      console.error('Failed to download CSV:', error);
      notifications.error('Failed to download CSV');
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      extractDomain(campaign).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    
    const builderType = getBuilderType(campaign);
    const matchesBuilder = builderFilter === 'all' || 
      (builderFilter === '1-click' && builderType === '1-click') ||
      (builderFilter === 'builder-3' && builderType === 'builder-3');
    
    return matchesSearch && matchesStatus && matchesBuilder;
  });

  const stats = {
    total: campaigns.length,
    draft: campaigns.filter(c => c.status === 'draft' || c.status === 'in_progress').length,
    completed: campaigns.filter(c => c.status === 'completed').length
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            Draft Campaigns
          </h1>
          <p className="text-slate-400 mt-1">
            Resume incomplete campaigns or manage your completed builds
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadCampaigns}
          className="border-slate-600 hover:bg-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-slate-400">Total Campaigns</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-yellow-400">{stats.draft}</div>
            <div className="text-sm text-yellow-400/70">Drafts / In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
            <div className="text-sm text-green-400/70">Completed</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name or domain..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-600"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-900/50 border-slate-600">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={builderFilter} onValueChange={setBuilderFilter}>
              <SelectTrigger className="w-40 bg-slate-900/50 border-slate-600">
                <SelectValue placeholder="Builder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Builders</SelectItem>
                <SelectItem value="1-click">1 Click Builder</SelectItem>
                <SelectItem value="builder-3">Builder 3.0</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <span className="ml-2 text-slate-400">Loading campaigns...</span>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No campaigns found</p>
              <p className="text-sm mt-1">Start building a campaign to see it here</p>
            </div>
          ) : (
            <div className="rounded-md border border-slate-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-900/50 hover:bg-slate-900/50">
                    <TableHead className="w-12 text-slate-300">#</TableHead>
                    <TableHead className="text-slate-300">Campaign Name</TableHead>
                    <TableHead className="text-slate-300">Domain</TableHead>
                    <TableHead className="text-slate-300">Date & Time</TableHead>
                    <TableHead className="text-slate-300">Builder</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-right text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign, index) => {
                    const { date, time } = formatDateTime(campaign.lastModified || campaign.timestamp);
                    const builderType = getBuilderType(campaign);
                    const isDraft = campaign.status === 'draft' || campaign.status === 'in_progress';
                    
                    return (
                      <TableRow 
                        key={campaign.id} 
                        className="border-slate-700 hover:bg-slate-700/30"
                      >
                        <TableCell className="text-slate-400 font-mono">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium text-white max-w-[200px] truncate">
                          {campaign.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Globe className="w-4 h-4 text-slate-500" />
                            <span className="truncate max-w-[150px]">{extractDomain(campaign)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            <div className="text-sm">
                              <div>{date}</div>
                              <div className="text-xs text-slate-500">{time}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {builderType === '1-click' ? (
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                              <Zap className="w-3 h-3 mr-1" />
                              1 Click
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Builder 3.0
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(campaign.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isDraft && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleResume(campaign)}
                                className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                title="Resume"
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(campaign)}
                              className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(campaign)}
                              className="h-8 w-8 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                              title="Download CSV"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setCampaignToDelete(campaign.id);
                                setDeleteDialogOpen(true);
                              }}
                              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this campaign? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
