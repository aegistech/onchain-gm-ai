import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const BASE_CHAIN_ID_HEX = '0x2105'; // 8453 in hex
const BASE_CHAIN_ID_DEC = 8453;

// Contract Address
const GM_CONTRACT_ADDRESS = '0x4a8203f178Ae02163d25dFc83249515Ae066068e'; 

// Selectors for SimpleGM Contract
const SELECTOR_GM = '0x2437e542'; // gm()
const SELECTOR_GET_STREAK = '0x92c63748'; // getStreak(address)

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
  const [streak, setStreak] = useState(0); 
  const [totalGMs, setTotalGMs] = useState(1337);
  const [mintStatus, setMintStatus] = useState<'idle' | 'signing' | 'minting' | 'minted'>('idle');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [lastMintTx, setLastMintTx] = useState<string | null>(null);
  const [isContractMode, setIsContractMode] = useState(false);

  // Spin Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResultIndex, setSpinResultIndex] = useState<number | null>(null);
  const [showSpinModal, setShowSpinModal] = useState(false);
  
  // Farcaster State
  const [isSDKReady, setIsSDKReady] = useState(false);

  // Helper to get the correct provider
  const getProvider = useCallback(() => {
    // Priority 1: Farcaster SDK Provider (Mobile/Web Frame)
    if (sdk && sdk.wallet && sdk.wallet.ethProvider) {
        return sdk.wallet.ethProvider;
    }
    // Priority 2: Injected Provider (Metamask/Coinbase Wallet on Desktop)
    if (typeof window !== 'undefined' && window.ethereum) {
        return window.ethereum;
    }
    return null;
  }, []);

  // Initialize Farcaster SDK - CALL READY IMMEDIATELY for Mobile
  useEffect(() => {
    const initFrame = async () => {
      try {
        // Tell Farcaster we are ready to show UI immediately
        sdk.actions.ready();
        
        // Then wait for context
        const context = await sdk.context;
        setIsSDKReady(true);
        console.log("Farcaster Context Loaded:", context);
        
        // Attempt to connect wallet automatically if context exists
        if (context) {
             checkAccount();
        }
      } catch (err) {
        console.error("Frame SDK Init Error:", err);
        // Even on error, say ready so the app doesn't hang
        sdk.actions.ready();
      }
    };
    initFrame();
  }, []);

  // Fetch Streak from Chain
  const fetchStreak = useCallback(async (address: string, provider: any) => {
    if (!GM_CONTRACT_ADDRESS) return;
    
    try {
        const cleanAddr = address.replace('0x', '');
        const paddedAddr = cleanAddr.padStart(64, '0');
        const data = SELECTOR_GET_STREAK + paddedAddr;

        const hexResult = await provider.request({
            method: 'eth_call',
            params: [{ to: GM_CONTRACT_ADDRESS, data: data }, 'latest']
        });

        const streakValue = parseInt(hexResult, 16);
        setStreak(isNaN(streakValue) ? 0 : streakValue);
        setIsContractMode(true);
    } catch (e) {
        console.error("Error fetching streak:", e);
    }
  }, []);

  // Check for connected account
  const checkAccount = useCallback(async () => {
    const provider = getProvider();
    if (!provider) return;

    try {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            await fetchStreak(accounts[0], provider);
        }
    } catch (e) {
        console.error("Error checking accounts:", e);
    }
  }, [getProvider, fetchStreak]);

  const switchToBaseChain = async (provider: any) => {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_ID_HEX }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902 || switchError.code === -32603) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: BASE_CHAIN_ID_HEX,
                chainName: 'Base',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add Base chain", addError);
          return false;
        }
      }
      return false;
    }
  };

  const connectWallet = async () => {
    const provider = getProvider();
    if (provider) {
      try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setError(null);
            await switchToBaseChain(provider);
            await fetchStreak(accounts[0], provider);
        }
      } catch (err: any) {
        console.error(err);
        setError("Connection rejected. Please try again.");
      }
    } else {
        setError("Wallet not found. Open in Warpcast.");
    }
  };

  const handleMint = async () => {
    if (mintStatus !== 'idle') return;
    
    const provider = getProvider();
    if (!provider || !walletAddress) {
        await connectWallet();
        return;
    }

    try {
      setMintStatus('signing');
      setError(null);
      await switchToBaseChain(provider);

      const accounts = await provider.request({ method: 'eth_accounts' });
      const activeAccount = accounts[0];

      let txHash = '';

      if (GM_CONTRACT_ADDRESS) {
        // --- REAL CONTRACT MODE ---
        console.log("Calling Contract:", GM_CONTRACT_ADDRESS);
        
        // Manual Gas Limit helps prevent "Execution Reverted" on some wallets for Base L2
        // 150000 gas is plenty for a simple storage update
        const txParams = {
            from: activeAccount, 
            to: GM_CONTRACT_ADDRESS, 
            data: SELECTOR_GM, // gm()
            gas: '0x249F0', // ~150,000 gas limit (Hex)
        };

        try {
            txHash = await provider.request({
                method: 'eth_sendTransaction',
                params: [txParams],
            });
        } catch (innerErr: any) {
            // Check for specific revert reasons
            if (innerErr.message && innerErr.message.includes("Already GM")) {
                throw new Error("You already GM'd today! Come back tomorrow.");
            }
            throw innerErr;
        }

      } else {
        // --- SIMULATION MODE ---
        txHash = await provider.request({
            method: 'eth_sendTransaction',
            params: [{ 
                from: activeAccount, 
                to: activeAccount, 
                value: '0x0',      
                data: '0x676d'
            }],
        });
      }

      console.log("TX Hash:", txHash);
      setLastMintTx(txHash);
      setMintStatus('minting');
      
      setTimeout(() => {
        setMintStatus('minted');
        setStreak(s => s + 1);
        setTotalGMs(t => t + 1);
        if(walletAddress) fetchStreak(walletAddress, provider);
      }, 3000); 

    } catch (err: any) {
      setMintStatus('idle');
      console.error("Mint Error:", err);
      const msg = err.message || JSON.stringify(err);
      
      if (msg.includes("rejected")) {
          setError("Transaction rejected.");
      } else if (msg.includes("already GM") || msg.includes("Wait for tomorrow")) {
          setError("Already GM today! ☀️");
      } else {
          setError("Mint failed. Try again.");
      }
    }
  };

  const handleSpin = async () => {
    if (isSpinning || spinResultIndex !== null) return;
    const provider = getProvider();
    if (!walletAddress || !provider) { await connectWallet(); return; }

    try {
        setError(null);
        await switchToBaseChain(provider);
        const accounts = await provider.request({ method: 'eth_accounts' });
        
        // Add gas limit for spin too just in case
        await provider.request({
            method: 'eth_sendTransaction',
            params: [{ 
                from: accounts[0], 
                to: accounts[0], 
                value: '0x0', 
                data: '0x7370696e',
                gas: '0x5208' // 21000 gas
            }],
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
    const provider = getProvider();
    if (!walletAddress || !provider) { await connectWallet(); return; }

    setGenStatus('signing');
    setError(null);
    setResult(null);

    try {
      await switchToBaseChain(provider);
      const accounts = await provider.request({ method: 'eth_accounts' });

      await provider.request({
        method: 'eth_sendTransaction',
        params: [{ 
            from: accounts[0], 
            to: accounts[0], 
            value: '0x0', 
            data: '0x676d2d67656e',
            gas: '0x5208' 
        }],
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
       console.error("Gen Error:", err);
       setError('Generation cancelled or failed.');
    } finally {
      setGenStatus('idle');
    }
  };

  const formatAddress = (addr: string) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  return (
    <div className="min-h-screen pt-12 pb-20 font-mono transition-colors duration-300">
      <CryptoTicker />

      <div className="p-6 max-w-md mx-auto mt-6 bg-white/70 dark:bg-black/60 backdrop-blur-sm rounded-xl border border-white/50 dark:border-white/10 shadow-xl">
        
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

        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="border-2 border-black dark:border-white p-2 bg-white dark:bg-black shadow-brutal">
                <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Streak</p>
                <div className="flex items-center gap-2">
                    <p className="text-2xl font-black text-black dark:text-white">{streak} 🔥</p>
                    {isContractMode && <span className="text-[8px] bg-blue-500 text-white px-1">ONCHAIN</span>}
                </div>
            </div>
            <div className="border-2 border-black dark:border-white p-2 bg-white dark:bg-black shadow-brutal">
                <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Total GMs</p>
                <p className="text-2xl font-black text-black dark:text-white">{totalGMs}</p>
            </div>
        </div>

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
          
          {!GM_CONTRACT_ADDRESS && walletAddress && (
             <p className="text-[10px] text-center mt-2 opacity-50 font-mono">
                (Simulation Mode: Deploy contract to enable real stats)
             </p>
          )}
        </div>
        
        <div className="mb-12">
            <SpinWheel 
                isSpinning={isSpinning}
                resultIndex={spinResultIndex}
                onSpin={handleSpin}
                onFinished={handleSpinFinished}
                disabled={isSpinning || spinResultIndex !== null}
            />
        </div>

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
                  className={`w-full py-3 font-bold text-sm border-2 border-black dark:border-white shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase rounded-lg ${
                    genStatus !== 'idle' ? 'bg-gray-300' : 'bg-neon-green text-black'
                  }`}
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
          <p className="text-[10px] uppercase font-bold text-gray-500">System Ready • v1.0.6</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
