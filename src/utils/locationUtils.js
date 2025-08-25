/**
 * Get country flag emoji for a country name
 * @param {string} country - Country name
 * @returns {string} Country flag emoji
 */
export const getCountryFlag = (country) => {
  if (!country) return ''
  
  const flagMap = {
    'USA': '🇺🇸',
    'United States': '🇺🇸',
    'UK': '🇬🇧',
    'United Kingdom': '🇬🇧',
    'Spain': '🇪🇸',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Italy': '🇮🇹',
    'Netherlands': '🇳🇱',
    'Belgium': '🇧🇪',
    'Switzerland': '🇨🇭',
    'Austria': '🇦🇹',
    'Portugal': '🇵🇹',
    'Greece': '🇬🇷',
    'Turkey': '🇹🇷',
    'Poland': '🇵🇱',
    'Czech Republic': '🇨🇿',
    'Hungary': '🇭🇺',
    'Slovakia': '🇸🇰',
    'Slovenia': '🇸🇮',
    'Croatia': '🇭🇷',
    'Serbia': '🇷🇸',
    'Bulgaria': '🇧🇬',
    'Romania': '🇷🇴',
    'Ukraine': '🇺🇦',
    'Russia': '🇷🇺',
    'Estonia': '🇪🇪',
    'Latvia': '🇱🇻',
    'Lithuania': '🇱🇹',
    'Finland': '🇫🇮',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Iceland': '🇮🇸',
    'Canada': '🇨🇦',
    'Mexico': '🇲🇽',
    'Brazil': '🇧🇷',
    'Argentina': '🇦🇷',
    'Chile': '🇨🇱',
    'Peru': '🇵🇪',
    'Colombia': '🇨🇴',
    'Venezuela': '🇻🇪',
    'Ecuador': '🇪🇨',
    'Bolivia': '🇧🇴',
    'Paraguay': '🇵🇾',
    'Uruguay': '🇺🇾',
    'Guyana': '🇬🇾',
    'Suriname': '🇸🇷',
    'French Guiana': '🇬🇫',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'South Korea': '🇰🇷',
    'North Korea': '🇰🇵',
    'Taiwan': '🇹🇼',
    'Hong Kong': '🇭🇰',
    'Macau': '🇲🇴',
    'Mongolia': '🇲🇳',
    'Vietnam': '🇻🇳',
    'Thailand': '🇹🇭',
    'Cambodia': '🇰🇭',
    'Laos': '🇱🇦',
    'Myanmar': '🇲🇲',
    'Malaysia': '🇲🇾',
    'Singapore': '🇸🇬',
    'Indonesia': '🇮🇩',
    'Philippines': '🇵🇭',
    'Brunei': '🇧🇳',
    'East Timor': '🇹🇱',
    'India': '🇮🇳',
    'Pakistan': '🇵🇰',
    'Bangladesh': '🇧🇩',
    'Sri Lanka': '🇱🇰',
    'Nepal': '🇳🇵',
    'Bhutan': '🇧🇹',
    'Maldives': '🇲🇻',
    'Afghanistan': '🇦🇫',
    'Iran': '🇮🇷',
    'Iraq': '🇮🇶',
    'Syria': '🇸🇾',
    'Lebanon': '🇱🇧',
    'Jordan': '🇯🇴',
    'Israel': '🇮🇱',
    'Palestine': '🇵🇸',
    'Saudi Arabia': '🇸🇦',
    'Yemen': '🇾🇪',
    'Oman': '🇴🇲',
    'UAE': '🇦🇪',
    'Qatar': '🇶🇦',
    'Bahrain': '🇧🇭',
    'Kuwait': '🇰🇼',
    'Egypt': '🇪🇬',
    'Libya': '🇱🇾',
    'Tunisia': '🇹🇳',
    'Algeria': '🇩🇿',
    'Morocco': '🇲🇦',
    'Sudan': '🇸🇩',
    'South Sudan': '🇸🇸',
    'Ethiopia': '🇪🇹',
    'Eritrea': '🇪🇷',
    'Djibouti': '🇩🇯',
    'Somalia': '🇸🇴',
    'Kenya': '🇰🇪',
    'Uganda': '🇺🇬',
    'Tanzania': '🇹🇿',
    'Rwanda': '🇷🇼',
    'Burundi': '🇧🇮',
    'DR Congo': '🇨🇩',
    'Congo': '🇨🇬',
    'Gabon': '🇬🇦',
    'Equatorial Guinea': '🇬🇶',
    'Cameroon': '🇨🇲',
    'Nigeria': '🇳🇬',
    'Niger': '🇳🇪',
    'Chad': '🇹🇩',
    'Central African Republic': '🇨🇫',
    'South Africa': '🇿🇦',
    'Namibia': '🇳🇦',
    'Botswana': '🇧🇼',
    'Zimbabwe': '🇿🇼',
    'Zambia': '🇿🇲',
    'Malawi': '🇲🇼',
    'Mozambique': '🇲🇿',
    'Madagascar': '🇲🇬',
    'Mauritius': '🇲🇺',
    'Seychelles': '🇸🇨',
    'Comoros': '🇰🇲',
    'Australia': '🇦🇺',
    'New Zealand': '🇳🇿',
    'Fiji': '🇫🇯',
    'Papua New Guinea': '🇵🇬',
    'Solomon Islands': '🇸🇧',
    'Vanuatu': '🇻🇺',
    'New Caledonia': '🇳🇨',
    'French Polynesia': '🇵🇫',
    'Samoa': '🇼🇸',
    'Tonga': '🇹🇴',
    'Tuvalu': '🇹🇻',
    'Kiribati': '🇰🇮',
    'Nauru': '🇳🇷',
    'Palau': '🇵🇼',
    'Micronesia': '🇫🇲',
    'Marshall Islands': '🇲🇭',
    'Northern Mariana Islands': '🇲🇵',
    'Guam': '🇬🇺',
    'American Samoa': '🇦🇸',
    'Cook Islands': '🇨🇰',
    'Niue': '🇳🇺',
    'Tokelau': '🇹🇰',
    'Wallis and Futuna': '🇼🇫',
    'Pitcairn': '🇵🇳',
    'Easter Island': '🇨🇱',
    'Galapagos': '🇪🇨',
    'Falkland Islands': '🇫🇰',
    'South Georgia': '🇬🇸',
    'Antarctica': '🇦🇶'
  }
  
  return flagMap[country] || '🌍'
}

/**
 * Get ISO country code for country name (for flag libraries)
 * @param {string} country - Country name  
 * @returns {string} ISO 3166-1 alpha-2 country code
 */
export const getCountryCode = (country) => {
  if (!country) return ''
  
  const countryToCode = {
    'USA': 'US', 'United States': 'US',
    'UK': 'GB', 'United Kingdom': 'GB',
    'Spain': 'ES', 'France': 'FR', 'Germany': 'DE', 'Italy': 'IT',
    'Netherlands': 'NL', 'Belgium': 'BE', 'Switzerland': 'CH', 'Austria': 'AT',
    'Portugal': 'PT', 'Greece': 'GR', 'Turkey': 'TR', 'Poland': 'PL',
    'Czech Republic': 'CZ', 'Hungary': 'HU', 'Slovakia': 'SK', 'Slovenia': 'SI',
    'Croatia': 'HR', 'Serbia': 'RS', 'Bulgaria': 'BG', 'Romania': 'RO',
    'Ukraine': 'UA', 'Russia': 'RU', 'Estonia': 'EE', 'Latvia': 'LV',
    'Lithuania': 'LT', 'Finland': 'FI', 'Sweden': 'SE', 'Norway': 'NO',
    'Denmark': 'DK', 'Iceland': 'IS', 'Ireland': 'IE',
    'Canada': 'CA', 'Mexico': 'MX', 'Brazil': 'BR', 'Argentina': 'AR',
    'Chile': 'CL', 'Peru': 'PE', 'Colombia': 'CO', 'Venezuela': 'VE',
    'Japan': 'JP', 'China': 'CN', 'South Korea': 'KR', 'India': 'IN',
    'Australia': 'AU', 'New Zealand': 'NZ', 'Singapore': 'SG',
    'Thailand': 'TH', 'Vietnam': 'VN', 'Malaysia': 'MY', 'Indonesia': 'ID',
    'Philippines': 'PH', 'Taiwan': 'TW', 'Hong Kong': 'HK',
    'South Africa': 'ZA', 'Egypt': 'EG', 'Morocco': 'MA', 'Nigeria': 'NG',
    'Kenya': 'KE', 'Israel': 'IL', 'UAE': 'AE', 'Saudi Arabia': 'SA',
    'Qatar': 'QA', 'Lebanon': 'LB', 'Jordan': 'JO', 'Iran': 'IR'
  }
  
  return countryToCode[country] || ''
}

/**
 * Resolve listing type from row (supports multiple header names or falls back to column E)
 * @param {Object} row - Property data row
 * @returns {string} Listing type ('sublets', 'exchange', or '')
 */
export const getListingType = (row) => {
  if (!row || typeof row !== 'object') return ''
  const cand = row.Type ?? row.type ?? row['Listing Type'] ?? row['listing type'] ?? row.Category ?? row.category
  let value = cand
  if (!value) {
    const keys = Object.keys(row)
    if (keys.length >= 5) value = row[keys[4]] // column E fallback
  }
  if (!value || typeof value !== 'string') return ''
  const v = value.trim().toLowerCase()
  if (v.startsWith('sublet')) return 'sublets'
  if (v.startsWith('exchange')) return 'exchange'
  return ''
}
