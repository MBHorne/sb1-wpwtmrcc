import { create } from 'zustand';

interface ClientStore {
  selectedClientId: string | null;
  selectedClientName: string | null;
  setSelectedClient: (id: string | null, name: string | null) => void;
}

export const useClientStore = create<ClientStore>((set) => ({
  selectedClientId: null,
  selectedClientName: null,
  setSelectedClient: (id, name) => set({ selectedClientId: id, selectedClientName: name }),
}));