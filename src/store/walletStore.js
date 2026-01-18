import { create } from "zustand";

export const useWalletStore = create((set) => ({
  walletExists: false,
  walletLocked: true,

  accounts: [],
  selectedAccountIndex: null,

  setWallet: (accounts) =>
    set({
      walletExists: true,
      walletLocked: true,
      accounts,
      selectedAccountIndex: accounts[0]?.index ?? null,
    }),

  addAccount: (account) =>
    set((state) => ({
      accounts: [...state.accounts, account],
    })),

  selectAccount: (index) =>
    set({
      selectedAccountIndex: index,
    }),

  deleteAccount: (index) =>
    set((state) => {
      if (state.accounts.length === 1) return state; // ❌ never delete last

      const filtered = state.accounts.filter(
        (acc) => acc.index !== index
      );

      return {
        accounts: filtered,
        selectedAccountIndex:
          state.selectedAccountIndex === index
            ? filtered[0].index
            : state.selectedAccountIndex,
      };
    }),

  updateAccountName: (index, name) =>
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.index === index ? { ...acc, name } : acc
      ),
    })),

  unlockWallet: () => set({ walletLocked: false }),
  lockWallet: () => set({ walletLocked: true }),
}));
