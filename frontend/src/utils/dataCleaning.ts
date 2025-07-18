// Replace the entire content of this file with the corrected version
export class DataCleaningService {
  static cleanDomain(input: string | null | undefined): string | null {
    if (!input) return null;
    
    let domain = input.trim().toLowerCase();
    
    // Remove protocol
    domain = domain.replace(/^https?:\/\//, '');
    // Remove www
    domain = domain.replace(/^www\./, '');
    // Remove path, query params, and fragments
    domain = domain.split('/')[0].split('?')[0].split('#')[0];
    // Remove port
    domain = domain.split(':')[0];
    
    // Use the more robust regex for validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])+$/;
    
    return domainRegex.test(domain) ? domain : null;
  }

  // This method now gives more specific feedback
  static validateDomainFeedback(input: string): { 
    isValid: boolean; 
    cleaned: string | null;
    message?: string;
  } {
    if (!input || !input.trim()) {
      return { isValid: false, cleaned: null, message: 'Row was empty' };
    }
    
    const originalDomain = input.trim();
    let cleanedDomain = originalDomain.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0].split('?')[0].split('#')[0]
      .split(':')[0];

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])+$/;

    if (domainRegex.test(cleanedDomain)) {
      return { isValid: true, cleaned: cleanedDomain };
    }

    // Provide specific feedback if validation fails
    if (originalDomain.includes(' ')) {
      return { isValid: false, cleaned: null, message: 'Domain contained spaces' };
    }
    return { isValid: false, cleaned: null, message: 'Invalid domain format' };
  }
}