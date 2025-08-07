import axios, { AxiosInstance } from 'axios';

interface HunterConfig {
  apiKey?: string;
  baseUrl: string;
}

interface HunterResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface PersonParams {
  domain: string;
  firstName: string;
  lastName: string;
}

interface CompanyParams {
  domain: string;
}

export class HunterProvider {
  private config: HunterConfig;
  private client: AxiosInstance;

  constructor() {
    this.config = {
      baseUrl: 'https://api.hunter.io'
    };
    
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 30000
    });
  }

  setApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async authenticate(): Promise<void> {
    // Simple auth check
    if (!this.config.apiKey) {
      throw new Error('Hunter API key not configured');
    }
  }

  validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error('Hunter API key is required');
    }
  }

  async findEmail(params: PersonParams): Promise<HunterResponse> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Hunter API key not configured');
      }

      // Add a 1-second delay before making the request to prevent overwhelming the API
      console.log('Adding 1-second delay before Hunter findEmail request');
      await this.sleep(1000);

      const response = await this.client.get('/v2/email-finder', {
        params: {
          domain: params.domain,
          first_name: params.firstName,
          last_name: params.lastName,
          api_key: this.config.apiKey
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async searchDomain(params: CompanyParams): Promise<HunterResponse> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Hunter API key not configured');
      }

      // Add a 1-second delay before making the request to prevent overwhelming the API
      console.log('Adding 1-second delay before Hunter searchDomain request');
      await this.sleep(1000);

      const response = await this.client.get('/v2/domain-search', {
        params: {
          domain: params.domain,
          api_key: this.config.apiKey
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async verifyEmail(email: string): Promise<HunterResponse> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Hunter API key not configured');
      }

      // Add a 1-second delay before making the request to prevent overwhelming the API
      console.log('Adding 1-second delay before Hunter verifyEmail request');
      await this.sleep(1000);

      const response = await this.client.get('/v2/email-verifier', {
        params: {
          email: email,
          api_key: this.config.apiKey
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // Bulk methods for compatibility
  async bulkEnrichPeople(people: PersonParams[]): Promise<HunterResponse[]> {
    const results: HunterResponse[] = [];
    
    for (const person of people) {
      // Increase delay to 1 second for consistency with other operations
      console.log('Adding 1-second delay before Hunter bulkEnrichPeople request');
      await this.sleep(1000); // Rate limiting
      const result = await this.findEmail(person);
      results.push(result);
    }
    
    return results;
  }

  async bulkEnrichCompanies(companies: CompanyParams[]): Promise<HunterResponse[]> {
    const results: HunterResponse[] = [];
    
    for (const company of companies) {
      // Increase delay to 1 second for consistency with other operations
      console.log('Adding 1-second delay before Hunter bulkEnrichCompanies request');
      await this.sleep(1000); // Rate limiting
      const result = await this.searchDomain(company);
      results.push(result);
    }
    
    return results;
  }
}
