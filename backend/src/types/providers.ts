export interface PeopleSearchParams {
  companyDomains?: string[];
  jobTitles?: string[];
}

export interface StandardizedPerson {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
}

// This will be our universal interface for all providers
export interface EnrichmentProvider {
  name: string;
  searchPeople(params: PeopleSearchParams): Promise<StandardizedPerson[]>;
  // We will add more methods here later (enrich, company search, etc.)
}