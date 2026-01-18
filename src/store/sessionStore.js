import { create } from "zustand";

export const useSessionStore = create(() => ({
  mnemonic: null,

  setMnemonic: (mnemonic) => {
    useSessionStore.setState({ mnemonic });
  },

  clearMnemonic: () => {
    useSessionStore.setState({ mnemonic: null });
  },
}));
