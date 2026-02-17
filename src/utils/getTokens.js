import { API_ENDPOINTS } from "../config/config.js";

export async function getTokens(address) {
    const res = await fetch(API_ENDPOINTS.TOKEN_BALANCES(address));

    if (!res.ok) {
        throw new Error(`Failed to fetch tokens: ${res.statusText}`);
    }

    const data = await res.json();

    if (!data.tokens || !Array.isArray(data.tokens)) {
        return [];
    }

    return data.tokens.map(token => ({
        mint: token.mint,
        symbol: token.symbol || 'Unknown',
        name: token.name || 'Unknown Token',
        logo: token.logo || null,
        balance: parseFloat(token.balance) || 0,
    }));
}
