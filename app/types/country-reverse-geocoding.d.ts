declare module 'country-reverse-geocoding' {
  interface Country {
    code: string;
    name: string;
  }

  class CountryReverseGeocoding {
    constructor();
    get_country(lat: number, lng: number): Country | null;
  }

  const crg: {
    country_reverse_geocoding(): CountryReverseGeocoding;
  };

  export = crg;
} 