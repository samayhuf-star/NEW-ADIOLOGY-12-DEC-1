export interface DKIAdContext {
  keywords: string[];
  industry: string;
  businessName: string;
  url?: string;
  location?: string;
}

export interface DKIAdResult {
  headline1: string;
  headline2: string;
  headline3: string;
  description1: string;
  description2: string;
}

function buildDKIDefault(keyword: string, maxLength: number = 20): string {
  const words = keyword.split(' ');
  let result = words[0];
  for (let i = 1; i < words.length && result.length + words[i].length + 1 <= maxLength; i++) {
    result += ' ' + words[i];
  }
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function getDefaultDKIAd(context: DKIAdContext): DKIAdResult {
  const mainKeyword = context.keywords[0] || context.industry || 'Service';
  const dkiDefault = buildDKIDefault(mainKeyword, 12);
  const shortDefault = buildDKIDefault(mainKeyword, 8);
  
  return {
    headline1: `{KeyWord:${dkiDefault}} Experts`,
    headline2: `Best {KeyWord:${shortDefault}} Near You`,
    headline3: `Call ${context.businessName.substring(0, 20)} Today`,
    description1: `Professional ${mainKeyword} services you can trust. ${context.businessName} delivers expert solutions. Contact us today.`,
    description2: `Looking for quality ${mainKeyword}? We offer fast, reliable service with satisfaction guaranteed. Get your free quote now.`,
  };
}

export async function generateDKIAdWithAI(context: DKIAdContext): Promise<DKIAdResult> {
  try {
    const response = await fetch('/api/generate-dki-ad', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: context.keywords,
        industry: context.industry,
        businessName: context.businessName,
        url: context.url,
        location: context.location,
      }),
    });

    if (!response.ok) {
      console.error('DKI API error:', response.status);
      return getDefaultDKIAd(context);
    }

    const result = await response.json() as DKIAdResult;
    
    if (!result.headline1 || !result.description1) {
      console.warn('Incomplete DKI response, using defaults');
      return getDefaultDKIAd(context);
    }
    
    return result;
  } catch (error) {
    console.error('Error generating DKI ad with AI:', error);
    return getDefaultDKIAd(context);
  }
}
