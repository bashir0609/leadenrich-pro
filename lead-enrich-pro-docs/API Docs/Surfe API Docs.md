# 1. Search people

```typescript
fetch("https://api.surfe.com/v2/people/search", {
  headers: {
    "Authorization": "Bearer <token>"
  },
  body: JSON.stringify({
    "companies": {
      "countries": [
        "fr"
      ],
      "domains": [
        "surfe.com"
      ],
      "domainsExcluded": [
        "surfshop.fr"
      ],
      "employeeCount": {
        "from": 1,
        "to": 999999999999999
      },
      "industries": [
        "CRM",
        "Software",
        "SaaS",
        "Internet"
      ],
      "names": [
        "Surfe",
        "Leadjet"
      ],
      "revenue": {
        "from": 1,
        "to": 999999999999999
      }
    },
    "limit": 10,
    "pageToken": "",
    "people": {
      "countries": [
        "fr"
      ],
      "departments": [
        "Management"
      ],
      "jobTitles": [
        "CEO",
        "CTO"
      ],
      "seniorities": [
        "Founder",
        "C-Level"
      ]
    },
    "peoplePerCompany": 5
  })
});
```

- Response
```typescript
{
  "nextPageToken": "string",
  "people": [
    {
      "companyDomain": "surfe.com",
      "companyName": "Surfe",
      "country": "France",
      "departments": [
        "Management",
        "Founder/Owner"
      ],
      "firstName": "David",
      "jobTitle": "Co-Founder & CEO",
      "lastName": "Chevalier",
      "linkedInUrl": "https://www.linkedin.com/in/david-maurice-chevalier/",
      "seniorities": [
        "Founder",
        "C-Level"
      ]
    }
  ],
  "total": 0
}

```

# 2. API - Enrich People - Understanding Surfe's Asynchronous Split Request
# 2.1. Enrich People (start)

```typescript
fetch("https://api.surfe.com/v2/people/enrich", {
  headers: {
    "Authorization": "Bearer <token>"
  },
  body: JSON.stringify({
    "include": {
      "email": true,
      "jobHistory": false,
      "linkedInUrl": false,
      "mobile": true
    },
    "notificationOptions": {
      "webhookUrl": ""
    },
    "people": [
      {
        "companyDomain": "surfe.com",
        "companyName": "Surfe",
        "externalID": "external-id",
        "firstName": "David",
        "lastName": "Chevalier",
        "linkedinUrl": "https://www.linkedin.com/in/david-maurice-chevalier"
      }
    ]
  })
});
```

- Response
```typescript
{
  "enrichmentCallbackURL": "https://api.surfe.com/v2/people/enrich/0195be44-1a0d-718a-967b-042c9d17ffd7",
  "enrichmentID": "0195be44-1a0d-718a-967b-042c9d17ffd7",
  "message": "Your enrichment has started ✨, estimated time: 2 seconds."
}
```

# 2.2. Enrich People (get)

```typescript
fetch("https://api.surfe.com/v2/people/enrich/<your-enrichment-id>", {
  headers: {
    "Authorization": "Bearer <token>"
  }
});
```

- Response
```typescript
{
  "enrichmentID": "enrichment-id",
  "people": [
    {
      "companyDomain": "surfe.com",
      "companyName": "Surfe",
      "country": "France",
      "departments": [
        "Engineering",
        "R&D"
      ],
      "emails": [
        {
          "email": "david.chevalier@surfe.com",
          "validationStatus": "VALID"
        }
      ],
      "externalID": "external-id",
      "firstName": "David",
      "jobHistory": [
        {
          "companyName": "Surfe",
          "endDate": "2023-01-01T00:00:00Z",
          "jobTitle": "Co-Founder & CEO",
          "linkedInURL": "urn:li:company:123456",
          "startDate": "2023-01-01T00:00:00Z"
        }
      ],
      "jobTitle": "Co-Founder & CEO",
      "lastName": "Chevalier",
      "linkedInUrl": "https://www.linkedin.com/in/david-maurice-chevalier",
      "location": "Paris, Île-de-France",
      "mobilePhones": [
        {
          "confidenceScore": 0.8,
          "mobilePhone": "+33 6 12 34 56 78"
        }
      ],
      "seniorities": [
        "Manager",
        "Head"
      ],
      "status": "COMPLETED"
    }
  ],
  "percentCompleted": 50,
  "status": "IN_PROGRESS"
}

```

- Typescript

```typescript
export interface Response {
  /**
   * EnrichmentID - ID of the enrichment action
   */
  enrichmentID?: string;
  /**
   * People - List of enriched people
   */
  people?: EnrichedPersonResponse[];
  /**
   * PercentCompleted - Percentage of completion of the enrichment action
   * 0 means not started, 100 means completed
   */
  percentCompleted?: number;
  /**
   * Status - Status of the enrichment action
   * Possible values are:
   * * IN_PROGRESS - Enrichment is in progress
   * * COMPLETED - Enrichment is completed
   */
  status?: ("IN_PROGRESS" | "COMPLETED" | "CANCELLED") & ("IN_PROGRESS" | "COMPLETED");
}
export interface EnrichedPersonResponse {
  companyDomain?: string;
  companyName?: string;
  country?: string;
  departments?: string[];
  emails?: EnrichedPersonEmail[];
  /**
   * ExternalID - ID that will be returned as-is with the enrichment results
   */
  externalID?: string;
  firstName?: string;
  /**
   * JobHistory - Job position's history
   */
  jobHistory?: JobPosition[];
  jobTitle?: string;
  lastName?: string;
  linkedInUrl?: string;
  location?: string;
  mobilePhones?: EnrichedPersonMobilePhone[];
  seniorities?: string[];
  status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}
export interface EnrichedPersonEmail {
  email?: string;
  /**
   * ValidationStatus - Validation status of the email. Emails are always validated
   * before being returned. This field indicates if the email is a catch-all email or not.
   * Possible values are:
   * * VALID - Email is valid and belong to a specific person. The delivery is certain and the engagement quality is high.
   * * CATCH_ALL - Emails is valid but belong to a general mailbox. The delivery is less certain and the engagement quality is lower.
   */
  validationStatus?: "VALID" | " CATCH_ALL";
}
export interface JobPosition {
  /**
   * CompanyName - Name of the company that the person works at
   */
  companyName?: string;
  /**
   * EndDate - End date of the job position. Will be null on current positions.
   */
  endDate?: string;
  /**
   * JobTitle - Job title of the person
   */
  jobTitle?: string;
  /**
   * LinkedInURL - LinkedIn URL of the company that the person works at
   */
  linkedInURL?: string;
  /**
   * StartDate - Start date of the job position
   */
  startDate?: string;
}
export interface EnrichedPersonMobilePhone {
  /**
   * ConfidenceScore - Confidence score of the mobile phone.
   * The score is between 0 and 1. A score of 1 means that the mobile phone is very likely to belong to the person.
   */
  confidenceScore?: number;
  /**
   * MobilePhone - Mobile phone number of the person.
   * The phone number is in international format. For example, +33 6 12 34 56 78
   */
  mobilePhone?: string;
}
```
# 3. Search Companies

```typescript
fetch("https://api.surfe.com/v2/companies/search", {
  headers: {
    "Authorization": "Bearer <token>"
  },
  body: JSON.stringify({
    "filters": {
      "countries": [
        "fr"
      ],
      "domains": [
        "surfe.com"
      ],
      "domainsExcluded": [
        "surfshop.fr"
      ],
      "employeeCount": {
        "from": 1,
        "to": 999999999999999
      },
      "industries": [
        "CRM",
        "Software",
        "SaaS",
        "Internet"
      ],
      "revenue": {
        "from": 1,
        "to": 999999999999999
      }
    },
    "limit": 10,
    "pageToken": ""
  })
});
```

- Response
```typescript
{
  "companies": [
    {
      "countries": [
        "fr"
      ],
      "domain": "surfe.com",
      "employeeCount": 100,
      "industries": [
        "Software",
        "Technology"
      ],
      "name": "Surfe",
      "revenue": "10-50M"
    }
  ],
  "companyDomains": [
    "surfe.com"
  ],
  "nextPageToken": ""
}

```

# 4. API - Enrich Companies - Understanding Surfe's Asynchronous Split Request
# 4.1 Enrich Companies (start)

```typescript
fetch("https://api.surfe.com/v2/companies/enrich", {
  headers: {
    "Authorization": "Bearer <token>"
  },
  body: JSON.stringify({
    "companies": [
      {
        "domain": "surfe.com",
        "externalID": "external-id"
      }
    ]
  })
});
```

- Response
```typescript
{
  "enrichmentCallbackURL": "https://api.surfe.com/v2/companies/enrich/0195be44-1a0d-718a-967b-042c9d17ffd7",
  "enrichmentID": "0195be44-1a0d-718a-967b-042c9d17ffd7",
  "message": "Your enrichment has started ✨, estimated time: 2 seconds."
}
```

# 4.2. Enrich Companies (get)

```typescript
fetch("https://api.surfe.com/v2/companies/enrich/<string>", {
  headers: {
    "Authorization": "Bearer <token>"
  }
});
```

- Response
```typescript
{
  "description": "string",
  "digitalPresence": [
    {
      "name": "string",
      "url": "string"
    }
  ],
  "employeeCount": 0,
  "externalID": "external-id",
  "followersCountLinkedi": 0,
  "founded": "string",
  "fundingRounds": [
    {
      "amount": 0,
      "amountCurrency": "string",
      "announcedDate": "string",
      "leadInvestors": [
        "string"
      ],
      "name": "string"
    }
  ],
  "hqAddress": "string",
  "hqCountry": "fr",
  "industry": "string",
  "ipo": {
    "date": "string",
    "sharePrice": 0,
    "sharePriceCurrency": "string"
  },
  "isPublic": true,
  "keywords": [
    "string"
  ],
  "linkedInURL": "string",
  "name": "string",
  "parentOrganization": {
    "name": "string",
    "website": "string"
  },
  "phones": [
    "string"
  ],
  "revenue": "string",
  "status": "COMPLETED",
  "stocks": [
    {
      "exchange": "string",
      "ticker": "string"
    }
  ],
  "subIndustry": "string",
  "websites": [
    "string"
  ]
}
```

- Typescript
```typescript
export interface Response {
  /**
   * OrganizationID - ID of the enrichment action
   */
  companies?: EnrichedCompanyResponse[];
  /**
   * PercentCompleted - Percentage of completion of the enrichment action
   * 0 means not started, 100 means completed
   */
  percentCompleted?: number;
  /**
   * Status - Status of the enrichment action
   * Possible values are:
   * - IN_PROGRESS
   * - COMPLETED
   */
  status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}
export interface EnrichedCompanyResponse {
  description?: string;
  digitalPresence?: EnrichedCompanyDigitalPresence[];
  employeeCount?: number;
  externalID?: string;
  followersCountLinkedin?: number;
  founded?: string;
  fundingRounds?: EnrichedCompanyFundingRound[];
  hqAddress?: string;
  hqCountry?: string;
  industry?: string;
  ipo?: EnrichedCompanyIPO;
  isPublic?: boolean;
  keywords?: string[];
  linkedInURL?: string;
  name?: string;
  parentOrganization?: EnrichedCompanyParentOrganization;
  phones?: string[];
  revenue?: string;
  status?: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  stocks?: EnrichedCompanyStock[];
  subIndustry?: string;
  websites?: string[];
}
export interface EnrichedCompanyDigitalPresence {
  name?: string;
  url?: string;
}
export interface EnrichedCompanyFundingRound {
  amount?: number;
  amountCurrency?: string;
  announcedDate?: string;
  leadInvestors?: string[];
  name?: string;
}
export interface EnrichedCompanyIPO {
  date?: string;
  sharePrice?: number;
  sharePriceCurrency?: string;
}
export interface EnrichedCompanyParentOrganization {
  name?: string;
  website?: string;
}
export interface EnrichedCompanyStock {
  exchange?: string;
  ticker?: string;
}
```

# 5. Search Company lookalikes

```typescript
fetch("https://api.surfe.com/v1/organizations/lookalikes", {
  headers: {
    "Authorization": "Bearer <token>"
  },
  body: JSON.stringify({
    "domains": [
      "surfe.com",
      "apple.com",
      "microsoft.com"
    ],
    "filters": {
      "employeeCounts": [
        "51-200",
        "201-500"
      ],
      "industries": [
        "Aerospace",
        "Software"
      ],
      "keywords": [
        "Recruitment",
        "Education"
      ],
      "locations": [
        "fr",
        "es"
      ],
      "primaryLocations": [
        "fr",
        "es"
      ],
      "revenues": [
        "0-1M",
        "1-10M"
      ],
      "technologies": [
        "Mixpanel",
        "Salesforce"
      ]
    },
    "maxResults": 5,
    "names": [
      "Surfe",
      "Apple",
      "Microsoft"
    ]
  })
});
```

- Response
```typescript
{
  "organizations": [
    {
      "addresses": [
        {
          "isPrimary": true,
          "raw": "526 Coyote Road, CA, USA"
        }
      ],
      "annualRevenueRange": "10-50M",
      "description": "The Acme Corporation is a fictional corporation that features prominently in the Road Runner/Wile E. Coyote animated shorts as a running gag. The company manufactures outlandish products that fail or backfire catastrophically at the worst possible times.",
      "digitalPresence": [
        {
          "name": "X (Previously Twitter)",
          "url": "https://x.com/acmeorg"
        }
      ],
      "externalID": "external-id",
      "followersCountLinkedin": 1000000,
      "founded": "1920",
      "fundingRounds": [
        {
          "amount": 2,
          "amountCurrency": "USD",
          "announcedDate": "1920-01-01",
          "leadInvestors": [
            "Coyote",
            "Road Runner"
          ],
          "name": "Seed round"
        }
      ],
      "industries": [
        {
          "SubIndustry": "Commodity Chemicals",
          "group": "Materials",
          "industry": "Chemicals",
          "sector": "Materials"
        }
      ],
      "ipo": {
        "date": "1920-01-01",
        "sharePrice": 1,
        "sharePriceCurrency": "USD"
      },
      "isPublic": true,
      "keywords": [
        "American",
        "Corporations",
        "Manufacture",
        "Everything"
      ],
      "linkedinUrl": "https://www.linkedin.com/company/acmeorg/",
      "logoUrl": "www.acme.org/logo.jpeg",
      "name": "Acme Corporation",
      "parentOrganization": {
        "name": "Cyberdyne Systems",
        "website": "skynet.org"
      },
      "phones": [
        "555-555-555",
        "555-555-5554"
      ],
      "size": 100,
      "stocks": [
        {
          "exchange": "NASDAQ",
          "ticker": "ACME"
        }
      ],
      "website": "www.acme.org"
    }
  ]
}
```