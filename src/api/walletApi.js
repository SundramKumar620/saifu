import api from "./axios";


export async function createWallet(accountIndex = 0) {
  const response = await api.post("/wallet/create", {
    accountIndex,
  });

  return response.data;
}


export async function importWallet(mnemonic, accountIndex = 0) {
  const response = await api.post("/wallet/import", {
    mnemonic,
    accountIndex,
  });

  return response.data;
}
