import axios, { AxiosInstance } from 'axios';
import { EnrichmentProvider } from '../../../types/providers';

export abstract class BaseProvider implements EnrichmentProvider {
  public abstract name: string;
  protected readonly http: AxiosInstance;

  constructor(apiKey: string, baseUrl: string) {
    this.http = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // All providers must implement this method
  abstract searchPeople(
    params: import('../../../types/providers').PeopleSearchParams
  ): Promise<import('../../../types/providers').StandardizedPerson[]>;
}