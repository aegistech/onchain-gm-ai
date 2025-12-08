import React, { useEffect, useState } from 'react';

interface CoinData {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export const CryptoTicker: React.FC = () => {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum,bitcoin,solana,degen-base,pepe&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h'
        );
        const data = await response.json();
        if (Array.isArray(data)) {
          setCoins(data);
        }
      } catch (error) {
        console.error("Failed to fetch prices", error);
        setCoins([
          { id: 'ethereum', symbol: 'eth', current_price: 3500, price_change_percentage_24h: 2.5 },
          { id: 'bitcoin', symbol: 'btc', current_price: 95000, price_change_percentage_24h: 1.2 },
          { id: 'solana', symbol: 'sol', current_price: 145, price_change_percentage_24h: -0.5 },
          { id: 'degen', symbol: 'degen', current_price: 0.02, price_change_percentage_24h: 12.4 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading && coins.length === 0) return null;

  const displayCoins = [...coins, ...coins];

  return (
    <div className="w-full bg-yellow-400 dark:bg-neon-orange border-b-2 border-black dark:border-white py-1 fixed top-0 z-50 overflow-hidden font-mono">
      <div className="flex animate-marquee whitespace-nowrap">
        {displayCoins.map((coin, index) => (
          <div key={`${coin.id}-${index}`} className="flex items-center mx-4 text-black font-bold uppercase tracking-wider">
            <span className="mr-2">
              {coin.symbol}:
            </span>
            <span className="mr-2">
              ${coin.current_price.toLocaleString(undefined, { maximumSignificantDigits: 6 })}
            </span>
            <span
              className={`${
                coin.price_change_percentage_24h >= 0 ? 'text-black' : 'text-red-600 dark:text-white'
              }`}
            >
              [{coin.price_change_percentage_24h >= 0 ? '+' : ''}{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%]
            </span>
            <span className="mx-2 text-black">///</span>
          </div>
        ))}
      </div>
    </div>
  );
};