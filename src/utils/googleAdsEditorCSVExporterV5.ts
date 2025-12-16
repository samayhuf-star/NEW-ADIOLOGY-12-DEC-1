/**
 * Google Ads Editor CSV Exporter V5 - Master Format (183 Columns)
 * 
 * This exporter uses the complete Google Ads Editor format with all 183 columns
 * including all asset extensions, location targeting, and complete ad structure.
 * 
 * Based on the master CSV template: Campaign_Enhanced_Full_Assets.csv
 */

// Complete 183-column header array matching Google Ads Editor format
export const MASTER_CSV_HEADERS = [
  'Campaign',
  'Campaign Daily Budget',
  'Campaign Type',
  'Bid Strategy Type',
  'Networks',
  'EU political ads',
  'Desktop Bid adj.',
  'Mobile Bid adj.',
  'Tablet Bid adj.',
  'Start Date',
  'End Date',
  'Campaign Status',
  'Campaign Labels',
  'Ad Group',
  'Max CPC',
  'Ad Group Status',
  'Ad Group Labels',
  'Keyword',
  'Criterion Type',
  'Keyword Status',
  'Max CPC Bid',
  'Keyword Labels',
  'Bid Modifier',
  'Keyword (Negative)',
  'Criterion Type (Negative)',
  'Negative Keyword Status',
  'Audience ID',
  'Audience Name',
  'Audience Type',
  'Audience Status',
  'Location',
  'Location Type',
  'Location Status',
  'Bid Adjustment (%)',
  'City',
  'State/Region',
  'Postal Code',
  'Country Code',
  'Latitude',
  'Longitude',
  'Radius',
  'Radius Units',
  'Ad Type',
  'Final URL',
  'Final URL Suffix',
  'Mobile Final URL',
  'Tracking Template',
  'Custom Parameter',
  'Headline 1',
  'Headline 2',
  'Headline 3',
  'Headline 4',
  'Headline 5',
  'Headline 6',
  'Headline 7',
  'Headline 8',
  'Headline 9',
  'Headline 10',
  'Headline 11',
  'Headline 12',
  'Headline 13',
  'Headline 14',
  'Headline 15',
  'Description 1',
  'Description 2',
  'Description 3',
  'Description 4',
  'Path 1',
  'Path 2',
  'Dynamic Search Ad Description 1',
  'Dynamic Search Ad Description 2',
  'Dynamic Search Ad Domain Language',
  'PhoneNumber',
  'VerificationURL',
  'Call Extension Status',
  'Call Extension Scheduling',
  'Call Only Ads',
  'Sitelink 1 Text',
  'Sitelink 1 Description 1',
  'Sitelink 1 Description 2',
  'Sitelink 1 Final URL',
  'Sitelink 1 Status',
  'Sitelink 1 Start Date',
  'Sitelink 1 End Date',
  'Sitelink 2 Text',
  'Sitelink 2 Description 1',
  'Sitelink 2 Description 2',
  'Sitelink 2 Final URL',
  'Sitelink 2 Status',
  'Sitelink 2 Start Date',
  'Sitelink 2 End Date',
  'Sitelink 3 Text',
  'Sitelink 3 Description 1',
  'Sitelink 3 Description 2',
  'Sitelink 3 Final URL',
  'Sitelink 3 Status',
  'Sitelink 3 Start Date',
  'Sitelink 3 End Date',
  'Sitelink 4 Text',
  'Sitelink 4 Description 1',
  'Sitelink 4 Description 2',
  'Sitelink 4 Final URL',
  'Sitelink 4 Status',
  'Sitelink 4 Start Date',
  'Sitelink 4 End Date',
  'Callout 1 Text',
  'Callout 1 Status',
  'Callout 1 Start Date',
  'Callout 1 End Date',
  'Callout 2 Text',
  'Callout 2 Status',
  'Callout 2 Start Date',
  'Callout 2 End Date',
  'Callout 3 Text',
  'Callout 3 Status',
  'Callout 3 Start Date',
  'Callout 3 End Date',
  'Callout 4 Text',
  'Callout 4 Status',
  'Callout 4 Start Date',
  'Callout 4 End Date',
  'Structured Snippet Header',
  'Structured Snippet Values',
  'Structured Snippet 1 Header',
  'Structured Snippet 1 Values',
  'Structured Snippet 2 Header',
  'Structured Snippet 2 Values',
  'Price Extension Type',
  'Price Extension Price Qualifier',
  'Price Extension Item Header',
  'Price Extension Item Price',
  'Price Extension Item Final URL',
  'Price Extension 1 Type',
  'Price Extension 1 Price Qualifier',
  'Price Extension 1 Item 1 Header',
  'Price Extension 1 Item 1 Price',
  'Price Extension 1 Item 1 Final URL',
  'Price Extension 1 Item 2 Header',
  'Price Extension 1 Item 2 Price',
  'Price Extension 1 Item 2 Final URL',
  'Price Extension 1 Item 3 Header',
  'Price Extension 1 Item 3 Price',
  'Price Extension 1 Item 3 Final URL',
  'Price Extension 1 Item 4 Header',
  'Price Extension 1 Item 4 Price',
  'Price Extension 1 Item 4 Final URL',
  'Promotion Target',
  'Promotion Discount Modifier',
  'Promotion Percent Off',
  'Promotion Money Amount Off',
  'Promotion Final URL',
  'Promotion Status',
  'Promotion Start Date',
  'Promotion End Date',
  'App ID',
  'App Store',
  'App Link Text',
  'App Final URL',
  'App Status',
  'Message Text',
  'Message Final URL',
  'Message Business Name',
  'Message Country Code',
  'Message Phone Number',
  'Message Status',
  'Lead Form ID',
  'Lead Form Name',
  'Lead Form Headline',
  'Lead Form Description',
  'Lead Form Call-to-action',
  'Lead Form Status',
  'Image Asset Name',
  'Image Asset URL',
  'Image Asset Status',
  'Video Asset ID',
  'Video Asset Name',
  'Video Asset URL',
  'Video Asset Status',
  'Business Profile Location',
  'Business Name',
  'Business Address',
  'Business Phone',
  'Business Website'
];

// Column index map for quick access
export const COLUMN_INDEX: { [key: string]: number } = {};
MASTER_CSV_HEADERS.forEach((header, idx) => {
  COLUMN_INDEX[header] = idx;
});

// Helper to escape CSV field values
function escapeCSV(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Create an empty row with all 183 columns
function createEmptyRow(): string[] {
  return new Array(MASTER_CSV_HEADERS.length).fill('');
}

// Types for campaign data
export interface CampaignDataV5 {
  campaignName: string;
  dailyBudget?: number;
  campaignType?: string;
  bidStrategy?: string;
  networks?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  labels?: string;
  url?: string;
  adGroups: AdGroupV5[];
  negativeKeywords?: string[];
  locations?: LocationDataV5;
  sitelinks?: SitelinkV5[];
  callouts?: CalloutV5[];
  snippets?: SnippetV5[];
  priceExtensions?: PriceExtensionV5[];
  promotions?: PromotionV5[];
  imageAssets?: ImageAssetV5[];
  businessInfo?: BusinessInfoV5;
}

export interface AdGroupV5 {
  name: string;
  maxCpc?: number;
  status?: string;
  labels?: string;
  keywords: KeywordV5[];
  ads: AdV5[];
}

export interface KeywordV5 {
  text: string;
  matchType: 'Broad' | 'Phrase' | 'Exact';
  status?: string;
  maxCpcBid?: number;
  labels?: string;
  finalUrl?: string;
}

export interface AdV5 {
  type: 'RSA' | 'DKI' | 'CallOnly';
  headlines: string[];
  descriptions: string[];
  path1?: string;
  path2?: string;
  finalUrl: string;
  mobileUrl?: string;
  phoneNumber?: string;
  verificationUrl?: string;
  businessName?: string;
  status?: string;
}

export interface LocationDataV5 {
  countries?: string[];
  states?: string[];
  cities?: string[];
  zipCodes?: string[];
  countryCode?: string;
}

export interface SitelinkV5 {
  text: string;
  description1?: string;
  description2?: string;
  finalUrl: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface CalloutV5 {
  text: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface SnippetV5 {
  header: string;
  values: string;
  status?: string;
}

export interface PriceExtensionV5 {
  type: string;
  priceQualifier?: string;
  items: { header: string; price: string; finalUrl: string }[];
}

export interface PromotionV5 {
  target: string;
  discountModifier?: string;
  percentOff?: string;
  moneyAmountOff?: string;
  finalUrl?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface ImageAssetV5 {
  name: string;
  url: string;
  status?: string;
}

export interface BusinessInfoV5 {
  name?: string;
  address?: string;
  phone?: string;
  website?: string;
  location?: string;
}

/**
 * Generate a complete CSV with all 183 columns from campaign data
 */
export function generateMasterCSV(campaign: CampaignDataV5): string {
  const rows: string[][] = [];
  
  // Header row
  rows.push([...MASTER_CSV_HEADERS]);
  
  // Campaign row (first data row)
  const campaignRow = createEmptyRow();
  campaignRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
  campaignRow[COLUMN_INDEX['Campaign Daily Budget']] = String(campaign.dailyBudget || 100);
  campaignRow[COLUMN_INDEX['Campaign Type']] = campaign.campaignType || 'Search';
  campaignRow[COLUMN_INDEX['Bid Strategy Type']] = campaign.bidStrategy || 'Maximize Conversions';
  campaignRow[COLUMN_INDEX['Networks']] = campaign.networks || 'Google search';
  campaignRow[COLUMN_INDEX['EU political ads']] = 'No';
  campaignRow[COLUMN_INDEX['Desktop Bid adj.']] = '-100%';
  campaignRow[COLUMN_INDEX['Mobile Bid adj.']] = '0%';
  campaignRow[COLUMN_INDEX['Tablet Bid adj.']] = '-100%';
  campaignRow[COLUMN_INDEX['Start Date']] = campaign.startDate || '';
  campaignRow[COLUMN_INDEX['End Date']] = campaign.endDate || '';
  campaignRow[COLUMN_INDEX['Campaign Status']] = campaign.status || 'Enabled';
  campaignRow[COLUMN_INDEX['Campaign Labels']] = campaign.labels || '';
  campaignRow[COLUMN_INDEX['Ad Group Status']] = 'Enabled';
  
  // Add sitelinks to campaign row if available
  if (campaign.sitelinks && campaign.sitelinks.length > 0) {
    for (let i = 0; i < Math.min(4, campaign.sitelinks.length); i++) {
      const sl = campaign.sitelinks[i];
      const num = i + 1;
      campaignRow[COLUMN_INDEX[`Sitelink ${num} Text`]] = sl.text || '';
      campaignRow[COLUMN_INDEX[`Sitelink ${num} Description 1`]] = sl.description1 || '';
      campaignRow[COLUMN_INDEX[`Sitelink ${num} Description 2`]] = sl.description2 || '';
      campaignRow[COLUMN_INDEX[`Sitelink ${num} Final URL`]] = sl.finalUrl || '';
      campaignRow[COLUMN_INDEX[`Sitelink ${num} Status`]] = sl.status || 'Enabled';
    }
  }
  
  // Add callouts to campaign row if available
  if (campaign.callouts && campaign.callouts.length > 0) {
    for (let i = 0; i < Math.min(4, campaign.callouts.length); i++) {
      const co = campaign.callouts[i];
      const num = i + 1;
      campaignRow[COLUMN_INDEX[`Callout ${num} Text`]] = co.text || '';
      campaignRow[COLUMN_INDEX[`Callout ${num} Status`]] = co.status || 'Enabled';
    }
  }
  
  // Add structured snippets
  if (campaign.snippets && campaign.snippets.length > 0) {
    if (campaign.snippets[0]) {
      campaignRow[COLUMN_INDEX['Structured Snippet Header']] = campaign.snippets[0].header || '';
      campaignRow[COLUMN_INDEX['Structured Snippet Values']] = campaign.snippets[0].values || '';
    }
  }
  
  // Add business info
  if (campaign.businessInfo) {
    campaignRow[COLUMN_INDEX['Business Name']] = campaign.businessInfo.name || '';
    campaignRow[COLUMN_INDEX['Business Address']] = campaign.businessInfo.address || '';
    campaignRow[COLUMN_INDEX['Business Phone']] = campaign.businessInfo.phone || '';
    campaignRow[COLUMN_INDEX['Business Website']] = campaign.businessInfo.website || '';
    campaignRow[COLUMN_INDEX['Business Profile Location']] = campaign.businessInfo.location || '';
  }
  
  rows.push(campaignRow);
  
  // Ad Group rows (one per ad group)
  campaign.adGroups.forEach(adGroup => {
    const agRow = createEmptyRow();
    agRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
    agRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
    agRow[COLUMN_INDEX['Ad Group']] = adGroup.name;
    agRow[COLUMN_INDEX['Max CPC']] = String(adGroup.maxCpc || 2.00);
    agRow[COLUMN_INDEX['Ad Group Status']] = adGroup.status || 'Enabled';
    agRow[COLUMN_INDEX['Ad Group Labels']] = adGroup.labels || '';
    rows.push(agRow);
  });
  
  // Keyword rows
  campaign.adGroups.forEach(adGroup => {
    adGroup.keywords.forEach(keyword => {
      const kwRow = createEmptyRow();
      kwRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      kwRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      kwRow[COLUMN_INDEX['Ad Group']] = adGroup.name;
      kwRow[COLUMN_INDEX['Max CPC']] = String(adGroup.maxCpc || 2.00);
      kwRow[COLUMN_INDEX['Ad Group Status']] = 'Enabled';
      kwRow[COLUMN_INDEX['Keyword']] = keyword.text;
      kwRow[COLUMN_INDEX['Criterion Type']] = keyword.matchType;
      kwRow[COLUMN_INDEX['Keyword Status']] = keyword.status || 'Enabled';
      kwRow[COLUMN_INDEX['Max CPC Bid']] = keyword.maxCpcBid ? String(keyword.maxCpcBid) : '';
      kwRow[COLUMN_INDEX['Keyword Labels']] = keyword.labels || '';
      kwRow[COLUMN_INDEX['Final URL']] = keyword.finalUrl || campaign.url || '';
      rows.push(kwRow);
    });
  });
  
  // Ad rows (RSA, DKI, Call-Only)
  campaign.adGroups.forEach(adGroup => {
    adGroup.ads.forEach(ad => {
      // Skip ads with no headlines or descriptions (invalid ads)
      const validHeadlines = (ad.headlines || []).filter((h: string) => h && h.trim());
      const validDescriptions = (ad.descriptions || []).filter((d: string) => d && d.trim());
      
      // RSA requires at least 3 headlines and 2 descriptions
      if (validHeadlines.length < 1 || validDescriptions.length < 1) {
        console.warn(`Skipping invalid ad in group "${adGroup.name}": insufficient headlines (${validHeadlines.length}) or descriptions (${validDescriptions.length})`);
        return;
      }
      
      const adRow = createEmptyRow();
      adRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      adRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      adRow[COLUMN_INDEX['Ad Group']] = adGroup.name;
      adRow[COLUMN_INDEX['Ad Group Status']] = 'Enabled';
      adRow[COLUMN_INDEX['Ad Type']] = ad.type === 'RSA' ? 'Responsive search ad' : 
                                       ad.type === 'CallOnly' ? 'Call-only ad' : 
                                       'Responsive search ad';
      adRow[COLUMN_INDEX['Final URL']] = ad.finalUrl;
      adRow[COLUMN_INDEX['Mobile Final URL']] = ad.mobileUrl || '';
      
      // Headlines (up to 15) - use validated headlines
      for (let i = 0; i < Math.min(15, validHeadlines.length); i++) {
        const headlineCol = `Headline ${i + 1}`;
        if (COLUMN_INDEX[headlineCol] !== undefined) {
          adRow[COLUMN_INDEX[headlineCol]] = validHeadlines[i].substring(0, 30);
        }
      }
      
      // Descriptions (up to 4) - use validated descriptions
      for (let i = 0; i < Math.min(4, validDescriptions.length); i++) {
        const descCol = `Description ${i + 1}`;
        if (COLUMN_INDEX[descCol] !== undefined) {
          adRow[COLUMN_INDEX[descCol]] = validDescriptions[i].substring(0, 90);
        }
      }
      
      adRow[COLUMN_INDEX['Path 1']] = (ad.path1 || '').substring(0, 15);
      adRow[COLUMN_INDEX['Path 2']] = (ad.path2 || '').substring(0, 15);
      
      // Call-only specific fields
      if (ad.type === 'CallOnly') {
        adRow[COLUMN_INDEX['PhoneNumber']] = ad.phoneNumber || '';
        adRow[COLUMN_INDEX['VerificationURL']] = ad.verificationUrl || '';
        adRow[COLUMN_INDEX['Business Name']] = ad.businessName || '';
        adRow[COLUMN_INDEX['Call Only Ads']] = 'Yes';
      }
      
      rows.push(adRow);
    });
  });
  
  // Negative keyword rows
  if (campaign.negativeKeywords && campaign.negativeKeywords.length > 0) {
    campaign.negativeKeywords.forEach(negKw => {
      const negRow = createEmptyRow();
      negRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      negRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      negRow[COLUMN_INDEX['Keyword (Negative)']] = negKw;
      negRow[COLUMN_INDEX['Criterion Type (Negative)']] = 'Phrase';
      negRow[COLUMN_INDEX['Negative Keyword Status']] = 'Enabled';
      rows.push(negRow);
    });
  }
  
  // Location targeting rows
  if (campaign.locations) {
    const countryCode = campaign.locations.countryCode || 'US';
    
    // Countries
    if (campaign.locations.countries && campaign.locations.countries.length > 0) {
      campaign.locations.countries.forEach(country => {
        const locRow = createEmptyRow();
        locRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
        locRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
        locRow[COLUMN_INDEX['Location']] = country;
        locRow[COLUMN_INDEX['Location Type']] = 'Country';
        locRow[COLUMN_INDEX['Location Status']] = 'Enabled';
        locRow[COLUMN_INDEX['Country Code']] = countryCode;
        rows.push(locRow);
      });
    }
    
    // States
    if (campaign.locations.states && campaign.locations.states.length > 0) {
      campaign.locations.states.forEach(state => {
        const locRow = createEmptyRow();
        locRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
        locRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
        locRow[COLUMN_INDEX['Location']] = state;
        locRow[COLUMN_INDEX['Location Type']] = 'Region';
        locRow[COLUMN_INDEX['Location Status']] = 'Enabled';
        locRow[COLUMN_INDEX['State/Region']] = state;
        locRow[COLUMN_INDEX['Country Code']] = countryCode;
        rows.push(locRow);
      });
    }
    
    // Cities
    if (campaign.locations.cities && campaign.locations.cities.length > 0) {
      campaign.locations.cities.forEach(city => {
        const locRow = createEmptyRow();
        locRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
        locRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
        locRow[COLUMN_INDEX['Location']] = city;
        locRow[COLUMN_INDEX['Location Type']] = 'City';
        locRow[COLUMN_INDEX['Location Status']] = 'Enabled';
        locRow[COLUMN_INDEX['City']] = city;
        locRow[COLUMN_INDEX['Country Code']] = countryCode;
        rows.push(locRow);
      });
    }
    
    // ZIP Codes
    if (campaign.locations.zipCodes && campaign.locations.zipCodes.length > 0) {
      campaign.locations.zipCodes.forEach(zip => {
        const locRow = createEmptyRow();
        locRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
        locRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
        locRow[COLUMN_INDEX['Location']] = zip;
        locRow[COLUMN_INDEX['Location Type']] = 'Postal Code';
        locRow[COLUMN_INDEX['Location Status']] = 'Enabled';
        locRow[COLUMN_INDEX['Postal Code']] = zip;
        locRow[COLUMN_INDEX['Country Code']] = countryCode;
        rows.push(locRow);
      });
    }
  }
  
  // Image asset rows
  if (campaign.imageAssets && campaign.imageAssets.length > 0) {
    campaign.imageAssets.forEach(img => {
      const imgRow = createEmptyRow();
      imgRow[COLUMN_INDEX['Campaign']] = campaign.campaignName;
      imgRow[COLUMN_INDEX['Campaign Status']] = 'Enabled';
      imgRow[COLUMN_INDEX['Image Asset Name']] = img.name;
      imgRow[COLUMN_INDEX['Image Asset URL']] = img.url;
      imgRow[COLUMN_INDEX['Image Asset Status']] = img.status || 'Enabled';
      rows.push(imgRow);
    });
  }
  
  // Convert rows to CSV string with proper escaping
  const csvContent = rows.map(row => row.map(escapeCSV).join(',')).join('\r\n');
  
  // Add UTF-8 BOM for Excel compatibility
  return '\ufeff' + csvContent;
}

/**
 * Download the generated CSV
 */
export function downloadMasterCSV(campaign: CampaignDataV5, filename?: string): void {
  const csvContent = generateMasterCSV(campaign);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `${campaign.campaignName.replace(/[^a-zA-Z0-9]/g, '_')}_GoogleAds.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert legacy campaign data to V5 format
 */
export function convertToV5Format(legacyData: any): CampaignDataV5 {
  const campaign: CampaignDataV5 = {
    campaignName: legacyData.campaignName || 'Campaign',
    dailyBudget: legacyData.dailyBudget || 100,
    campaignType: 'Search',
    bidStrategy: 'Maximize Conversions',
    networks: 'Google search',
    status: 'Enabled',
    url: legacyData.url || legacyData.finalUrl || '',
    adGroups: [],
    negativeKeywords: legacyData.negativeKeywords || [],
    locations: {
      countries: legacyData.locations?.countries || [],
      states: legacyData.locations?.states || [],
      cities: legacyData.locations?.cities || [],
      zipCodes: legacyData.locations?.zipCodes || [],
      countryCode: 'US'
    },
    sitelinks: [],
    callouts: [],
    snippets: []
  };
  
  // Convert ad groups
  if (legacyData.adGroups && Array.isArray(legacyData.adGroups)) {
    campaign.adGroups = legacyData.adGroups.map((ag: any) => ({
      name: ag.name || ag.adgroup_name || 'Ad Group',
      maxCpc: ag.maxCpc || ag.max_cpc || 2.00,
      status: 'Enabled',
      keywords: (ag.keywords || []).map((kw: any) => ({
        text: typeof kw === 'string' ? kw : (kw.text || kw.keyword || ''),
        matchType: typeof kw === 'string' ? 'Broad' : (kw.matchType || kw.match_type || 'Broad'),
        status: 'Enabled',
        finalUrl: legacyData.url || ''
      })),
      ads: []
    }));
  }
  
  // Convert ads
  if (legacyData.ads && Array.isArray(legacyData.ads)) {
    legacyData.ads.forEach((ad: any) => {
      const adGroupName = ad.adGroup || ad.ad_group || 'Ad Group 1';
      let targetGroup = campaign.adGroups.find(ag => ag.name === adGroupName);
      
      if (!targetGroup && campaign.adGroups.length > 0) {
        targetGroup = campaign.adGroups[0];
      } else if (!targetGroup) {
        targetGroup = { name: adGroupName, keywords: [], ads: [], maxCpc: 2.00, status: 'Enabled' };
        campaign.adGroups.push(targetGroup);
      }
      
      const convertedAd: AdV5 = {
        type: ad.type === 'call_only' ? 'CallOnly' : 
              ad.type === 'dki' ? 'DKI' : 'RSA',
        headlines: [
          ad.headline1 || '',
          ad.headline2 || '',
          ad.headline3 || '',
          ad.headline4 || '',
          ad.headline5 || ''
        ].filter(h => h),
        descriptions: [
          ad.description1 || '',
          ad.description2 || ''
        ].filter(d => d),
        path1: ad.path1 || '',
        path2: ad.path2 || '',
        finalUrl: ad.finalUrl || ad.final_url || legacyData.url || '',
        phoneNumber: ad.phoneNumber || '',
        verificationUrl: ad.verificationUrl || '',
        businessName: ad.businessName || ''
      };
      
      targetGroup.ads.push(convertedAd);
    });
  }
  
  // Convert sitelinks - check both direct array and extensions format
  if (legacyData.sitelinks && Array.isArray(legacyData.sitelinks)) {
    campaign.sitelinks = legacyData.sitelinks.slice(0, 4).map((sl: any) => ({
      text: sl.text || '',
      description1: sl.description1 || '',
      description2: sl.description2 || '',
      finalUrl: sl.finalUrl || legacyData.url || legacyData.final_url || '',
      status: 'Enabled'
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const sitelinkExts = legacyData.extensions.filter((e: any) => e.type === 'sitelink');
    campaign.sitelinks = sitelinkExts.slice(0, 4).map((sl: any) => ({
      text: sl.text || sl.linkText || '',
      description1: sl.description1 || sl.descriptionLine1 || '',
      description2: sl.description2 || sl.descriptionLine2 || '',
      finalUrl: sl.finalUrl || sl.url || '',
      status: 'Enabled'
    }));
  }
  
  // Convert callouts - check both direct array and extensions format
  if (legacyData.callouts && Array.isArray(legacyData.callouts)) {
    campaign.callouts = legacyData.callouts.slice(0, 4).map((co: any) => ({
      text: co.text || '',
      status: 'Enabled'
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const calloutExts = legacyData.extensions.filter((e: any) => e.type === 'callout');
    campaign.callouts = calloutExts.slice(0, 4).map((co: any) => ({
      text: co.text || '',
      status: 'Enabled'
    }));
  }
  
  // Convert structured snippets - check both direct array and extensions format
  if (legacyData.structured_snippets && Array.isArray(legacyData.structured_snippets)) {
    campaign.snippets = legacyData.structured_snippets.slice(0, 2).map((sn: any) => ({
      header: sn.header || '',
      values: Array.isArray(sn.values) ? sn.values.join('; ') : (sn.values || ''),
      status: 'Enabled'
    }));
  } else if (legacyData.extensions && Array.isArray(legacyData.extensions)) {
    const snippetExts = legacyData.extensions.filter((e: any) => e.type === 'snippet');
    campaign.snippets = snippetExts.slice(0, 2).map((sn: any) => ({
      header: sn.header || '',
      values: sn.values || '',
      status: 'Enabled'
    }));
  }
  
  return campaign;
}

/**
 * Get statistics about the generated CSV
 */
export function getCSVStatistics(campaign: CampaignDataV5): {
  columns: number;
  campaigns: number;
  adGroups: number;
  keywords: number;
  ads: number;
  negativeKeywords: number;
  locations: number;
  sitelinks: number;
  callouts: number;
} {
  let totalLocations = 0;
  if (campaign.locations) {
    totalLocations = (campaign.locations.countries?.length || 0) +
                     (campaign.locations.states?.length || 0) +
                     (campaign.locations.cities?.length || 0) +
                     (campaign.locations.zipCodes?.length || 0);
  }
  
  return {
    columns: MASTER_CSV_HEADERS.length,
    campaigns: 1,
    adGroups: campaign.adGroups.length,
    keywords: campaign.adGroups.reduce((sum, ag) => sum + ag.keywords.length, 0),
    ads: campaign.adGroups.reduce((sum, ag) => sum + ag.ads.length, 0),
    negativeKeywords: campaign.negativeKeywords?.length || 0,
    locations: totalLocations,
    sitelinks: campaign.sitelinks?.length || 0,
    callouts: campaign.callouts?.length || 0
  };
}
