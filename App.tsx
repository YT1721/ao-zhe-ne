
import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Benefits from './pages/Benefits';
import Profile from './pages/Profile';
import RestorationFlow from './pages/RestorationFlow';
import { Tab, UserStats, WorkItem } from './types';

const INITIAL_WORKS: WorkItem[] = [
  { 
    id: '1', 
    type: 'photo', 
    title: '1972年老家合影', 
    imageUrl: 'https://images.unsplash.com/photo-1534534747472-53e43548e58f?q=80&w=1000&auto=format&fit=crop', 
    date: new Date().toLocaleDateString(),
    createdAt: Date.now() - (4 * 60 * 60 * 1000) // 模拟 4 小时前
  },
  { 
    id: '2', 
    type: 'video', 
    title: '年轻时的我', 
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1000&auto=format&fit=crop', 
    date: new Date().toLocaleDateString(),
    createdAt: Date.now() - (18 * 60 * 60 * 1000) // 模拟 18 小时前，快过期了
  },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [restorationMode, setRestorationMode] = useState<'photo' | 'video' | null>(null);
  const [works, setWorks] = useState<WorkItem[]>(INITIAL_WORKS);
  const [userStats, setUserStats] = useState<UserStats>({
    energy: 10,
    level: '初级体验官',
    checkInDays: 0,
    totalRestored: INITIAL_WORKS.length,
    invites: 0
  });

  // 定时清理超过 24 小时的作品（前端演示用）
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const expiredIds = works.filter(w => now - w.createdAt > 24 * 60 * 60 * 1000).map(w => w.id);
      if (expiredIds.length > 0) {
        setWorks(prev => prev.filter(w => !expiredIds.includes(w.id)));
      }
    }, 60000); // 每分钟检查一次
    return () => clearInterval(timer);
  }, [works]);

  const addEnergy = (amount: number) => {
    setUserStats(prev => ({ ...prev, energy: prev.energy + amount }));
  };

  const consumeEnergy = (amount: number) => {
    if (userStats.energy >= amount) {
      setUserStats(prev => ({ ...prev, energy: prev.energy - amount }));
      return true;
    }
    return false;
  };

  const onRestorationSuccess = (newWork: WorkItem) => {
    setWorks(prev => [newWork, ...prev]);
    setUserStats(prev => ({ ...prev, totalRestored: prev.totalRestored + 1 }));
  };

  const deleteWorks = (ids: string[]) => {
    setWorks(prev => prev.filter(w => !ids.includes(w.id)));
  };

  const renderContent = () => {
    if (restorationMode) {
      return (
        <RestorationFlow 
          mode={restorationMode}
          onClose={() => setRestorationMode(null)} 
          energy={userStats.energy}
          onConsume={consumeEnergy}
          onRefund={addEnergy}
          onSuccess={onRestorationSuccess}
          onGoToBenefits={() => {
            setRestorationMode(null);
            setActiveTab('benefits');
          }}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return <Home onStartRestore={(mode) => setRestorationMode(mode)} energy={userStats.energy} />;
      case 'benefits':
        return <Benefits energy={userStats.energy} onAddEnergy={addEnergy} userStats={userStats} />;
      case 'profile':
        return <Profile userStats={userStats} works={works} onGoHome={() => setActiveTab('home')} onDeleteWorks={deleteWorks} />;
      default:
        return <Home onStartRestore={(mode) => setRestorationMode(mode)} energy={userStats.energy} />;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background-light shadow-2xl relative overflow-hidden">
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {renderContent()}
      </main>

      {!restorationMode && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-6 pb-8 pt-3 flex justify-around items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
          <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'home' ? 'text-primary scale-110' : 'text-gray-400'}`}>
            <span className={`material-symbols-outlined ${activeTab === 'home' ? 'active-icon' : ''}`}>home</span>
            <span className="text-[10px] font-bold">首页</span>
          </button>
          
          <button onClick={() => setActiveTab('benefits')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'benefits' ? 'text-primary scale-110' : 'text-gray-400'}`}>
            <div className="relative">
              <span className={`material-symbols-outlined ${activeTab === 'benefits' ? 'active-icon' : ''}`}>workspace_premium</span>
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            </div>
            <span className="text-[10px] font-bold">福利</span>
          </button>

          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'profile' ? 'text-primary scale-110' : 'text-gray-400'}`}>
            <span className={`material-symbols-outlined ${activeTab === 'profile' ? 'active-icon' : ''}`}>person</span>
            <span className="text-[10px] font-bold">我的</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
