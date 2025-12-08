import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CampaignCard from './components/CampaignCard';
import CreateCampaign from './components/CreateCampaign';
import CampaignDetail from './components/CampaignDetail';
import Profile from './components/Profile';
import Legal from './components/Legal';
import FollowGate from './components/FollowGate';
import { Campaign, UserState, ViewState } from './types';
import * as Web3Service from './services/web3Service';
import { Loader2, Zap, Coins, MessageCircle, Layers, ShieldCheck, Smartphone, Users, Ghost } from 'lucide-react';
// FIXED: Use correct MiniApp SDK import
import sdk from '@farcaster/miniapp-sdk';
import ParticleBackground from './components/ParticleBackground';

const TRANSLATIONS: any = {
  en: {
    heroTitle: "Group up.",
    heroSubtitle: "Pool ETH. Win.",
    heroDesc: "FunDAO is the easiest way to start a DAO. Crowdfund ETH, mint tokens, and automate distribution with smart contracts.",
    connect: "Connect Wallet",
    createDao: "Create DAO",
    activeDaos: "Active DAOs",
    viewAll: "View All",
    startDao: "Start a DAO",
    liveOn: "Live on Farcaster"
  },
  vi: {
    heroTitle: "Tập hợp.",
    heroSubtitle: "Góp ETH. Thắng lớn.",
    heroDesc: "FunDAO là cách dễ nhất để bắt đầu một DAO. Gọi vốn ETH, đúc token và tự động phân phối với hợp đồng thông minh.",
    connect: "Kết nối Ví",
    createDao: "Tạo DAO",
    activeDaos: "Các DAO Hoạt động",
    viewAll: "Xem tất cả",
    startDao: "Bắt đầu DAO",
    liveOn: "Trực tiếp trên Farcaster"
  },
  zh: {
    heroTitle: "组队.",
    heroSubtitle: "汇集 ETH. 共赢.",
    heroDesc: "FunDAO 是启动 DAO 最简单的方式。通过智能合约众筹 ETH，铸造代币并自动分发。",
    connect: "连接钱包",
    createDao: "创建 DAO",
    activeDaos: "活跃 DAO",
    viewAll: "查看全部",
    startDao: "启动 DAO",
    liveOn: "Farcaster 实时"
  },
  ko: {
    heroTitle: "팀 구성.",
    heroSubtitle: "ETH 모금. 승리.",
    heroDesc: "FunDAO는 DAO를 시작하는 가장 쉬운 방법입니다. ETH를 크라우드펀딩하고, 토큰을 발행하며, 스마트 계약으로 배포를 자동화하세요.",
    connect: "지갑 연결",
    createDao: "DAO 만들기",
    activeDaos: "활성 DAO",
    viewAll: "모두 보기",
    startDao: "DAO 시작하기",
    liveOn: "Farcaster 라이브"
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserState>({
    address: null,
    balance: 0,
    isConnected: false,
    stats: { owned: 0, tradedVolume: 0, created: 0, joined: 0 }
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  
  // Follow Gate State
  const [isLocked, setIsLocked] = useState(true);
  
  // Language State
  const [language, setLanguage] = useState<string>('en');

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

  useEffect(() => {
    // Check if user has already passed the gate
    const hasUnlocked = localStorage.getItem('fundao_unlocked');
    if (hasUnlocked === 'true') {
        setIsLocked(false);
    }

    // Farcaster Frame v2 Initialization
    const initFarcaster = async () => {
        try {
            if (sdk && sdk.actions && sdk.actions.ready) {
                await sdk.actions.ready(); 
                console.log("Farcaster SDK Ready");
            }
        } catch (err) {
            console.log("Not running in Farcaster context", err);
        }
    };
    initFarcaster();

    loadData();
  }, []);

  useEffect(() => {
    // Toggle class on body/html
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleUnlockGate = () => {
      localStorage.setItem('fundao_unlocked', 'true');
      setIsLocked(false);
  };

  const loadData = async () => {
    setIsLoading(true);
    const data = await Web3Service.fetchCampaigns();
    setCampaigns(data);
    setIsLoading(false);
  };

  const handleConnect = async () => {
    const userState = await Web3Service.connectWallet();
    setUser(userState);
  };

  const handleLogout = () => {
    setUser({
        address: null,
        balance: 0,
        isConnected: false,
        stats: { owned: 0, tradedVolume: 0, created: 0, joined: 0 }
    });
    setCurrentView('HOME');
  };

  const handleCreateSubmit = async (name: string, ticker: string, description: string, target: number, imageUrl?: string) => {
    setIsDeploying(true);
    try {
        const newCampaign = await Web3Service.createCampaign(name, ticker, description, target, imageUrl);
        setCampaigns([newCampaign, ...campaigns]);
        setUser(prev => ({ 
            ...prev, 
            stats: { 
                ...prev.stats, 
                created: prev.stats.created + 1 
            } 
        }));
        setCurrentView('HOME');
    } catch (e) {
        console.error("Failed to deploy", e);
    } finally {
        setIsDeploying(false);
    }
  };

  const handleContribute = async (amount: number) => {
    if (!selectedCampaign || !user.isConnected) return;
    
    const updatedCampaign = { 
        ...selectedCampaign, 
        raisedEth: selectedCampaign.raisedEth + amount 
    };
    
    setSelectedCampaign(updatedCampaign);
    setCampaigns(campaigns.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
    
    const success = await Web3Service.contributeToCampaign(selectedCampaign.id, amount);

    if (success) {
        setUser(prev => ({ 
            ...prev, 
            balance: prev.balance - amount,
            stats: { 
                ...prev.stats, 
                joined: prev.stats.joined + 1 
            }
        }));
        alert("Deposit Successful!");
    } else {
        alert("Transaction Failed.");
    }
  };

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setCurrentView('DETAILS');
  };

  // --- RENDER ---

  if (isLocked) {
      return (
        <>
            <ParticleBackground theme={theme} />
            <FollowGate onUnlock={handleUnlockGate} />
        </>
      );
  }

  return (
    <div className="min-h-screen bg-party-bg text-party-text font-sans pb-20 selection:bg-brand-500 selection:text-white flex flex-col transition-colors duration-300 relative">
      <ParticleBackground theme={theme} />
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-brand-500/10 to-transparent pointer-events-none z-0 dark:opacity-100 opacity-50" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
      <Navbar 
        user={user} 
        onConnect={handleConnect} 
        onGoHome={() => setCurrentView('HOME')}
        onCreateClick={() => setCurrentView('CREATE')}
        onProfileClick={() => setCurrentView('PROFILE')}
        language={language}
        onSetLanguage={setLanguage}
        theme={theme}
        onToggleTheme={toggleTheme}
        t={t}
      />

      <main className="container mx-auto max-w-6xl px-4 sm:px-6 pt-12 flex-grow">
        {isLoading ? (
          <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="animate-spin text-party-text opacity-20" size={48} />
          </div>
        ) : (
          <>
            {currentView === 'HOME' && (
              <div className="space-y-16">
                <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto mt-8 relative">
                    <div className="inline-flex items-center gap-2 rounded-full border border-party-border bg-party-card/70 backdrop-blur-md px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-party-muted animate-in fade-in slide-in-from-top-4 duration-700 shadow-sm">
                        <Zap size={12} className="text-yellow-400 fill-yellow-400" />
                        {t.liveOn}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-party-text leading-[1.1] animate-in fade-in zoom-in duration-500 drop-shadow-2xl">
                        {t.heroTitle} <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
                            {t.heroSubtitle}
                        </span>
                    </h1>
                    <p className="text-lg text-party-muted max-w-xl leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 bg-party-bg/30 backdrop-blur-sm rounded-lg p-2">
                        {t.heroDesc}
                    </p>
                    <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        {!user.isConnected && (
                            <button 
                                onClick={handleConnect}
                                className="h-12 px-8 rounded-full bg-party-text text-party-bg font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-brand-500/20"
                            >
                                {t.connect}
                            </button>
                        )}
                         <button 
                            onClick={() => setCurrentView('CREATE')}
                            className="h-12 px-8 rounded-full border border-party-border bg-party-card/60 backdrop-blur-md text-party-text font-bold text-sm hover:bg-party-border/20 transition-colors shadow-sm"
                        >
                            {t.startDao}
                        </button>
                    </div>
                </div>

                {/* Features Section */}
                <div className="rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 text-white p-8 md:p-12 shadow-2xl shadow-brand-500/30 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 relative overflow-hidden border border-white/10">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                     <div className="mb-8 relative z-10">
                         <h2 className="text-3xl font-extrabold mb-2">FunDAO lets your group do more together.</h2>
                         <p className="opacity-90 text-lg">The all-in-one toolkit for onchain communities.</p>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-8 relative z-10">
                         <div className="space-y-2 group">
                             <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-white/30 transition-colors">
                                <Coins size={24} />
                             </div>
                             <h3 className="font-bold text-lg">Crowdfund</h3>
                             <p className="text-sm opacity-80 leading-relaxed">Raise ETH using secure smart contracts.</p>
                         </div>
                         <div className="space-y-2 group">
                             <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-white/30 transition-colors">
                                <Smartphone size={24} />
                             </div>
                             <h3 className="font-bold text-lg">Farcaster Native</h3>
                             <p className="text-sm opacity-80 leading-relaxed">Runs perfectly inside Warpcast frames.</p>
                         </div>
                         <div className="space-y-2 group">
                             <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-white/30 transition-colors">
                                <Layers size={24} />
                             </div>
                             <h3 className="font-bold text-lg">Token Issuance</h3>
                             <p className="text-sm opacity-80 leading-relaxed">Auto-mint tokens for every contributor.</p>
                         </div>
                         <div className="space-y-2 group">
                             <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-white/30 transition-colors">
                                <ShieldCheck size={24} />
                             </div>
                             <h3 className="font-bold text-lg">Trustless</h3>
                             <p className="text-sm opacity-80 leading-relaxed">Funds are held in verified escrow contracts.</p>
                         </div>
                         <div className="space-y-2 group">
                             <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-white/30 transition-colors">
                                <MessageCircle size={24} />
                             </div>
                             <h3 className="font-bold text-lg">Chat (Soon)</h3>
                             <p className="text-sm opacity-80 leading-relaxed">Private token-gated channels.</p>
                         </div>
                         <div className="space-y-2 group">
                             <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-white/30 transition-colors">
                                <Users size={24} />
                             </div>
                             <h3 className="font-bold text-lg">DAO Governance</h3>
                             <p className="text-sm opacity-80 leading-relaxed">Vote on proposals onchain.</p>
                         </div>
                     </div>
                </div>

                {/* Active DAOs Grid */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-party-text">{t.activeDaos}</h2>
                        {campaigns.length > 0 && (
                            <button className="text-sm font-semibold text-party-muted hover:text-party-text transition-colors">{t.viewAll}</button>
                        )}
                    </div>
                    
                    {campaigns.length > 0 ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {campaigns.map((campaign) => (
                            <CampaignCard 
                                key={campaign.id} 
                                campaign={campaign} 
                                onClick={handleCampaignClick}
                            />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-3xl border border-party-border bg-party-card/50 p-12 text-center backdrop-blur-md">
                            <div className="mb-4 rounded-full bg-party-input p-4">
                                <Ghost size={48} className="text-party-muted" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-party-text">No Active DAOs</h3>
                            <p className="mb-6 max-w-sm text-party-muted">
                                Be the first to launch a community on FunDAO. It takes less than 30 seconds.
                            </p>
                            <button 
                                onClick={() => setCurrentView('CREATE')}
                                className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
                            >
                                Launch First DAO
                            </button>
                        </div>
                    )}
                </div>
              </div>
            )}

            {currentView === 'CREATE' && (
              <CreateCampaign 
                onSubmit={handleCreateSubmit} 
                onCancel={() => setCurrentView('HOME')}
                isSubmitting={isDeploying}
              />
            )}

            {currentView === 'DETAILS' && selectedCampaign ? (
              <CampaignDetail 
                campaign={selectedCampaign} 
                onBack={() => setCurrentView('HOME')}
                onContribute={handleContribute}
                userBalance={user.balance}
              />
            ) : null}

            {currentView === 'PROFILE' && (
                <Profile user={user} onLogout={handleLogout} />
            )}

            {(currentView === 'PRIVACY' || currentView === 'TERMS') && (
                <Legal type={currentView} onBack={() => setCurrentView('HOME')} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-party-border bg-party-card/60 backdrop-blur-xl py-8 transition-colors duration-300 relative z-10">
        <div className="container mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2">
                 <span className="text-party-muted">© FunDAO by Base</span>
                 <a 
                    href="https://warpcast.com/fundao" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-party-muted hover:text-[#8a63d2] transition-colors ml-4 bg-party-card/50 border border-party-border rounded-full px-3 py-1"
                 >
                    <svg width="14" height="14" viewBox="0 0 1000 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M257.778 155.556H166.667V366.667C166.667 433.807 221.091 488.232 288.232 488.232C355.372 488.232 409.797 433.807 409.797 366.667V155.556H318.686V366.667C318.686 383.485 305.051 397.12 288.232 397.12C271.414 397.12 257.778 383.485 257.778 366.667V155.556Z" />
                        <path d="M578.145 155.556H669.256V366.667C669.256 383.485 682.891 397.12 699.71 397.12C716.528 397.12 730.163 383.485 730.163 366.667V155.556H821.275V366.667C821.275 433.807 766.85 488.232 699.71 488.232C632.57 488.232 578.145 433.807 578.145 366.667V155.556Z" />
                        <path d="M288.232 575.926C212.75 575.926 151.556 637.12 151.556 712.602H242.667C242.667 687.435 263.065 667.038 288.232 667.038H699.71C724.877 667.038 745.275 687.435 745.275 712.602H836.386C836.386 637.12 775.191 575.926 699.71 575.926H288.232Z" />
                    </svg>
                    @fundao
                 </a>
            </div>
            <div className="flex gap-6">
                <button onClick={() => setCurrentView('PRIVACY')} className="text-party-muted hover:text-party-text transition-colors">Privacy Policy</button>
                <button onClick={() => setCurrentView('TERMS')} className="text-party-muted hover:text-party-text transition-colors">Terms of Service</button>
            </div>
            <div className="text-party-muted opacity-50">v2.3 (Farcaster)</div>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default App;