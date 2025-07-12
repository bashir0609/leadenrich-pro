import { env } from '../../../config/environment';
import {
  PeopleSearchParams,
  StandardizedPerson,
} from '../../../types/providers';
import { BaseProvider } from '../base/BaseProvider';

export class SurfeProvider extends BaseProvider {
  public name = 'surfe';

  constructor() {
    // We'll get the API key from the database later. For now, use the .env value.
    super(env.SURFE_API_KEY, 'https://api.surfe.com/v2');
  }

  async searchPeople(
    params: PeopleSearchParams
  ): Promise<StandardizedPerson[]> {
    console.log(`Searching people on Surfe with params:`, params);
    // In the next phase, we'll make a real API call here.
    // For now, return mock data.
    return Promise.resolve([
      {
        id: 'surfe-123',
        fullName: 'John Doe (from Surfe)',
        email: 'john.doe@example.com',
        title: 'Software Engineer',
      },
    ]);
  }
}