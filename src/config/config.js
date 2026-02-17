// Backend API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://saifu-backend.onrender.com';

export const API_ENDPOINTS = {
    SOL_BALANCE: (address) => `${API_BASE_URL}/api/sol-balance/${address}`,
    TOKEN_BALANCES: (address) => `${API_BASE_URL}/api/token-balances/${address}`,
    SOL_PRICE: `${API_BASE_URL}/api/sol-price`,
    SWAP_QUOTE: `${API_BASE_URL}/api/swap/quote`,
    SWAP_TRANSACTION: `${API_BASE_URL}/api/swap/transaction`,
    RPC_PROXY: `${API_BASE_URL}/api/rpc`,
};

export default API_BASE_URL;
