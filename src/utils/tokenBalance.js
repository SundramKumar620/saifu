import { API_ENDPOINTS } from "../config/config.js";

export async function getTokenBalances(address) {
    try {
        const res = await fetch(API_ENDPOINTS.TOKEN_BALANCES(address));
        const data = await res.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Backend already formats the data correctly
        return data.tokens || [];
    } catch (error) {
        return [];
    }
}

