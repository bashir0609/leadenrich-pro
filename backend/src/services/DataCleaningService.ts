export class DataCleaningService {
  static cleanEmail(email: string): string | null {
    if (!email) return null;
    
    const cleaned = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return emailRegex.test(cleaned) ? cleaned : null;
  }

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

  static cleanPhone(phone: string): string | null {
    if (!phone) return null;
    
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check if it's a valid length
    if (cleaned.length < 10 || cleaned.length > 15) {
      return null;
    }
    
    return cleaned;
  }

  static cleanName(name: string): string | null {
    if (!name) return null;
    
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  static cleanCompanyName(company: string): string | null {
    if (!company) return null;
    
    // Remove common suffixes
    const suffixes = [
      ', Inc.',
      ' Inc.',
      ', LLC',
      ' LLC',
      ', Ltd.',
      ' Ltd.',
      ', Corp.',
      ' Corp.',
      ', Corporation',
      ' Corporation',
    ];
    
    let cleaned = company.trim();
    for (const suffix of suffixes) {
      if (cleaned.endsWith(suffix)) {
        cleaned = cleaned.slice(0, -suffix.length);
      }
    }
    
    return cleaned;
  }

  static extractDomainFromEmail(email: string): string | null {
    const cleaned = this.cleanEmail(email);
    if (!cleaned) return null;
    
    const parts = cleaned.split('@');
    return parts.length === 2 ? parts[1] : null;
  }
}