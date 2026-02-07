import { API_ENDPOINTS } from "../config/config.js";

export async function getTokenBalances(address) {
    const url = API_ENDPOINTS.TOKEN_BALANCES(address);

    try {
        const res = await fetch(url);
        const data = await res.json();

        // data.tokens is an array, return empty array if no tokens
        if (!data.tokens || !Array.isArray(data.tokens)) {
            return [];
        }

        return data.tokens.map(token => ({
            mint: token.mint,
            symbol: token.symbol || 'Unknown',
            name: token.name || 'Unknown Token',
            logo: token.logo,
            balance: token.amount / Math.pow(10, token.decimals)
        }));
    } catch (error) {
        console.error("Error fetching token balances:", error);
        return [];
    }
}
