declare module 'country-data' {
  interface Country {
    name: string;
    alpha2: string;
    alpha3: string;
    status: string;
    currencies: string[];
    languages: string[];
    capital: string;
    population: number;
    area: number;
  }

  export const countries: {
    all: Country[];
  };
} 