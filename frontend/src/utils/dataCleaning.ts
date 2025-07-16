// src/utils/dataCleaning.ts
export class DataCleaningService {
  static cleanDomain(input: string): string | null {
    if (!input) return null;
   
    // Remove whitespace and convert to lowercase
    let domain = input.trim().toLowerCase();
   
    // Remove common prefixes
    domain = domain
      .replace(/^https?:\/\//, '')  // Remove http:// or https://
      .replace(/^www\./, '')        // Remove www.
      .split('/')[0]                // Remove any path after domain
      .split(':')[0];               // Remove port if present
   
    // Simple domain validation 
    const domainRegex = /^[a-z0-9]+([.-][a-z0-9]+)*\.[a-z]{2,}$/;
   
    return domainRegex.test(domain) ? domain : null;
  }

  // New method to help users understand why a domain is invalid
  static validateDomainFeedback(input: string): { 
    isValid: boolean; 
    message?: string 
  } {
    if (!input) return { isValid: false, message: 'Domain cannot be empty' };
    
    const domain = input.trim().toLowerCase();
    
    if (domain.includes(' ')) 
      return { isValid: false, message: 'Domain should not contain spaces' };
    
    if (domain.includes('http://') || domain.includes('https://'))
      return { isValid: false, message: 'Remove http:// or https://' };
    
    if (domain.includes('www.'))
      return { isValid: false, message: 'Remove www.' };
    
    const cleanedDomain = this.cleanDomain(domain);
    
    return cleanedDomain 
      ? { isValid: true } 
      : { 
          isValid: false, 
          message: 'Invalid domain format. Use format like example.com' 
        };
  }
}