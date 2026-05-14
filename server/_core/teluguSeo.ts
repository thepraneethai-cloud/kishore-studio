/**
 * Telugu SEO Keywords & Metadata Optimization
 * Comprehensive database of Telugu devotional keywords and SEO strategies
 */

export interface TeluguKeywordSet {
  primary: string[];
  longTail: string[];
  seasonal: string[];
  trending: string[];
}

export interface DeityKeywords {
  [deity: string]: TeluguKeywordSet;
}

/**
 * Core Telugu devotional keywords
 * These are the most searched terms in Telugu devotional content
 */
export const CORE_TELUGU_KEYWORDS = {
  primary: [
    "భక్తి", // Devotion
    "దేవుడు", // God
    "ఆరతి", // Aarti (prayer ritual)
    "మంత్రం", // Mantra
    "స్తోత్రం", // Hymn/Prayer
    "పూజ", // Worship
    "ఆలయ", // Temple
    "దేవత", // Deity
    "భగవంతుడు", // Lord
    "ఆధ్యాత్మిక", // Spiritual
  ],
  longTail: [
    "శ్రీ కృష్ణ భక్తి గీతం", // Sri Krishna Devotional Song
    "హనుమాన్ చాలీసా", // Hanuman Chalisa
    "దుర్గా దేవీ ఆరతి", // Durga Devi Aarti
    "శివ శంభో మంత్రం", // Shiva Shambho Mantra
    "రామ నవమీ భక్తి", // Ram Navami Devotion
    "నవరాత్రి పూజ", // Navratri Worship
    "గణేష చతుర్థీ", // Ganesh Chaturthi
    "జన్మాష్టమీ ఆరతి", // Janmashtami Aarti
    "సరస్వతీ పూజ", // Saraswati Worship
    "లక్ష్మీ ధన్యవాదాలు", // Lakshmi Gratitude
  ],
  seasonal: [
    "నవరాత్రి", // Navratri (Sep-Oct)
    "దిపావళి", // Diwali (Oct-Nov)
    "హోళీ", // Holi (Mar-Apr)
    "జన్మాష్టమీ", // Janmashtami (Aug-Sep)
    "రామనవమీ", // Ram Navami (Mar-Apr)
    "గణేష చతుర్థీ", // Ganesh Chaturthi (Aug-Sep)
  ],
  trending: [
    "భక్తి గీతాలు", // Devotional Songs
    "మంత్ర ధ్యానం", // Mantra Meditation
    "ఆధ్యాత్మిక సంగీతం", // Spiritual Music
    "దేవీ భక్తి", // Goddess Devotion
    "శివ ధ్యానం", // Shiva Meditation
  ],
};

/**
 * Deity-specific keywords
 */
export const DEITY_KEYWORDS: DeityKeywords = {
  krishna: {
    primary: ["కృష్ణ", "గోపాల", "గోవర్ధన", "వృందావన"],
    longTail: [
      "శ్రీ కృష్ణ లీల",
      "రాధా కృష్ణ",
      "గోపీ గీతాలు",
      "కృష్ణ ఆరతి",
      "కృష్ణ భక్తి",
    ],
    seasonal: ["జన్మాష్టమీ", "హోళీ"],
    trending: ["కృష్ణ మంత్రం", "కృష్ణ ధ్యానం"],
  },
  shiva: {
    primary: ["శివ", "మహేశ్వర", "శంభూ", "కైలాస"],
    longTail: [
      "శివ శంభో",
      "శివ ఆరతి",
      "శివ మంత్రం",
      "శివ ధ్యానం",
      "శివ భక్తి",
    ],
    seasonal: ["మహా శివరాత్రి"],
    trending: ["ఓం నమ: శివాయ", "శివ పూజ"],
  },
  hanuman: {
    primary: ["హనుమాన్", "హనూమాన్", "మారుతి", "బాలాజీ"],
    longTail: [
      "హనుమాన్ చాలీసా",
      "హనుమాన్ ఆరతి",
      "హనుమాన్ మంత్రం",
      "హనుమాన్ భక్తి",
      "హనుమాన్ స్తోత్రం",
    ],
    seasonal: ["హనుమాన్ జయంతి"],
    trending: ["హనుమాన్ ధ్యానం", "హనుమాన్ కీర్తనం"],
  },
  durga: {
    primary: ["దుర్గ", "దేవీ", "శక్తి", "చండీ"],
    longTail: [
      "దుర్గా దేవీ",
      "దుర్గా ఆరతి",
      "దుర్గా సప్తశతీ",
      "దుర్గా భక్తి",
      "దుర్గా స్తోత్రం",
    ],
    seasonal: ["నవరాత్రి", "దసరా"],
    trending: ["దేవీ ధ్యానం", "శక్తి పూజ"],
  },
  rama: {
    primary: ["రామ", "రాముడు", "రాజీవ", "అయోధ్య"],
    longTail: [
      "రామ రామయణ",
      "రామ ఆరతి",
      "రామ మంత్రం",
      "రామ భక్తి",
      "రామ చరితమానస",
    ],
    seasonal: ["రామనవమీ", "దసరా"],
    trending: ["జై శ్రీరామ", "రామ ధ్యానం"],
  },
  ganesha: {
    primary: ["గణేష", "విఘ్నేశ్వర", "లంబోదర", "గజానన"],
    longTail: [
      "గణేష చతుర్థీ",
      "గణేష ఆరతి",
      "గణేష మంత్రం",
      "గణేష భక్తి",
      "గణేష స్తోత్రం",
    ],
    seasonal: ["గణేష చతుర్థీ"],
    trending: ["ఓం గం గణపతయే", "గణేష ధ్యానం"],
  },
  saraswati: {
    primary: ["సరస్వతీ", "వీణాపాణి", "శారదా", "వాక్"],
    longTail: [
      "సరస్వతీ పూజ",
      "సరస్వతీ ఆరతి",
      "సరస్వతీ మంత్రం",
      "సరస్వతీ భక్తి",
      "సరస్వతీ స్తోత్రం",
    ],
    seasonal: ["సరస్వతీ పూజ"],
    trending: ["సరస్వతీ ధ్యానం", "విద్య దేవీ"],
  },
  lakshmi: {
    primary: ["లక్ష్మీ", "మహాలక్ష్మీ", "ధన్య", "సమృద్ధి"],
    longTail: [
      "లక్ష్మీ పూజ",
      "లక్ష్మీ ఆరతి",
      "లక్ష్మీ మంత్రం",
      "లక్ష్మీ భక్తి",
      "లక్ష్మీ స్తోత్రం",
    ],
    seasonal: ["దిపావళి"],
    trending: ["లక్ష్మీ ధ్యానం", "సమృద్ధి పూజ"],
  },
};

/**
 * Category-specific SEO strategies
 */
export const CATEGORY_SEO_STRATEGIES = {
  devotional: {
    keywords: ["భక్తి", "ఆరతి", "పూజ", "మంత్రం"],
    hashtags: ["#తెలుగుభక్తి", "#దేవుడు", "#ఆధ్యాత్మిక", "#మంత్రం"],
    titlePattern: "{deity} {type} - {mood} భక్తి గీతం",
    descriptionPattern: "{deity} యొక్క {mood} భక్తి గీతం. {masterPrompt}",
  },
  cinematic: {
    keywords: ["చిత్రం", "కథ", "నటన", "సంగీతం"],
    hashtags: ["#తెలుగుసినిమా", "#కథ", "#సంగీతం", "#చిత్రం"],
    titlePattern: "{deity} {type} - {mood} సినిమాటిక్ సంగీతం",
    descriptionPattern: "{deity} యొక్క {mood} సినిమాటిక్ సంగీతం. {masterPrompt}",
  },
  folk: {
    keywords: ["జానపద", "సంప్రదాయ", "సంగీతం", "నృత్యం"],
    hashtags: ["#జానపదసంగీతం", "#సంప్రదాయ", "#నృత్యం", "#తెలుగు"],
    titlePattern: "{deity} {type} - {mood} జానపద సంగీతం",
    descriptionPattern: "{deity} యొక్క {mood} జానపద సంగీతం. {masterPrompt}",
  },
  romantic: {
    keywords: ["ప్రేమ", "రోమాంటిక్", "సంగీతం", "భక్తి"],
    hashtags: ["#ప్రేమసంగీతం", "#రోమాంటిక్", "#భక్తి", "#సంగీతం"],
    titlePattern: "{deity} {type} - {mood} ప్రేమ గీతం",
    descriptionPattern: "{deity} యొక్క {mood} ప్రేమ గీతం. {masterPrompt}",
  },
  emotional: {
    keywords: ["భావోద్వేగ", "హృదయ", "సంగీతం", "భక్తి"],
    hashtags: ["#భావోద్వేగ", "#హృదయ", "#సంగీతం", "#భక్తి"],
    titlePattern: "{deity} {type} - {mood} భావోద్వేగ గీతం",
    descriptionPattern: "{deity} యొక్క {mood} భావోద్వేగ గీతం. {masterPrompt}",
  },
};

/**
 * Generate SEO-optimized metadata
 */
export function generateSeoMetadata(params: {
  deity: string;
  category: string;
  mood: string;
  masterPrompt: string;
  language?: string;
}): {
  title: string;
  description: string;
  keywords: string[];
  hashtags: string[];
  seoScore: number;
} {
  const { deity, category, mood, masterPrompt, language = "telugu" } = params;

  // Get category strategy
  const strategy =
    CATEGORY_SEO_STRATEGIES[category as keyof typeof CATEGORY_SEO_STRATEGIES] ||
    CATEGORY_SEO_STRATEGIES.devotional;

  // Get deity keywords
  const deityKey = deity.toLowerCase().replace(/\s+/g, "");
  const deityKeywordSet =
    DEITY_KEYWORDS[deityKey as keyof typeof DEITY_KEYWORDS] ||
    DEITY_KEYWORDS.krishna;

  // Generate title
  const title = strategy.titlePattern
    .replace("{deity}", deity)
    .replace("{type}", category)
    .replace("{mood}", mood)
    .substring(0, 60); // YouTube title limit

  // Generate description
  const description = strategy.descriptionPattern
    .replace("{deity}", deity)
    .replace("{mood}", mood)
    .replace("{masterPrompt}", masterPrompt.substring(0, 200))
    .substring(0, 5000); // YouTube description limit

  // Combine keywords
  const keywords = [
    ...strategy.keywords,
    ...deityKeywordSet.primary,
    ...deityKeywordSet.longTail.slice(0, 3),
    mood,
    category,
  ];

  // Combine hashtags
  const hashtags = [
    ...strategy.hashtags,
    ...deityKeywordSet.primary.map((k) => `#${k}`).slice(0, 3),
  ];

  // Calculate SEO score (0-100)
  const seoScore = calculateSeoScore({
    titleLength: title.length,
    descriptionLength: description.length,
    keywordCount: keywords.length,
    hashtagCount: hashtags.length,
    hasDeityKeywords: deityKeywordSet.primary.some((k) =>
      description.includes(k)
    ),
    hasCategoryKeywords: strategy.keywords.some((k) =>
      description.includes(k)
    ),
  });

  return {
    title,
    description,
    keywords,
    hashtags,
    seoScore,
  };
}

/**
 * Calculate SEO score based on metadata quality
 */
function calculateSeoScore(params: {
  titleLength: number;
  descriptionLength: number;
  keywordCount: number;
  hashtagCount: number;
  hasDeityKeywords: boolean;
  hasCategoryKeywords: boolean;
}): number {
  let score = 0;

  // Title length (ideal: 50-60 characters)
  if (params.titleLength >= 50 && params.titleLength <= 60) score += 20;
  else if (params.titleLength >= 40 && params.titleLength <= 70) score += 15;
  else if (params.titleLength > 0) score += 10;

  // Description length (ideal: 150-300 characters)
  if (params.descriptionLength >= 150 && params.descriptionLength <= 300)
    score += 20;
  else if (params.descriptionLength >= 100 && params.descriptionLength <= 500)
    score += 15;
  else if (params.descriptionLength > 0) score += 10;

  // Keywords
  if (params.keywordCount >= 5 && params.keywordCount <= 10) score += 20;
  else if (params.keywordCount >= 3) score += 15;
  else score += 5;

  // Hashtags
  if (params.hashtagCount >= 5 && params.hashtagCount <= 10) score += 15;
  else if (params.hashtagCount >= 3) score += 10;
  else score += 5;

  // Deity and category keywords
  if (params.hasDeityKeywords) score += 10;
  if (params.hasCategoryKeywords) score += 10;

  return Math.min(score, 100);
}

/**
 * Get trending keywords for current season
 */
export function getTrendingKeywords(deity: string): string[] {
  const deityKey = deity.toLowerCase().replace(/\s+/g, "");
  const deityKeywordSet =
    DEITY_KEYWORDS[deityKey as keyof typeof DEITY_KEYWORDS] ||
    DEITY_KEYWORDS.krishna;

  const currentMonth = new Date().getMonth();
  const isSeason = checkSeasonalRelevance(currentMonth);

  const keywords = [
    ...deityKeywordSet.trending,
    ...CORE_TELUGU_KEYWORDS.trending,
  ];

  if (isSeason) {
    keywords.push(...deityKeywordSet.seasonal);
    keywords.push(...CORE_TELUGU_KEYWORDS.seasonal);
  }

  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Check if current month is relevant to seasonal keywords
 */
function checkSeasonalRelevance(month: number): boolean {
  // Navratri: Sep-Oct (8-9)
  // Diwali: Oct-Nov (9-10)
  // Holi: Mar-Apr (2-3)
  // Janmashtami: Aug-Sep (7-8)
  // Ram Navami: Mar-Apr (2-3)
  // Ganesh Chaturthi: Aug-Sep (7-8)

  return (
    month === 7 || // August
    month === 8 || // September
    month === 9 || // October
    month === 10 || // November
    month === 2 || // March
    month === 3 // April
  );
}


/**
 * Competitor Metadata Analysis
 * Analyze top-performing devotional videos and extract metadata strategies
 */
export interface CompetitorAnalysis {
  avgTitleLength: number;
  avgDescriptionLength: number;
  commonKeywords: string[];
  commonHashtags: string[];
  titlePatterns: string[];
  engagementScore: number;
}

export const COMPETITOR_STRATEGIES: Record<string, CompetitorAnalysis> = {
  devotional: {
    avgTitleLength: 55,
    avgDescriptionLength: 250,
    commonKeywords: [
      "భక్తి",
      "ఆరతి",
      "మంత్రం",
      "దేవుడు",
      "స్తోత్రం",
      "పూజ",
      "ఆధ్యాత్మిక",
    ],
    commonHashtags: [
      "#తెలుగుభక్తి",
      "#దేవుడు",
      "#ఆరతి",
      "#మంత్రం",
      "#ఆధ్యాత్మిక",
    ],
    titlePatterns: [
      "{deity} {type} - {mood}",
      "{deity} భక్తి గీతం",
      "{deity} ఆరతి",
      "{deity} {mood} - సంగీతం",
    ],
    engagementScore: 0.85,
  },
  cinematic: {
    avgTitleLength: 60,
    avgDescriptionLength: 300,
    commonKeywords: [
      "చిత్రం",
      "కథ",
      "సంగీతం",
      "నటన",
      "సినిమాటిక్",
      "కలాత్మక",
    ],
    commonHashtags: [
      "#తెలుగుసినిమా",
      "#కథ",
      "#సంగీతం",
      "#చిత్రం",
      "#సినిమాటిక్",
    ],
    titlePatterns: [
      "{deity} {type} - {mood} సినిమాటిక్ సంగీతం",
      "{deity} {mood} - చిత్రం",
      "{deity} సినిమాటిక్ {mood}",
    ],
    engagementScore: 0.8,
  },
  folk: {
    avgTitleLength: 50,
    avgDescriptionLength: 200,
    commonKeywords: [
      "జానపద",
      "సంప్రదాయ",
      "సంగీతం",
      "నృత్యం",
      "సాంస్కృతిక",
    ],
    commonHashtags: [
      "#జానపదసంగీతం",
      "#సంప్రదాయ",
      "#నృత్యం",
      "#తెలుగు",
      "#సాంస్కృతిక",
    ],
    titlePatterns: [
      "{deity} జానపద {mood}",
      "{deity} సంప్రదాయ సంగీతం",
      "{deity} {type} - జానపద",
    ],
    engagementScore: 0.75,
  },
};

/**
 * Keyword Density Analysis
 * Analyze keyword density in metadata for optimal SEO
 */
export interface KeywordDensityAnalysis {
  titleDensity: number;
  descriptionDensity: number;
  overallDensity: number;
  densityScore: number;
  recommendations: string[];
}

export function analyzeKeywordDensity(params: {
  title: string;
  description: string;
  keywords: string[];
}): KeywordDensityAnalysis {
  const { title, description, keywords } = params;
  const fullText = `${title} ${description}`.toLowerCase();
  const totalWords = fullText.split(/\s+/).length;

  let titleKeywordCount = 0;
  let descriptionKeywordCount = 0;
  let totalKeywordCount = 0;

  keywords.forEach((keyword) => {
    const keywordLower = keyword.toLowerCase();
    const titleMatches = (title.toLowerCase().match(new RegExp(keywordLower, "g")) ||
      []).length;
    const descriptionMatches = (description
      .toLowerCase()
      .match(new RegExp(keywordLower, "g")) || []).length;

    titleKeywordCount += titleMatches;
    descriptionKeywordCount += descriptionMatches;
    totalKeywordCount += titleMatches + descriptionMatches;
  });

  const titleWords = title.split(/\s+/).length;
  const descriptionWords = description.split(/\s+/).length;

  const titleDensity =
    titleWords > 0 ? (titleKeywordCount / titleWords) * 100 : 0;
  const descriptionDensity =
    descriptionWords > 0 ? (descriptionKeywordCount / descriptionWords) * 100 : 0;
  const overallDensity =
    totalWords > 0 ? (totalKeywordCount / totalWords) * 100 : 0;

  // Calculate density score (optimal: 2-5% overall density)
  let densityScore = 0;
  if (overallDensity >= 2 && overallDensity <= 5) densityScore = 100;
  else if (overallDensity >= 1 && overallDensity <= 7) densityScore = 80;
  else if (overallDensity >= 0.5 && overallDensity <= 10) densityScore = 60;
  else densityScore = 40;

  // Generate recommendations
  const recommendations: string[] = [];
  if (titleDensity < 10) recommendations.push("Add more keywords to title");
  if (descriptionDensity < 5)
    recommendations.push("Add more keywords to description");
  if (overallDensity < 2) recommendations.push("Increase keyword density");
  if (overallDensity > 10) recommendations.push("Reduce keyword density (avoid over-optimization)");
  if (titleKeywordCount === 0) recommendations.push("Include at least one keyword in title");

  return {
    titleDensity: Math.round(titleDensity * 100) / 100,
    descriptionDensity: Math.round(descriptionDensity * 100) / 100,
    overallDensity: Math.round(overallDensity * 100) / 100,
    densityScore,
    recommendations,
  };
}

/**
 * Analyze metadata against competitor strategies
 */
export function analyzeCompetitorStrategy(params: {
  category: string;
  title: string;
  description: string;
  keywords: string[];
  hashtags: string[];
}): {
  competitorScore: number;
  recommendations: string[];
  analysis: CompetitorAnalysis;
} {
  const { category, title, description, keywords, hashtags } = params;

  const strategy =
    COMPETITOR_STRATEGIES[category as keyof typeof COMPETITOR_STRATEGIES] ||
    COMPETITOR_STRATEGIES.devotional;

  let score = 0;

  // Title length comparison
  const titleLengthDiff = Math.abs(title.length - strategy.avgTitleLength);
  if (titleLengthDiff <= 10) score += 20;
  else if (titleLengthDiff <= 20) score += 15;
  else score += 10;

  // Description length comparison
  const descriptionLengthDiff = Math.abs(
    description.length - strategy.avgDescriptionLength
  );
  if (descriptionLengthDiff <= 50) score += 20;
  else if (descriptionLengthDiff <= 100) score += 15;
  else score += 10;

  // Common keywords match
  const commonKeywordMatches = keywords.filter((k) =>
    strategy.commonKeywords.some((ck) =>
      k.toLowerCase().includes(ck.toLowerCase())
    )
  ).length;
  score += Math.min(commonKeywordMatches * 5, 20);

  // Common hashtags match
  const commonHashtagMatches = hashtags.filter((h) =>
    strategy.commonHashtags.some((ch) =>
      h.toLowerCase().includes(ch.toLowerCase())
    )
  ).length;
  score += Math.min(commonHashtagMatches * 3, 15);

  // Engagement potential
  score += Math.round(strategy.engagementScore * 15);

  const recommendations: string[] = [];
  if (titleLengthDiff > 20)
    recommendations.push(
      `Adjust title length to ~${strategy.avgTitleLength} characters`
    );
  if (descriptionLengthDiff > 100)
    recommendations.push(
      `Adjust description length to ~${strategy.avgDescriptionLength} characters`
    );
  if (commonKeywordMatches < 3)
    recommendations.push("Include more common keywords from top performers");
  if (commonHashtagMatches < 2)
    recommendations.push("Use more popular hashtags from competitor analysis");

  return {
    competitorScore: Math.min(score, 100),
    recommendations,
    analysis: strategy,
  };
}

/**
 * Enhanced SEO metadata generation with competitor analysis and keyword density
 */
export function generateEnhancedSeoMetadata(params: {
  deity: string;
  category: string;
  mood: string;
  masterPrompt: string;
  language?: string;
}): {
  title: string;
  description: string;
  keywords: string[];
  hashtags: string[];
  seoScore: number;
  keywordDensity: KeywordDensityAnalysis;
  competitorAnalysis: {
    competitorScore: number;
    recommendations: string[];
  };
} {
  const baseSeoMetadata = generateSeoMetadata(params);

  // Analyze keyword density
  const keywordDensity = analyzeKeywordDensity({
    title: baseSeoMetadata.title,
    description: baseSeoMetadata.description,
    keywords: baseSeoMetadata.keywords,
  });

  // Analyze competitor strategy
  const competitorAnalysis = analyzeCompetitorStrategy({
    category: params.category,
    title: baseSeoMetadata.title,
    description: baseSeoMetadata.description,
    keywords: baseSeoMetadata.keywords,
    hashtags: baseSeoMetadata.hashtags,
  });

  // Calculate combined SEO score
  const combinedSeoScore = Math.round(
    (baseSeoMetadata.seoScore * 0.4 +
      keywordDensity.densityScore * 0.3 +
      competitorAnalysis.competitorScore * 0.3) /
      10
  );

  return {
    ...baseSeoMetadata,
    seoScore: combinedSeoScore,
    keywordDensity,
    competitorAnalysis: {
      competitorScore: competitorAnalysis.competitorScore,
      recommendations: competitorAnalysis.recommendations,
    },
  };
}

/**
 * Multilingual metadata generation
 */
export interface MultilingualMetadata {
  telugu: typeof generateSeoMetadata extends (params: any) => infer R ? R : never;
  tamil: typeof generateSeoMetadata extends (params: any) => infer R ? R : never;
  kannada: typeof generateSeoMetadata extends (params: any) => infer R ? R : never;
  malayalam: typeof generateSeoMetadata extends (params: any) => infer R ? R : never;
}

export function generateMultilingualMetadata(params: {
  deity: string;
  category: string;
  mood: string;
  masterPrompt: string;
}): Record<string, ReturnType<typeof generateSeoMetadata>> {
  const languages = ["telugu", "tamil", "kannada", "malayalam"] as const;
  const metadata: Record<string, ReturnType<typeof generateSeoMetadata>> = {};

  languages.forEach((lang) => {
    metadata[lang] = generateSeoMetadata({
      ...params,
      language: lang,
    });
  });

  return metadata;
}
