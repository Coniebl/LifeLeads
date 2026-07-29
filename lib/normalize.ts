export function normalizeLocationName(source: string): string {
  if (!source) return "";
  let base = source.split(" - 20")[0].trim();
  if (base.toLowerCase().endsWith(".xlsx")) {
    base = base.substring(0, base.length - 5).trim();
  }
  
  base = base.split(",")[0].trim();

  return base.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
}

const US_LOCATIONS = [
  "los angeles", "seattle", "new york", "san francisco", "dallas", 
  "utah", "california", "texas", "florida", "illinois", 
  "pennsylvania", "virginia", "ohio", "massachusetts", 
  "georgia", "michigan", "north carolina", "maryland", 
  "new jersey", "washington", "colorado", "minnesota", 
  "indiana", "arizona", "wisconsin", "tennessee", 
  "missouri", "oregon", "south carolina", "connecticut", 
  "kentucky", "district of columbia", "nevada", "alabama", 
  "louisiana", "kansas", "nebraska", "oklahoma", 
  "arkansas", "new hampshire", "new mexico", "mississippi", 
  "west virginia", "maine", "idaho", "rhode island", 
  "north dakota", "delaware", "montana", "hawaii", 
  "alaska", "wyoming", "south dakota", "vermont",
  "united states", "america", "united states of america"
];

const CHINA_LOCATIONS = [
  "china", "beijing", "shanghai", "beijing g", "shannghai"
];

const UK_LOCATIONS = [
  "uk", "scotland", "scotland(uk)", "england", "wales", "united kingdom"
];

export function getCountryForLocation(location: string): string | null {
  if (!location) return null;
  const lowerLoc = location.toLowerCase();
  
  // Exact matches for acronyms to avoid matching "us" inside other words
  const exactMatches = ["usa", "us", "u.s.", "u.s.a"];
  if (exactMatches.includes(lowerLoc)) {
    return "USA";
  }
  
  // Use word boundaries for strict matching of USA/US to avoid "Jerusalem" or "Australia"
  if (lowerLoc.match(/\b(usa|us)\b/i)) {
    return "USA";
  }

  if (US_LOCATIONS.some(usLoc => lowerLoc.includes(usLoc) || lowerLoc === usLoc)) {
    return "USA";
  }

  if (CHINA_LOCATIONS.some(loc => lowerLoc.includes(loc) || lowerLoc === loc)) {
    return "China";
  }

  if (UK_LOCATIONS.some(loc => lowerLoc.includes(loc) || lowerLoc === loc)) {
    return "United Kingdom";
  }
  
  return null;
}

export function formatLocationWithCountry(location: string): string {
  if (!location) return "";
  const normalized = normalizeLocationName(location);
  const country = getCountryForLocation(normalized);
  if (country) {
    return `${country}, ${normalized}`;
  }
  return normalized;
}
