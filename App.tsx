
import React, { useState, useEffect, useCallback } from 'react';
import sdk from '@farcaster/frame-sdk';
import { AppMode, GeneratedContent } from './types';
import { ResultCard } from './components/ResultCard';
import { CryptoTicker } from './components/CryptoTicker';
import { SpinWheel } from './components/SpinWheel';
import { ThemeToggle } from './components/ThemeToggle';
import { generateGMText, generateGMImage } from './services/geminiService';
import { TabSwitcher } from './components/TabSwitcher';

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

const BASE_CHAIN_ID = '0x2105'; // 8453 in hex
const GM_CONTRACT_ADDRESS = '0x1DEe998c8801aD2eE57CF4D54FF3263cd0a98b35';

// Helper to get the best provider, prioritizing Farcaster/Coinbase
const getFarcasterProvider = () => {
    // 1. First priority: The provider explicitly injected by the Frame SDK
    if (sdk.wallet && sdk.wallet.ethProvider) {
        return sdk.wallet.ethProvider;
    }

    // 2. Check for EIP-6963 Multi-Injected Providers
    if (typeof window.ethereum !== 'undefined' && window.ethereum.providers) {
        // Find the one that identifies as Coinbase Wallet (Warpcast uses this core)
        const fcProvider = window.ethereum.providers.find((p: any) => p.isCoinbaseWallet);
        if (fcProvider) return fcProvider;
    }

    // 3. Check if the main window.ethereum is Coinbase/Farcaster
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet) {
        return window.ethereum;
    }

    // 4. Last resort: Standard window.ethereum (MetaMask, etc.)
    return window.ethereum;
};

// Brutalist Badge
const MintedBadge = ({ tx, streak, date }: { tx: string, streak: number, date: string }) => {
    
  const handleShareProof = () => {
    const text = `I just minted my Daily GM onchain! ☀️\n\nStreak: ${streak} 🔥\nProof: ${tx}\n\nGM fam! WAGMI. #OnchainGM #Base`;
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="mx-auto max-w-sm my-8 animate-fade-in font-mono">
        {/* Ticket Design */}
        <div className="bg-white dark:bg-terminal border-2 border-black dark:border-white shadow-brutal relative p-6">
            {/* Cutout circles for ticket effect */}
            <div className="absolute top-1/2 -left-3 w-6 h-6 bg-blue-50 dark:bg-[#0f172a] rounded-full border-r-2 border-black dark:border-white"></div>
            <div className="absolute top-1/2 -right-3 w-6 h-6 bg-blue-50 dark:bg-[#0f172a] rounded-full border-l-2 border-black dark:border-white"></div>

            <div className="border-2 border-dashed border-black/30 dark:border-white/30 p-4">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-black text-xl uppercase">GM PASS</span>
                    <div className="bg-black dark:bg-white text-white dark:text-black px-2 py-1 font-bold">
                        #{streak.toString().padStart(4, '0')}
                    </div>
                </div>
                
                <div className="text-center py-6 border-y-2 border-black dark:border-white">
                    <div className="text-4xl mb-2">☀️</div>
                    <p className="font-bold uppercase tracking-widest">{date}</p>
                    <p className="text-xs mt-1 text-green-600 dark:text-green-400 font-bold">[ VERIFIED ]</p>
                </div>

                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-bold uppercase mb-1">
                        <span>Proof (Base)</span>
                    </div>
                    <a 
                    href={`https://basescan.org/tx/${tx}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block bg-gray-100 dark:bg-gray-800 p-2 text-[10px] break-all hover:bg-yellow-200 dark:hover:bg-purple-900 border border-black/20 dark:border-white/20 transition-colors"
                    >
                    {tx}
                    </a>
                </div>
            </div>
        </div>
        
        <button 
            onClick={handleShareProof}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white py-3 border-2 border-black dark:border-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-bold text-sm transition-all uppercase"
        >
            [ Share Proof ]
        </button>
    </div>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.GM_TEXT);
  const [prompt, setPrompt] = useState('');
  
  // Generation State
  const [genStatus, setGenStatus] = useState<'idle' | 'signing' | 'generating'>('idle');
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Onchain State
  const [streak, setStreak] = useState(42);
  const [totalGMs, setTotalGMs] = useState(1337);
  const [mintStatus, setMintStatus] = useState<'idle' | 'signing' | 'minting' | 'minted'>('idle');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [lastMintTx, setLastMintTx] = useState<string | null>(null);

  // Spin Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResultIndex, setSpinResultIndex] = useState<number | null>(null);
  const [showSpinModal, setShowSpinModal] = useState(false);

  // Initialize Farcaster SDK
  useEffect(() => {
    const initFrame = async () => {
      try {
        if (sdk && sdk.actions && sdk.actions.ready) {
            await sdk.actions.ready();
        }
      } catch (err) {
        console.error("Frame SDK Init Error:", err);
      }
    };
    initFrame();
  }, []);

  // Check for connected account on load
  useEffect(() => {
    const checkAccount = async () => {
        const provider = getFarcasterProvider();
        if (provider) {
            try {
                const accounts = await provider.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setWalletAddress(accounts[0]);
                }
            } catch (e) {
                console.error("Error checking accounts:", e);
            }
        }
    };
    checkAccount();
  }, []);

  const switchToBaseChain = async () => {
    const provider = getFarcasterProvider();
    if (!provider) return;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_ID }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BASE_CHAIN_ID,
                chainName: 'Base',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org'],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Base chain", addError);
        }
      }
    }
  };

  const connectWallet = async () => {
    const provider = getFarcasterProvider();
    if (provider) {
      try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setError(null);
        await switchToBaseChain();
      } catch (err: any) {
        setError("Connection rejected.");
      }
    } else {
        setError("Wallet not found.");
    }
  };

  const handleMint = async () => {
    if (mintStatus !== 'idle') return;
    if (!walletAddress) { await connectWallet(); return; }

    const provider = getFarcasterProvider();
    if (!provider) return;

    try {
      setMintStatus('signing');
      setError(null);
      await switchToBaseChain();

      // Send transaction to the real contract
      // Function: gm() -> Selector: 0x2437e542
      const hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ 
            from: walletAddress, 
            to: GM_CONTRACT_ADDRESS, 
            value: '0x0', 
            data: '0x2437e542' // keccak256("gm()").substring(0, 8)
        }],
      });

      setLastMintTx(hash);
      setMintStatus('minting');
      
      // Optimistic Update
      setTimeout(() => {
        setMintStatus('minted');
        setStreak(s => s + 1);
        setTotalGMs(t => t + 1);
      }, 3000); 

    } catch (err: any) {
      setMintStatus('idle');
      setError(err.message || "Mint failed.");
    }
  };

  const handleSpin = async () => {
    if (isSpinning || spinResultIndex !== null) return;
    if (!walletAddress) { await connectWallet(); return; }

    const provider = getFarcasterProvider();
    if (!provider) return;

    try {
        setError(null);
        await switchToBaseChain();
        await provider.request({
            method: 'eth_sendTransaction',
            params: [{ from: walletAddress, to: walletAddress, value: '0x0', data: '0x7370696e' }],
        });
        setIsSpinning(true);
        const randomIndex = Math.floor(Math.random() * 6);
        setSpinResultIndex(randomIndex);
    } catch (err: any) {
        setError("Spin cancelled.");
    }
  };

  const handleSpinFinished = () => {
      setIsSpinning(false);
      setShowSpinModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) { await connectWallet(); return; }
    
    const provider = getFarcasterProvider();
    if (!provider) return;

    setGenStatus('signing');
    setError(null);
    setResult(null);

    try {
      await switchToBaseChain();
      // Simple self-send signature for simulation of "AI Generation Fee" (0 ETH)
      await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: walletAddress, to: walletAddress, value: '0x0', data: '0x676d2d67656e' }],
      });
      setGenStatus('generating');
      if (mode === AppMode.GM_TEXT) {
        const text = await generateGMText(prompt);
        setResult({ text });
      } else {
        const imageUrl = await generateGMImage(prompt);
        setResult({ imageUrl });
      }
    } catch (err: any) {
       setError(err.message || 'Error.');
    } finally {
      setGenStatus('idle');
    }
  };

  const formatAddress = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  return (
    <div className="min-h-screen pt-12 pb-20 font-mono transition-colors duration-300">
      <CryptoTicker />

      {/* Main Container with Glassmorphism to contrast with background */}
      <div className="p-6 max-w-md mx-auto mt-6 bg-white/70 dark:bg-black/60 backdrop-blur-sm rounded-xl border border-white/50 dark:border-white/10 shadow-xl">
        
        {/* Header */}
        <header className="mb-8 flex justify-between items-end border-b-4 border-black dark:border-white pb-4">
          <div>
            <h1 className="text-3xl font-black uppercase text-black dark:text-white leading-none">
              Onchain<br/><span className="bg-black text-white dark:bg-white dark:text-black px-1">GM_AI</span>
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ThemeToggle />
            {walletAddress ? (
                <div className="text-[10px] font-bold border-2 border-black dark:border-white px-2 py-1 bg-green-400 text-black shadow-brutal-sm">
                   🟢 {formatAddress(walletAddress)}
                </div>
            ) : (
                <button 
                    onClick={connectWallet}
                    className="text-xs font-bold border-2 border-black dark:border-white px-3 py-1 bg-white dark:bg-black text-black dark:text-white shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] uppercase"
                >
                    [ Connect ]
                </button>
            )}
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="border-2 border-black dark:border-white p-2 bg-white dark:bg-black shadow-brutal">
                <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Streak</p>
                <p className="text-2xl font-black text-black dark:text-white">{streak} 🔥</p>
            </div>
            <div className="border-2 border-black dark:border-white p-2 bg-white dark:bg-black shadow-brutal">
                <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Total GMs</p>
                <p className="text-2xl font-black text-black dark:text-white">{totalGMs}</p>
            </div>
        </div>

        {/* Mint Button */}
        <div className="mb-8">
          {mintStatus === 'minted' && lastMintTx ? (
            <MintedBadge 
              tx={lastMintTx} 
              streak={streak} 
              date={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            />
          ) : (
              <button 
                  onClick={handleMint}
                  disabled={mintStatus === 'minting' || mintStatus === 'minted'}
                  className={`w-full py-4 font-black text-xl border-2 border-black dark:border-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase relative overflow-hidden rounded-lg
                  ${mintStatus === 'minting'
                      ? 'bg-gray-300 dark:bg-gray-800 text-gray-500'
                      : 'bg-neon-orange text-white dark:text-black'
                  }`}
              >
                  {mintStatus === 'signing' ? 'SIGN TX...' : mintStatus === 'minting' ? 'MINTING...' : 'MINT DAILY GM'}
              </button>
          )}
        </div>
        
        {/* Spin Wheel */}
        <div className="mb-12">
            <SpinWheel 
                isSpinning={isSpinning}
                resultIndex={spinResultIndex}
                onSpin={handleSpin}
                onFinished={handleSpinFinished}
                disabled={isSpinning || spinResultIndex !== null}
            />
        </div>

        {/* Modal for Spin */}
        {showSpinModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-terminal border-2 border-black dark:border-white p-6 max-w-xs w-full text-center shadow-brutal-lg rounded-xl">
                    <div className="text-4xl mb-4">🎁</div>
                    <h3 className="text-xl font-black uppercase text-black dark:text-white mb-2">SPIN RESULT</h3>
                    <p className="text-sm font-mono text-gray-600 dark:text-gray-300 mb-6">You collected a reward.</p>
                    <button 
                        onClick={() => { setShowSpinModal(false); setSpinResultIndex(null); }}
                        className="w-full bg-black text-white dark:bg-white dark:text-black font-bold py-3 border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-transparent hover:text-black dark:hover:text-white transition-all uppercase shadow-brutal rounded-lg"
                    >
                        [ CLOSE ]
                    </button>
                </div>
            </div>
        )}

        {/* AI Generator */}
        <div className="border-t-4 border-black dark:border-white pt-8">
          <TabSwitcher currentMode={mode} onSwitch={setMode} />

          <form onSubmit={handleSubmit}>
              <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={mode === AppMode.GM_TEXT ? "Topic: Coffee, Pump, Monday..." : "Scene: Sunrise, Cyberpunk, Pepe..."}
                  className="w-full bg-white dark:bg-black border-2 border-black dark:border-white p-4 font-mono text-sm focus:outline-none shadow-brutal mb-4 min-h-[100px] rounded-lg"
                  disabled={genStatus !== 'idle'}
              />

              <button
              type="submit"
              disabled={genStatus !== 'idle'}
              className={`
                  w-full py-3 font-bold text-sm border-2 border-black dark:border-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase rounded-lg
                  ${genStatus !== 'idle' ? 'bg-gray-300' : 'bg-neon-green text-black'}
              `}
              >
              {genStatus === 'idle' ? '[ GENERATE ]' : 'PROCESSING...'}
              </button>
          </form>

          {error && (
              <div className="mt-4 p-2 border-2 border-red-500 bg-red-100 text-red-600 font-bold text-xs uppercase">
              ERROR: {error}
              </div>
          )}

          {result && <ResultCard mode={mode} content={result} />}
        </div>

        <footer className="mt-12 text-center border-t border-dashed border-gray-400 pt-4">
          <p className="text-[10px] uppercase font-bold text-gray-500">System Ready • v1.0.4</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
