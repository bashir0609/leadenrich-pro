# Phase 3: Frontend Foundation & Provider UI

## 📋 Prerequisites
- ✅ Phase 2 completed successfully
- ✅ Backend API running on port 3001
- ✅ Providers endpoint returning data
- ✅ Queue system operational

## 🎯 Phase 3 Goals
1. Set up Next.js 14 with TypeScript
2. Configure Tailwind CSS and Shadcn/ui
3. Create API client with proper types
4. Build provider marketplace UI
5. Implement real-time progress tracking
6. Create job monitoring dashboard

---

## 🚀 Step 3.1: Create Next.js Frontend

Open a new terminal and navigate to project root:
```bash
cd leadenrich-pro

# Create Next.js app with TypeScript
npx create-next-app@14 frontend --typescript --tailwind --app --src-dir --import-alias "@/*"

# Navigate to frontend
cd frontend

# Install additional dependencies
npm install --save-exact \
  @tanstack/react-query@5.12.2 \
  zustand@4.4.7 \
  axios@1.4.0 \
  socket.io-client@4.7.2 \
  react-dropzone@14.2.3 \
  recharts@2.9.3 \
  lucide-react@0.294.0 \
  clsx@2.0.0 \
  tailwind-merge@2.1.0 \
  date-fns@2.30.0 \
  react-hot-toast@2.4.1
```

## 🎨 Step 3.2: Install and Configure Shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# When prompted:
# - Would you like to use TypeScript? → Yes
# - Which style would you like to use? → Default
# - Which color would you like to use? → Slate
# - Where is your global CSS file? → src/app/globals.css
# - Would you like to use CSS variables? → Yes
# - Where is your tailwind.config.js? → tailwind.config.js
# - Configure import alias? → src/* → @/*

# Install initial components
npx shadcn-ui@latest add button card dialog form input label select table tabs toast
```

## 📁 Step 3.3: Frontend Project Structure

Create the following structure:
```bash
cd frontend/src

# Create directories
mkdir -p components/{providers,jobs,common,ui}
mkdir -p lib/{api,stores,hooks,utils}
mkdir -p types
mkdir -p app/{providers,jobs,enrichment}
```

## 🔧 Step 3.4: Environment Configuration

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=LeadEnrich Pro
```

## 📝 Step 3.5: TypeScript Types

Create `frontend/src/types/index.ts`:
```typescript
// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Provider types
export interface Provider {
  id: number;
  name: string;
  displayName: string;
  category: string;
  features: ProviderFeature[];
}

export interface ProviderFeature {
  featureId: string;
  featureName: string;
  category: string;
  creditsPerRequest: number;
}

// Job types
export interface Job {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
  };
  createdAt: string;
  completedAt?: string;
  logs: JobLog[];
}

export interface JobLog {
  id: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

// Enrichment types
export interface EnrichmentRequest {
  operation: string;
  params: Record<string, any>;
  options?: {
    timeout?: number;
    retries?: number;
  };
}

export interface BulkEnrichmentRequest {
  operation: string;
  records: Record<string, any>[];
  options?: {
    webhookUrl?: string;
    columnMapping?: Record<string, string>;
  };
}
```

## 🌐 Step 3.6: API Client Setup

Create `frontend/src/lib/api/client.ts`:
```typescript
import axios, { AxiosInstance } from 'axios';
import toast from 'react-hot-toast';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const message = error.response.data?.error?.message || 'An error occurred';
          toast.error(message);
        } else if (error.request) {
          toast.error('Network error. Please check your connection.');
        } else {
          toast.error('An unexpected error occurred.');
        }
        return Promise.reject(error);
      }
    );
  }

  // Provider methods
  async getProviders() {
    const response = await this.client.get('/api/providers');
    return response.data;
  }

  async testProvider(providerId: string) {
    const response = await this.client.post(`/api/providers/${providerId}/test`);
    return response.data;
  }

  async executeProvider(providerId: string, data: any) {
    const response = await this.client.post(`/api/providers/${providerId}/execute`, data);
    return response.data;
  }

  async createBulkJob(providerId: string, data: any) {
    const response = await this.client.post(`/api/providers/${providerId}/bulk`, data);
    return response.data;
  }

  // Job methods
  async getJobStatus(jobId: string) {
    const response = await this.client.get(`/api/jobs/${jobId}`);
    return response.data;
  }

  async getJobLogs(jobId: string) {
    const response = await this.client.get(`/api/jobs/${jobId}/logs`);
    return response.data;
  }

  // Health check
  async checkHealth() {
    const response = await this.client.get('/health/detailed');
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

Create `frontend/src/lib/api/providers.ts`:
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from './client';
import { Provider } from '@/types';

export const useProviders = () => {
  return useQuery({
    queryKey: ['providers'],
    queryFn: async () => {
      const response = await apiClient.getProviders();
      return response.data as Provider[];
    },
  });
};

export const useTestProvider = () => {
  return useMutation({
    mutationFn: async (providerId: string) => {
      const response = await apiClient.testProvider(providerId);
      return response.data;
    },
  });
};

export const useExecuteProvider = () => {
  return useMutation({
    mutationFn: async ({ providerId, data }: { providerId: string; data: any }) => {
      const response = await apiClient.executeProvider(providerId, data);
      return response;
    },
  });
};

export const useCreateBulkJob = () => {
  return useMutation({
    mutationFn: async ({ providerId, data }: { providerId: string; data: any }) => {
      const response = await apiClient.createBulkJob(providerId, data);
      return response.data;
    },
  });
};
```

## 🏪 Step 3.7: Zustand Store Setup

Create `frontend/src/lib/stores/providerStore.ts`:
```typescript
import { create } from 'zustand';
import { Provider } from '@/types';

interface ProviderStore {
  selectedProvider: Provider | null;
  selectedOperation: string | null;
  setSelectedProvider: (provider: Provider | null) => void;
  setSelectedOperation: (operation: string | null) => void;
  reset: () => void;
}

export const useProviderStore = create<ProviderStore>((set) => ({
  selectedProvider: null,
  selectedOperation: null,
  setSelectedProvider: (provider) => set({ selectedProvider: provider }),
  setSelectedOperation: (operation) => set({ selectedOperation: operation }),
  reset: () => set({ selectedProvider: null, selectedOperation: null }),
}));
```

Create `frontend/src/lib/stores/jobStore.ts`:
```typescript
import { create } from 'zustand';
import { Job } from '@/types';

interface JobStore {
  activeJobs: Job[];
  addJob: (job: Job) => void;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  removeJob: (jobId: string) => void;
}

export const useJobStore = create<JobStore>((set) => ({
  activeJobs: [],
  addJob: (job) =>
    set((state) => ({
      activeJobs: [...state.activeJobs, job],
    })),
  updateJob: (jobId, updates) =>
    set((state) => ({
      activeJobs: state.activeJobs.map((job) =>
        job.id === jobId ? { ...job, ...updates } : job
      ),
    })),
  removeJob: (jobId) =>
    set((state) => ({
      activeJobs: state.activeJobs.filter((job) => job.id !== jobId),
    })),
}));
```

## 🎨 Step 3.8: Provider Marketplace Components

Create `frontend/src/components/providers/ProviderCard.tsx`:
```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Provider } from '@/types';
import { useProviderStore } from '@/lib/stores/providerStore';
import { Building2, Mail, Brain, Users } from 'lucide-react';

const categoryIcons = {
  'major-database': Building2,
  'email-finder': Mail,
  'ai-research': Brain,
  'social-enrichment': Users,
};

interface ProviderCardProps {
  provider: Provider;
  onSelect: () => void;
}

export function ProviderCard({ provider, onSelect }: ProviderCardProps) {
  const Icon = categoryIcons[provider.category as keyof typeof categoryIcons] || Building2;
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8 text-primary" />
            <div>
              <CardTitle>{provider.displayName}</CardTitle>
              <CardDescription>{provider.category}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary">{provider.features.length} features</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Available operations:
          </p>
          <div className="flex flex-wrap gap-1">
            {provider.features.slice(0, 3).map((feature) => (
              <Badge key={feature.featureId} variant="outline" className="text-xs">
                {feature.featureName}
              </Badge>
            ))}
            {provider.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{provider.features.length - 3} more
              </Badge>
            )}
          </div>
        </div>
        <Button className="w-full mt-4" variant="secondary">
          Select Provider
        </Button>
      </CardContent>
    </Card>
  );
}
```

Create `frontend/src/components/providers/ProviderMarketplace.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useProviders } from '@/lib/api/providers';
import { ProviderCard } from './ProviderCard';
import { ProviderDetails } from './ProviderDetails';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export function ProviderMarketplace() {
  const { data: providers, isLoading, error } = useProviders();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load providers</p>
      </div>
    );
  }

  const categories = Array.from(new Set(providers?.map((p) => p.category) || []));
  
  const filteredProviders = providers?.filter((provider) => {
    const matchesSearch = provider.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.features.some((f) => f.featureName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || provider.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search providers or features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Provider Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProviders?.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onSelect={() => setSelectedProvider(provider)}
          />
        ))}
      </div>

      {/* Provider Details Modal */}
      {selectedProvider && (
        <ProviderDetails
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
        />
      )}
    </div>
  );
}
```

## 🔄 Step 3.9: Real-time Progress with Socket.io

Create `frontend/src/lib/socket.ts`:
```typescript
import { io, Socket } from 'socket.io-client';
import { useJobStore } from '@/lib/stores/jobStore';

class SocketManager {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('job:progress', (data: any) => {
      const { updateJob } = useJobStore.getState();
      updateJob(data.jobId, {
        progress: data.progress,
        status: data.status,
      });
    });

    this.socket.on('job:completed', (data: any) => {
      const { updateJob } = useJobStore.getState();
      updateJob(data.jobId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
    });

    this.socket.on('job:failed', (data: any) => {
      const { updateJob } = useJobStore.getState();
      updateJob(data.jobId, {
        status: 'failed',
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  subscribeToJob(jobId: string) {
    this.socket?.emit('job:subscribe', { jobId });
  }

  unsubscribeFromJob(jobId: string) {
    this.socket?.emit('job:unsubscribe', { jobId });
  }
}

export const socketManager = new SocketManager();
```

## 🎨 Step 3.10: Main Layout Update

Update `frontend/src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LeadEnrich Pro',
  description: 'Multi-provider lead enrichment platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <header className="border-b">
              <div className="container mx-auto px-4 py-4">
                <h1 className="text-2xl font-bold">LeadEnrich Pro</h1>
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
```

Create `frontend/src/app/providers.tsx`:
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';
import { socketManager } from '@/lib/socket';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    socketManager.connect();
    return () => {
      socketManager.disconnect();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## 🏠 Step 3.11: Update Home Page

Update `frontend/src/app/page.tsx`:
```typescript
import { ProviderMarketplace } from '@/components/providers/ProviderMarketplace';

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Provider Marketplace</h2>
        <p className="text-muted-foreground mt-2">
          Choose from 50+ data providers to enrich your leads
        </p>
      </div>
      <ProviderMarketplace />
    </div>
  );
}
```

## 🚀 Step 3.12: Run and Verify

1. **Start the frontend**:
```bash
cd frontend
npm run dev
```

2. **Open browser**:
Navigate to http://localhost:3000

3. **Verify functionality**:
- Provider cards should display
- Search and filter should work
- Socket connection should establish

## ✅ Phase 3 Completion Checklist

- [ ] Next.js 14 app created with TypeScript
- [ ] Tailwind CSS and Shadcn/ui configured
- [ ] API client with proper error handling
- [ ] Provider marketplace UI functional
- [ ] Real-time Socket.io connection
- [ ] State management with Zustand
- [ ] React Query for data fetching
- [ ] Responsive design working

## 🎯 Git Checkpoint

```bash
cd ..  # Back to project root
git add .
git commit -m "Complete Phase 3: Frontend foundation with provider marketplace"
git branch phase-3-complete
```

## 📊 Current Project State

You now have:
- ✅ Modern Next.js 14 frontend
- ✅ Provider marketplace UI
- ✅ Real-time capabilities
- ✅ Type-safe API integration
- ✅ Professional UI components
- ✅ State management

## 🚨 Common Issues & Solutions

1. **CORS errors**: Check backend CORS configuration
2. **Socket connection failed**: Verify backend is running
3. **No providers showing**: Run backend seed script
4. **Type errors**: Run `npm run build` to check

## 📝 Next Phase

Ready for Phase 4! The app now has:
- Working frontend
- Provider selection
- Ready for enrichment features

Proceed to: **Phase 4: Enrichment Features & File Processing**