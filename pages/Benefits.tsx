
import React, { useState } from 'react';
import { UserStats } from '../types';

interface BenefitsProps {
  energy: number;
  onAddEnergy: (amount: number) => void;
  userStats: UserStats;
}

const Benefits: React.FC<BenefitsProps> = ({ energy, onAddEnergy, userStats }) => {
  const [checkedIn, setCheckedIn] = useState(() => {
    const lastCheckIn = localStorage.getItem('LAST_CHECK_IN_DATE');
    const today = new Date().toLocaleDateString();
    return lastCheckIn === today;
  });
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  const handleCheckIn = () => {
    if (!checkedIn) {
      setCheckedIn(true);
      localStorage.setItem('LAST_CHECK_IN_DATE', new Date().toLocaleDateString());
      onAddEnergy(2); // 签到奖励
    }
  };

  const simulateWatchAd = () => {
    setIsWatchingAd(true);
    setTimeout(() => {
      setIsWatchingAd(false);
      onAddEnergy(5); // 看广告奖励
    }, 2000);
  };

  return (
    <div className="animate-in fade-in duration-500 pb-12 bg-[#F8FAFB]">
      {/* 顶部能量卡片 */}
      <div className="bg-primary pt-12 pb-16 px-6 rounded-b-[3rem] shadow-lg shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 rotate-12 -translate-y-4 translate-x-4">
          <span className="material-symbols-outlined !text-[200px]">bolt</span>
        </div>
        <div className="relative z-10 flex flex-col items-center text-white">
          <p className="text-white/80 font-bold mb-2">当前拥有能量</p>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-4xl">bolt</span>
            <span className="text-5xl font-black">{energy}</span>
          </div>
          <p className="mt-4 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold border border-white/30">
            免费修复额度：{Math.floor(energy / 2)} 次
          </p>
        </div>
      </div>

      <div className="px-6 -mt-8 relative z-20">
        {/* 每日签到 - 增长粘性 */}
        <section className="bg-white rounded-[2rem] p-6 shadow-xl shadow-gray-200/50 mb-6 border border-white">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-charcoal">每日签到</h3>
              <p className="text-gray-400 text-xs">连续签到奖励更丰厚</p>
            </div>
            <div className="flex items-center gap-1 bg-primary/5 px-3 py-1 rounded-full">
               <span className="text-primary font-bold text-sm">已签：{checkedIn ? 1 : 0}天</span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6, 7].map(day => (
              <div key={day} className={`flex flex-col items-center p-2 rounded-xl transition-all ${day === 1 && checkedIn ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                <span className="text-[10px] font-bold mb-1">{day}</span>
                <span className="material-symbols-outlined !text-sm">{day === 7 ? 'card_giftcard' : 'bolt'}</span>
                <span className="text-[10px] mt-1 font-bold">+{day === 7 ? 10 : 2}</span>
              </div>
            ))}
          </div>
          <button 
            disabled={checkedIn}
            onClick={handleCheckIn}
            className={`w-full h-14 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg ${checkedIn ? 'bg-gray-100 text-gray-400 shadow-none' : 'bg-primary text-white shadow-primary/30'}`}
          >
            {checkedIn ? '今日任务已达成' : '立即签到领能量'}
          </button>
        </section>

        {/* 裂变任务 - 获取流量 */}
        <div className="mb-6">
          <h3 className="text-xl font-black mb-4 px-2">能量任务中心</h3>
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-gray-100 shadow-sm transition-transform active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">play_circle</span>
                </div>
                <div>
                  <p className="font-bold">看广告 领能量</p>
                  <p className="text-xs text-gray-400">观看激励视频 能量 +5</p>
                </div>
              </div>
              <button 
                onClick={simulateWatchAd}
                className="bg-primary text-white text-sm font-bold px-5 py-2 rounded-xl disabled:opacity-50"
                disabled={isWatchingAd}
              >
                {isWatchingAd ? '载入中...' : '去领取'}
              </button>
            </div>

            <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-gray-100 shadow-sm transition-transform active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-blue-100 text-blue-500 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined">share_windows</span>
                </div>
                <div>
                  <p className="font-bold">邀请好友 免费修复</p>
                  <p className="text-xs text-gray-400">邀请1位新用户 能量 +10</p>
                </div>
              </div>
              <button onClick={() => onAddEnergy(10)} className="bg-accent-warm text-white text-sm font-bold px-5 py-2 rounded-xl">去邀请</button>
            </div>
          </div>
        </div>

        {/* 裂变排行榜 - 社交竞争 */}
        <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-6 overflow-hidden relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black">时光推广达人榜</h3>
            <span className="text-xs text-primary font-bold">周榜更新</span>
          </div>
          <div className="space-y-4">
            {[
              { name: '李阿姨', count: 42, avatar: 'https://i.pravatar.cc/150?u=li' },
              { name: '张叔叔', count: 38, avatar: 'https://i.pravatar.cc/150?u=zhang' },
              { name: '王大爷', count: 25, avatar: 'https://i.pravatar.cc/150?u=wang' }
            ].map((user, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className={`text-lg font-black w-4 ${i === 0 ? 'text-yellow-500' : 'text-gray-300'}`}>{i + 1}</span>
                <img src={user.avatar} className="size-10 rounded-full border border-gray-100" />
                <span className="flex-1 font-bold text-gray-700">{user.name}</span>
                <span className="text-primary font-black">{user.count}人</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50 text-center">
            <p className="text-xs text-gray-400">邀请奖励上不封顶，助力更多好友找回记忆</p>
          </div>
        </section>

        {/* 商业广告占位 - 变现 */}
        <section className="bg-charcoal text-white rounded-[2rem] p-8 text-center shadow-xl shadow-gray-400/20 mb-8 relative group cursor-pointer overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent-warm/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <span className="material-symbols-outlined text-4xl mb-3 text-accent-warm">handshake</span>
           <p className="text-lg font-black tracking-widest">广告位招租</p>
           <p className="text-xs text-white/60 mt-2 font-medium">支持品牌冠名 / 社区精准投放 / 公众号引流</p>
           <button className="mt-4 bg-white text-charcoal px-6 py-2 rounded-full text-xs font-black">联系我们</button>
        </section>
      </div>
    </div>
  );
};

export default Benefits;
