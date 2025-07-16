// src/utils/dataCleaning.ts
export class DataCleaningService {
  static cleanDomain(input: string): string | null {
    if (!input) return null;
    
    let domain = input.trim().toLowerCase();
    
    // Remove protocol
    domain = domain.replace(/^https?:\/\//, '');
    // Remove www
    domain = domain.replace(/^www\./, '');
    // Remove path
    domain = domain.split('/')[0];
    // Remove port
    domain = domain.split(':')[0];
    
    // Basic domain validation
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
    
    return domainRegex.test(domain) ? domain : null;
  }
}