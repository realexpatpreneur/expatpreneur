// The prototype's reference lists, copied across unchanged.
//
// Countries and nationalities follow the UN member list plus the
// territories people actually name. Cities are a working set of places
// expat founders live in; a production build would ask a places service.
//
// These are the only values the searchable fields accept, so a member
// typing "Holland" or "UAE" lands on the entry the database stores.


export const COUNTRIES: string[] = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola",
  "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus",
  "Belgium", "Belize", "Benin", "Bhutan", "Bolivia",
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia",
  "Comoros", "Congo", "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba",
  "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark",
  "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt",
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini",
  "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea",
  "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel",
  "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
  "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho",
  "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macao",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
  "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
  "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia",
  "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama",
  "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland",
  "Portugal", "Puerto Rico", "Qatar", "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "São Tomé and Príncipe", "Saudi Arabia", "Senegal", "Serbia",
  "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "Solomon Islands", "Somalia", "South Africa", "South Korea",
  "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden",
  "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand",
  "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia",
  "Türkiye", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen",
  "Zambia", "Zimbabwe",
];

export const NATIONALITIES: string[] = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan",
  "Antiguan and Barbudan", "Argentine", "Armenian", "Australian",
  "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi",
  "Barbadian", "Belarusian", "Belgian", "Belizean", "Beninese", "Bhutanese",
  "Bolivian", "Bosnian and Herzegovinian", "Botswanan", "Brazilian",
  "British", "Bruneian", "Bulgarian", "Burkinabè", "Burundian",
  "Cabo Verdean", "Cambodian", "Cameroonian", "Canadian", "Central African",
  "Chadian", "Chilean", "Chinese", "Colombian", "Comorian",
  "Congolese (Democratic Republic of the Congo)",
  "Congolese (Republic of the Congo)", "Costa Rican", "Croatian", "Cuban",
  "Cypriot", "Czech", "Danish", "Djiboutian", "Dominican (Dominica)",
  "Dominican (Dominican Republic)", "Dutch", "Ecuadorian", "Egyptian",
  "Emirati", "Equatorial Guinean", "Eritrean", "Estonian", "Eswatini",
  "Ethiopian", "Fijian", "Filipino", "Finnish", "French", "Gabonese",
  "Gambian", "Georgian", "German", "Ghanaian", "Greek", "Grenadian",
  "Guatemalan", "Guinea-Bissauan", "Guinean", "Guyanese", "Haitian",
  "Honduran", "Hong Kong", "Hungarian", "Icelandic", "Indian", "Indonesian",
  "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican",
  "Japanese", "Jordanian", "Kazakh", "Kenyan", "Kiribati", "Kosovar",
  "Kuwaiti", "Kyrgyz", "Lao", "Latvian", "Lebanese", "Liberian", "Libyan",
  "Liechtensteiner", "Lithuanian", "Luxembourgish", "Macanese", "Malagasy",
  "Malawian", "Malaysian", "Maldivian", "Malian", "Maltese", "Marshallese",
  "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan",
  "Monégasque", "Mongolian", "Montenegrin", "Moroccan", "Mosotho",
  "Mozambican", "Myanmar", "Namibian", "Nauruan", "Nepali", "New Zealand",
  "Nicaraguan", "Nigerian", "Nigerien", "North Korean", "North Macedonian",
  "Norwegian", "Omani", "Pakistani", "Palauan", "Palestinian", "Panamanian",
  "Papua New Guinean", "Paraguayan", "Peruvian", "Polish", "Portuguese",
  "Puerto Rican", "Qatari", "Romanian", "Russian", "Rwandan",
  "Saint Lucian", "Salvadoran", "Sammarinese", "Samoan", "São Toméan",
  "Saudi", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean",
  "Singaporean", "Slovak", "Slovenian", "Solomon Islander", "Somali",
  "South African", "South Korean", "South Sudanese", "Spanish",
  "Sri Lankan", "Sudanese", "Surinamese", "Swedish", "Swiss", "Syrian",
  "Taiwanese", "Tajik", "Tanzanian", "Thai", "Timorese", "Togolese",
  "Tongan", "Trinidadian and Tobagonian", "Tunisian", "Turkish", "Turkmen",
  "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbek", "Vanuatuan",
  "Venezuelan", "Vietnamese", "Vincentian", "Yemeni", "Zambian",
  "Zimbabwean",
];

export const CITIES: string[] = [
  "Abidjan, Côte d'Ivoire", "Abu Dhabi, United Arab Emirates",
  "Abuja, Nigeria", "Accra, Ghana", "Addis Ababa, Ethiopia",
  "Ajman, United Arab Emirates", "Alexandria, Egypt", "Amman, Jordan",
  "Amsterdam, Netherlands", "Ankara, Türkiye", "Antalya, Türkiye",
  "Antwerp, Belgium", "Arusha, Tanzania", "Athens, Greece",
  "Atlanta, United States", "Auckland, New Zealand",
  "Austin, United States", "Bali (Denpasar), Indonesia",
  "Bangkok, Thailand", "Barcelona, Spain", "Basel, Switzerland",
  "Beijing, China", "Beirut, Lebanon", "Belo Horizonte, Brazil",
  "Bengaluru, India", "Berlin, Germany", "Birmingham, United Kingdom",
  "Bogotá, Colombia", "Bologna, Italy", "Bordeaux, France",
  "Boston, United States", "Braga, Portugal", "Brasília, Brazil",
  "Brisbane, Australia", "Bristol, United Kingdom", "Brussels, Belgium",
  "Bucharest, Romania", "Budapest, Hungary", "Buenos Aires, Argentina",
  "Busan, South Korea", "Cairo, Egypt", "Calgary, Canada",
  "Cape Town, South Africa", "Cartagena, Colombia", "Casablanca, Morocco",
  "Cascais, Portugal", "Cebu, Philippines", "Chennai, India",
  "Chiang Mai, Thailand", "Chicago, United States", "Coimbra, Portugal",
  "Cologne, Germany", "Colombo, Sri Lanka", "Copenhagen, Denmark",
  "Cork, Ireland", "Curitiba, Brazil", "Da Nang, Vietnam", "Dakar, Senegal",
  "Dammam, Saudi Arabia", "Dar es Salaam, Tanzania", "Delhi, India",
  "Dhaka, Bangladesh", "Doha, Qatar", "Douala, Cameroon",
  "Dubai, United Arab Emirates", "Dublin, Ireland", "Durban, South Africa",
  "Düsseldorf, Germany", "Edinburgh, United Kingdom",
  "Eindhoven, Netherlands", "Faro, Portugal", "Florence, Italy",
  "Florianópolis, Brazil", "Frankfurt, Germany", "Fukuoka, Japan",
  "Funchal, Portugal", "Gaborone, Botswana", "Geneva, Switzerland",
  "Glasgow, United Kingdom", "Gothenburg, Sweden", "Guadalajara, Mexico",
  "Guangzhou, China", "Hamburg, Germany", "Hanoi, Vietnam",
  "Harare, Zimbabwe", "Helsinki, Finland", "Ho Chi Minh City, Vietnam",
  "Hong Kong, Hong Kong", "Houston, United States", "Hyderabad, India",
  "Ibadan, Nigeria", "Islamabad, Pakistan", "Istanbul, Türkiye",
  "Izmir, Türkiye", "Jakarta, Indonesia", "Jeddah, Saudi Arabia",
  "Jerusalem, Israel", "Johannesburg, South Africa", "Kampala, Uganda",
  "Kano, Nigeria", "Karachi, Pakistan", "Kathmandu, Nepal",
  "Kigali, Rwanda", "Kochi, India", "Kolkata, India", "Kraków, Poland",
  "Kuala Lumpur, Malaysia", "Kumasi, Ghana", "Kuwait City, Kuwait",
  "Kyoto, Japan", "Lagos, Nigeria", "Lahore, Pakistan",
  "Lausanne, Switzerland", "Leeds, United Kingdom", "Lille, France",
  "Lima, Peru", "Limassol, Cyprus", "Lisbon, Portugal",
  "London, United Kingdom", "Los Angeles, United States", "Luanda, Angola",
  "Lusaka, Zambia", "Luxembourg City, Luxembourg", "Lyon, France",
  "Madrid, Spain", "Málaga, Spain", "Malmö, Sweden", "Manama, Bahrain",
  "Manchester, United Kingdom", "Manila, Philippines", "Maputo, Mozambique",
  "Marrakesh, Morocco", "Marseille, France", "Medellín, Colombia",
  "Melbourne, Australia", "Mexico City, Mexico", "Miami, United States",
  "Milan, Italy", "Mombasa, Kenya", "Monterrey, Mexico",
  "Montevideo, Uruguay", "Montreal, Canada", "Mumbai, India",
  "Munich, Germany", "Muscat, Oman", "Nairobi, Kenya", "Nantes, France",
  "Naples, Italy", "New York, United States", "Nice, France",
  "Nicosia, Cyprus", "Osaka, Japan", "Oslo, Norway", "Ottawa, Canada",
  "Palma, Spain", "Panama City, Panama", "Paris, France",
  "Penang, Malaysia", "Perth, Australia", "Phuket, Thailand",
  "Playa del Carmen, Mexico", "Port Harcourt, Nigeria",
  "Port Louis, Mauritius", "Porto Alegre, Brazil", "Porto, Portugal",
  "Prague, Czechia", "Pretoria, South Africa", "Pune, India",
  "Rabat, Morocco", "Ras Al Khaimah, United Arab Emirates",
  "Recife, Brazil", "Rio de Janeiro, Brazil", "Riyadh, Saudi Arabia",
  "Rome, Italy", "Rotterdam, Netherlands", "Salvador, Brazil",
  "San Francisco, United States", "San José, Costa Rica", "Santiago, Chile",
  "São Paulo, Brazil", "Seattle, United States", "Seoul, South Korea",
  "Seville, Spain", "Shanghai, China", "Sharjah, United Arab Emirates",
  "Shenzhen, China", "Singapore, Singapore", "Stockholm, Sweden",
  "Stuttgart, Germany", "Sydney, Australia", "Taipei, Taiwan",
  "Tallinn, Estonia", "Tangier, Morocco", "Tel Aviv, Israel",
  "The Hague, Netherlands", "Thessaloniki, Greece", "Tokyo, Japan",
  "Toronto, Canada", "Toulouse, France", "Tunis, Tunisia", "Turin, Italy",
  "Utrecht, Netherlands", "Valencia, Spain", "Valletta, Malta",
  "Vancouver, Canada", "Vienna, Austria", "Warsaw, Poland",
  "Washington, D.C., United States", "Wellington, New Zealand",
  "Windhoek, Namibia", "Yaoundé, Cameroon", "Zanzibar City, Tanzania",
  "Zurich, Switzerland",
];

export const LANGUAGES: string[] = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Azerbaijani",
  "Bengali", "Bosnian", "Bulgarian", "Burmese", "Cantonese", "Catalan",
  "Croatian", "Czech", "Danish", "Dutch", "English", "Estonian",
  "Farsi (Persian)", "Filipino (Tagalog)", "Finnish", "French", "Georgian",
  "German", "Greek", "Gujarati", "Hausa", "Hebrew", "Hindi", "Hungarian",
  "Icelandic", "Igbo", "Indonesian", "Italian", "Japanese", "Kannada",
  "Kazakh", "Khmer", "Kinyarwanda", "Korean", "Kurdish", "Lao", "Latvian",
  "Lingala", "Lithuanian", "Luxembourgish", "Macedonian", "Malay",
  "Malayalam", "Maltese", "Mandarin", "Marathi", "Mongolian", "Nepali",
  "Norwegian", "Oromo", "Pashto", "Polish", "Portuguese", "Punjabi",
  "Romanian", "Russian", "Serbian", "Sinhala", "Slovak", "Slovenian",
  "Somali", "Spanish", "Swahili", "Swedish", "Tamil", "Telugu", "Thai",
  "Tigrinya", "Turkish", "Twi", "Ukrainian", "Urdu", "Uzbek", "Vietnamese",
  "Wolof", "Xhosa", "Yoruba", "Zulu",
];

export const LISTS = {
  countries: COUNTRIES,
  nationalities: NATIONALITIES,
  cities: CITIES,
  languages: LANGUAGES,
} as const;

export type ListName = keyof typeof LISTS;

// Other names people type, so a search for "UAE" or "Holland" still
// finds the right entry.
export const ALIASES: Record<string, string> = {
  "United Arab Emirates": "UAE Emirates",
  "United Kingdom": "UK Great Britain England Scotland Wales",
  "United States": "USA US America",
  "Netherlands": "Holland",
  "Türkiye": "Turkey",
  "Czechia": "Czech Republic",
  "Côte d'Ivoire": "Ivory Coast",
  "Eswatini": "Swaziland",
  "Myanmar": "Burma",
  "Cabo Verde": "Cape Verde",
  "South Korea": "Korea",
  "Democratic Republic of the Congo": "DRC Congo Kinshasa",
  "Congo": "Congo Brazzaville",
  "Emirati": "UAE",
  "British": "UK English Scottish Welsh",
  "American": "USA US",
  "Dutch": "Netherlands Holland",
  "Mandarin": "Chinese",
  "Cantonese": "Chinese",
  "Farsi (Persian)": "Persian",
  "Filipino (Tagalog)": "Tagalog",
  "Bengaluru": "Bangalore",
  "Mumbai": "Bombay",
  "Ho Chi Minh City": "Saigon",
};

// What someone may type in place of the full name.
export const SHORT: Record<string, string> = {
  "UAE": "United Arab Emirates",
  "UK": "United Kingdom",
  "USA": "United States",
  "US": "United States",
};

// Accent-blind, case-blind comparison, so "Malaga" finds "Málaga".
export const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// A stored comma separated value back into the entries it names.
export function splitVals(value: string | string[] | null | undefined, list: ListName) {
  const items = Array.isArray(value)
    ? value
    : String(value ?? "").split(",").map((x) => x.trim());
  return items
    .filter(Boolean)
    .map((x) => SHORT[x] ?? x)
    .filter((x) => (LISTS[list] as readonly string[]).includes(x));
}
