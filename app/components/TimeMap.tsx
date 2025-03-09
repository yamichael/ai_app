'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import tzlookup from 'tz-lookup';
import { fixLeafletIcons } from '../utils/leaflet-icons';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

// ISO 3166-1 alpha-3 to alpha-2 code mapping for common countries
const countryCodeMapping: { [key: string]: string } = {
  'USA': 'US',
  'GBR': 'GB',
  'CAN': 'CA',
  'AUS': 'AU',
  'DEU': 'DE',
  'FRA': 'FR',
  'ITA': 'IT',
  'ESP': 'ES',
  'CHN': 'CN',
  'JPN': 'JP',
  'KOR': 'KR',
  'IND': 'IN',
  'BRA': 'BR',
  'RUS': 'RU',
  'ZAF': 'ZA',
  'MEX': 'MX',
  'ISR': 'IL',
  'EGY': 'EG',
  'SAU': 'SA',
  'ARE': 'AE',
  // Add more mappings as needed
};

// English country names mapping
const countryNamesMapping: { [key: string]: string } = {
  'United States of America': 'United States',
  'Russian Federation': 'Russia',
  'Korea, Republic of': 'South Korea',
  'Iran, Islamic Republic of': 'Iran',
  'Syrian Arab Republic': 'Syria',
  'Venezuela, Bolivarian Republic of': 'Venezuela',
  'Viet Nam': 'Vietnam',
  'Lao People\'s Democratic Republic': 'Laos',
  'Congo, Democratic Republic of the': 'DR Congo',
  'Tanzania, United Republic of': 'Tanzania',
  'Myanmar': 'Myanmar (Burma)',
  'Brunei Darussalam': 'Brunei',
  'Czech Republic': 'Czechia',
  // Add more mappings as needed
};

interface TimeMapProps {
  className?: string;
}

interface LocationInfo {
  time: string;
  country?: string;
  population?: number;
  coordinates: string;
  error?: string;
}

function MapEvents() {
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [geocoder, setGeocoder] = useState<any>(null);
  const [countryData, setCountryData] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize dependencies on the client side only
    const initDependencies = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Import and initialize country-reverse-geocoding
        const crg = (await import('country-reverse-geocoding')).default;
        const geocoderInstance = crg.country_reverse_geocoding();

        // Import country-data
        const countryDataModule = await import('country-data');
        console.log('Available countries:', countryDataModule.countries.all.map((c: any) => ({ 
          name: c.name, 
          alpha2: c.alpha2,
          alpha3: countryCodeMapping[c.alpha2],
          population: c.population 
        })));
        
        setGeocoder(geocoderInstance);
        setCountryData(countryDataModule.countries);
        setIsInitialized(true);

        // Test the geocoder
        console.log('Testing geocoder:', geocoderInstance);
        const testCountry = geocoderInstance.get_country(40.7128, -74.0060); // Test with New York coordinates
        console.log('Test geocoding result:', testCountry);
      } catch (error) {
        console.error('Failed to initialize dependencies:', error);
        setIsInitialized(true); // Set to true even on error to prevent infinite loading
      }
    };

    initDependencies();
  }, []);

  const formatPopulation = (population: number): string => {
    if (population >= 1000000000) {
      return `${(population / 1000000000).toFixed(2)} billion`;
    } else if (population >= 1000000) {
      return `${(population / 1000000).toFixed(2)} million`;
    } else if (population >= 1000) {
      return `${(population / 1000).toFixed(2)} thousand`;
    }
    return population.toString();
  };

  const getEnglishCountryName = async (countryCode: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.worldbank.org/v2/country/${countryCode}?format=json`
      );
      const data = await response.json();
      
      if (data && data[1] && data[1][0]) {
        const officialName = data[1][0].name;
        // Use our mapping if available, otherwise use the World Bank name
        return countryNamesMapping[officialName] || officialName;
      }
    } catch (error) {
      console.error('Error fetching country name:', error);
    }
    return countryCode; // Return the country code as fallback
  };
  
  const map = useMapEvents({
    click: async (e) => {
      if (!isInitialized) {
        setLocationInfo({
          time: 'Loading...',
          coordinates: `(${e.latlng.lat.toFixed(2)}, ${e.latlng.lng.toFixed(2)})`,
          error: 'Application is still initializing...'
        });
        return;
      }

      const { lat, lng } = e.latlng;
      const info: LocationInfo = {
        coordinates: `(${lat.toFixed(2)}, ${lng.toFixed(2)})`,
        time: 'Loading...'
      };

      try {
        // Get timezone and format time
        const timezone = tzlookup(lat, lng);
        info.time = new Date().toLocaleTimeString('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        // Get country and population data
        if (geocoder && countryData) {
          try {
            const country = geocoder.get_country(lat, lng);
            console.log('Geocoding result:', country);
            
            if (country) {
              const alpha2Code = countryCodeMapping[country.code] || country.code;
              console.log('Looking up country data for:', country.code, '(alpha-2:', alpha2Code, ')', country.name);
              
              const countryInfo = countryData.all.find((c: any) => {
                const matchesCode = c.alpha2 === alpha2Code;
                const matchesName = c.name.toLowerCase() === country.name.toLowerCase();
                console.log(`Checking ${c.name} (${c.alpha2}):`, { 
                  matchesCode, 
                  matchesName,
                  emoji: c.emoji
                });
                return matchesCode || matchesName;
              });
              
              console.log('Found country data:', countryInfo);
              
              if (countryInfo) {
                // Get English country name from World Bank API
                const englishName = await getEnglishCountryName(countryInfo.alpha2);
                info.country = `${countryInfo.emoji} ${englishName || country.name}`;
                
                // Fetch population data from World Bank API
                try {
                  const response = await fetch(
                    `https://api.worldbank.org/v2/country/${countryInfo.alpha2}/indicator/SP.POP.TOTL?format=json&date=2022`
                  );
                  const data = await response.json();
                  
                  if (data && data[1] && data[1][0] && data[1][0].value) {
                    info.population = data[1][0].value;
                  } else {
                    console.log('No population data found in World Bank API');
                  }
                } catch (popError) {
                  console.error('Error fetching population data:', popError);
                }
              } else {
                info.country = country.name;
                console.log('No country data found for:', country.name);
              }
            } else {
              info.error = 'No country data found for this location';
            }
          } catch (geoError) {
            console.error('Geocoding error:', geoError);
            info.error = 'Could not determine country for this location';
          }
        } else {
          info.error = 'Country data service is not available';
        }
      } catch (error) {
        console.error('Error getting location info:', error);
        info.time = 'Could not determine time for this location';
        info.error = error instanceof Error ? error.message : 'Unknown error occurred';
      }

      setLocationInfo(info);
    }
  });

  return locationInfo ? (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-lg shadow-lg z-[1000] min-w-[300px]">
      <div className="text-center space-y-2">
        <p className="text-gray-600 text-sm">Location: {locationInfo.coordinates}</p>
        <p className="text-lg font-semibold">{locationInfo.time}</p>
        {locationInfo.country && (
          <p className="text-gray-700">
            {locationInfo.country}
            {locationInfo.population && (
              <span className="block text-sm text-gray-500">
                Population: {formatPopulation(locationInfo.population)}
              </span>
            )}
          </p>
        )}
        {locationInfo.error && (
          <p className="text-red-500 text-sm">{locationInfo.error}</p>
        )}
      </div>
    </div>
  ) : null;
}

export default function TimeMap({ className = '' }: TimeMapProps) {
  useEffect(() => {
    const init = async () => {
      if (typeof window === 'undefined') return;
      await fixLeafletIcons();
    };
    init();
  }, []);

  return (
    <div className={`relative h-[80vh] w-full ${className}`}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
        />
        <MapEvents />
      </MapContainer>
    </div>
  );
} 