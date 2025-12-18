import { Globe, Smartphone, Monitor, Tablet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

export interface KeywordFiltersState {
  country: string;
  device: string;
}

interface KeywordFiltersProps {
  filters: KeywordFiltersState;
  onFiltersChange: (filters: KeywordFiltersState) => void;
  compact?: boolean;
}

export const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
];

export const DEVICES = [
  { id: 'mobile', name: 'Mobile', icon: Smartphone },
  { id: 'desktop', name: 'Desktop', icon: Monitor },
  { id: 'tablet', name: 'Tablet', icon: Tablet },
  { id: 'all', name: 'All Devices', icon: Monitor },
];

export const DEFAULT_FILTERS: KeywordFiltersState = {
  country: 'US',
  device: 'mobile',
};

export function KeywordFilters({ filters, onFiltersChange, compact = false }: KeywordFiltersProps) {
  const selectedCountry = COUNTRIES.find(c => c.code === filters.country);
  const selectedDevice = DEVICES.find(d => d.id === filters.device);

  return (
    <div className={`flex ${compact ? 'gap-2' : 'gap-4'} items-end flex-wrap`}>
      <div className={compact ? 'min-w-[140px]' : 'min-w-[180px]'}>
        <Label className="text-xs text-slate-500 mb-1 flex items-center gap-1">
          <Globe className="h-3 w-3" /> Country
        </Label>
        <Select
          value={filters.country}
          onValueChange={(value) => onFiltersChange({ ...filters, country: value })}
        >
          <SelectTrigger className={compact ? 'h-8 text-sm' : 'h-9'}>
            <SelectValue>
              {selectedCountry && (
                <span className="flex items-center gap-2">
                  <span>{selectedCountry.flag}</span>
                  <span>{selectedCountry.name}</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <span className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={compact ? 'min-w-[120px]' : 'min-w-[150px]'}>
        <Label className="text-xs text-slate-500 mb-1 flex items-center gap-1">
          <Smartphone className="h-3 w-3" /> Device
        </Label>
        <Select
          value={filters.device}
          onValueChange={(value) => onFiltersChange({ ...filters, device: value })}
        >
          <SelectTrigger className={compact ? 'h-8 text-sm' : 'h-9'}>
            <SelectValue>
              {selectedDevice && (
                <span className="flex items-center gap-2">
                  <selectedDevice.icon className="h-4 w-4" />
                  <span>{selectedDevice.name}</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DEVICES.map((device) => (
              <SelectItem key={device.id} value={device.id}>
                <span className="flex items-center gap-2">
                  <device.icon className="h-4 w-4" />
                  <span>{device.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function getDifficultyBadge(competition: string | null): { label: string; className: string } {
  switch (competition) {
    case 'LOW':
      return { label: 'Easy', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
    case 'MEDIUM':
      return { label: 'Medium', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
    case 'HIGH':
      return { label: 'Hard', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    default:
      return { label: 'N/A', className: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' };
  }
}

export function formatSearchVolume(volume: number | null | undefined): string {
  if (volume === null || volume === undefined) return '-';
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return volume.toString();
}

export function formatCPC(cpc: number | null | undefined): string {
  if (cpc === null || cpc === undefined) return '-';
  return `$${cpc.toFixed(2)}`;
}
