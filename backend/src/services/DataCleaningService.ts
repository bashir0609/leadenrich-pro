export class DataCleaningService {
  static cleanEmail(email: string | null | undefined): string | null {
    if (!email) return null;
    
    const cleaned = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return emailRegex.test(cleaned) ? cleaned : null;
  }

  static cleanDomain(input: string | null | undefined): string | null {
    if (!input) return null;
    
    let domain: string | undefined = input.trim().toLowerCase();
    
    // The following checks satisfy the strict 'noUncheckedIndexedAccess' rule
    domain = domain.split('/')[0];
    if (domain === undefined) return null;

    domain = domain.split('?')[0];
    if (domain === undefined) return null;
    
    domain = domain.split('#')[0];
    if (domain === undefined) return null;

    domain = domain.split(':')[0];
    if (domain === undefined) return null;
    
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])+$/;
    
    return domainRegex.test(domain) ? domain : null;
  }

  static cleanPhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length < 10 || cleaned.length > 15) {
      return null;
    }
    
    return cleaned;
  }

  static cleanName(name: string | null | undefined): string | null {
    if (!name) return null;
    
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  static cleanCompanyName(company: string | null | undefined): string | null {
    if (!company) return null;
    
    const suffixes = [
      ', Inc.', ' Inc.', ', LLC', ' LLC', ', Ltd.', ' Ltd.',
      ', Corp.', ' Corp.', ', Corporation', ' Corporation',
    ];
    
    let cleaned = company.trim();
    for (const suffix of suffixes) {
      if (cleaned.endsWith(suffix)) {
        cleaned = cleaned.slice(0, -suffix.length);
      }
    }
    
    return cleaned;
  }

  static extractDomainFromEmail(email: string | null | undefined): string | null {
    const cleaned = this.cleanEmail(email);
    if (!cleaned) return null;
    
    const parts = cleaned.split('@');

    // This check satisfies the strict 'noUncheckedIndexedAccess' rule
    if (parts.length === 2 && parts[1] !== undefined) {
      return parts[1];
    }
    
    return null;
  }
}