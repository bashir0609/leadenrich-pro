// frontend/src/lib/api/providers.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Provider } from '@/types';

interface ProviderStore {
  selectedProvider: Provider | null;
  selectedOperation: string | null;
  setSelectedProvider: (provider: Provider | null) => void;
  setSelectedOperation: (operation: string | null) => void;
  reset: () => void;
}

export const useProviderStore = create<ProviderStore>()(
  persist(
    (set) => ({
      selectedProvider: null,
      selectedOperation: null,
      setSelectedProvider: (provider) => set({ selectedProvider: provider }),
      setSelectedOperation: (operation) => set({ selectedOperation: operation }),
      reset: () => set({ selectedProvider: null, selectedOperation: null }),
    }),
    {
      name: 'provider-store',
      partialize: (state) => ({ 
        selectedProvider: state.selectedProvider,
        selectedOperation: state.selectedOperation
      }),
    }
  )
);