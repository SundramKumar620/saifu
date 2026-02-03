const HELIUS_API_KEY = "15fed2f6-7bb6-4ecd-ab74-62aebb6f71f8";

export async function getTokenBalances(address) {
    const url = `https://api-devnet.helius.xyz/v0/addresses/${address}/balances?api-key=${HELIUS_API_KEY}`;

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
