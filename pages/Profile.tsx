
import React, { useState, useEffect } from 'react';
import { UserStats, WorkItem } from '../types';
import { generateGuidanceSpeech } from '../services/geminiService';

interface ProfileProps {
  userStats: UserStats;
  works: WorkItem[];
  onGoHome: () => void;
  onDeleteWorks: (ids: string[]) => void;
}

const Profile: React.FC<ProfileProps> = ({ userStats, works, onGoHome, onDeleteWorks }) => {
  const [isManaging, setIsManaging] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isWarningPlaying, setIsWarningPlaying] = useState(false);

  // 实时更新当前时间，以维持倒计时动态感
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handlePlayWarning = async () => {
    if (works.length > 0 && !isWarningPlaying) {
      setIsWarningPlaying(true);
      const text = "您的新作品只能保存24小时，记得赶紧把它们存到手机相册里呀，过期就找不回来啦。";
      try {
        const base64Audio = await generateGuidanceSpeech(text);
        if (base64Audio) {
          const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
          audio.onended = () => setIsWarningPlaying(false);
          audio.play().catch(e => {
            console.log("Audio play blocked");
            setIsWarningPlaying(false);
          });
        } else {
            setIsWarningPlaying(false);
        }
      } catch (err) {
        setIsWarningPlaying(false);
      }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = () => {
    onDeleteWorks(selectedIds);
    setSelectedIds([]);
    setIsManaging(false);
    setShowConfirmDelete(false);
  };

  const handleBatchDownload = () => {
    const selectedWorks = works.filter(w => selectedIds.includes(w.id));
    selectedWorks.forEach((work, index) => {
      // 稍微延迟下载，防止浏览器拦截
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = work.imageUrl;
        link.download = `好着呢_${work.title}_${work.id}.${work.type === 'photo' ? 'png' : 'mp4'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 300);
    });
    
    // 成功提示
    setIsManaging(false);
    setSelectedIds([]);
  };

  const getRemainingTime = (createdAt: number) => {
    const diff = now - createdAt;
    const hoursLeft = 24 - Math.floor(diff / (1000 * 60 * 60));
    const minsLeft = 60 - (Math.floor(diff / (1000 * 60)) % 60);
    
    if (hoursLeft <= 0) return "即将清空";
    if (hoursLeft < 1) return `剩余 ${minsLeft} 分钟`;
    return `剩余 ${hoursLeft} 小时`;
  };

  return (
    <div className="animate-in fade-in duration-500 pb-32 bg-white min-h-screen relative">
      {/* 顶部个人名片 */}
      <div className="bg-gradient-to-b from-[#E6F3F5] to-white px-8 pt-16 pb-10">
        <div className="flex flex-col items-center">
          <div className="relative mb-5">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-[2.5rem] h-32 w-32 border-4 border-white shadow-2xl rotate-3" 
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDVzduXPuGAlT6C0GEoky9kzx-8-xCIPQg4H5XKl2meCo1ah88SB-Etxz50MMa3M71Wpwi28zq0PjTf_NAtGS3gBVQC3V_LhL8QijbiPipOXBaHU3p2gu1s_rLeYav07XJddrYP7-86lVBMHi2IL6T2J69FjcaYWcI72GQN51S22HoRYf4mppVZJ5ORfC7JnHbWAutDgeF9WAl_EcLikph08LNfVwvS1YMrx20S6UJghmlgr58MkshSRHmrtgC746u3B-18Oew2wldi")' }}
            ></div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-white size-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-xl font-black">verified</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-charcoal tracking-tighter">您的相册</h2>
          <div className="flex items-center gap-3 mt-4">
             <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-primary/5">
               {userStats.level}
             </span>
             <div className="flex items-center gap-1 bg-accent-warm/10 px-4 py-1.5 rounded-2xl border border-accent-warm/10">
                <span className="material-symbols-outlined text-sm text-accent-warm font-black">auto_awesome</span>
                <span className="text-[10px] text-accent-warm font-black">已寻回 {userStats.totalRestored} 段记忆</span>
             </div>
          </div>
        </div>
      </div>

      {/* 24小时过期提醒 Banner */}
      {works.length > 0 && (
        <div 
          onClick={handlePlayWarning}
          className={`mx-6 mb-6 rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all border ${isWarningPlaying ? 'bg-orange-100 border-orange-200' : 'bg-orange-50 border-orange-100'}`}
        >
           <span className={`material-symbols-outlined font-black ${isWarningPlaying ? 'text-orange-600 animate-bounce' : 'text-orange-500'}`}>
              {isWarningPlaying ? 'graphic_eq' : 'error'}
           </span>
           <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-orange-800 text-xs font-black">风险提示：作品仅临时保留 24 小时</p>
                {!isWarningPlaying && <span className="text-[9px] text-orange-400 font-black animate-pulse">点击听提醒</span>}
              </div>
              <p className="text-orange-600/70 text-[10px] font-bold leading-tight">由于云端存储压力，作品过期将永久清空，请务必及时保存到手机相册。</p>
           </div>
        </div>
      )}

      {/* 时光轴作品区 */}
      <div className="px-6 mt-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-black text-charcoal tracking-tight">时光画廊</h3>
            <span className="text-[10px] bg-primary text-white px-3 py-1 rounded-full font-black">{works.length} 件</span>
          </div>
          <button 
            onClick={() => {
              setIsManaging(!isManaging);
              setSelectedIds([]);
            }}
            className={`flex items-center gap-1 font-black text-sm transition-all px-4 py-1.5 rounded-full ${isManaging ? 'bg-gray-100 text-gray-500' : 'bg-primary/5 text-primary'}`}
          >
            <span className="material-symbols-outlined text-lg">{isManaging ? 'close' : 'edit_square'}</span>
            {isManaging ? '取消' : '管理'}
          </button>
        </div>

        {works.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {works.map((work) => (
              <div 
                key={work.id} 
                onClick={() => isManaging && toggleSelect(work.id)}
                className={`group relative flex flex-col gap-3 transition-all ${isManaging ? 'scale-95 active:scale-90' : 'active:scale-95'}`}
              >
                <div 
                  className={`bg-cover bg-center flex flex-col gap-3 rounded-[2.5rem] justify-end p-5 aspect-[3/4] shadow-xl overflow-hidden relative border-4 transition-all duration-300 ${isManaging && selectedIds.includes(work.id) ? 'border-primary ring-8 ring-primary/20' : 'border-white'}`}
                  style={{ backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 60%), url(${work.imageUrl})` }}
                >
                  {/* 过期倒计时标签 */}
                  {!isManaging && (
                    <div className="absolute top-4 left-4 z-20">
                      <div className="bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/10">
                        <span className="material-symbols-outlined !text-[10px] animate-spin" style={{animationDuration: '4s'}}>history</span>
                        {getRemainingTime(work.createdAt)}
                      </div>
                    </div>
                  )}

                  {/* 管理选择框 */}
                  {isManaging && (
                    <div className="absolute inset-0 z-30 bg-black/20 flex items-start justify-end p-4">
                      <div className={`size-8 rounded-full border-4 flex items-center justify-center transition-all ${selectedIds.includes(work.id) ? 'bg-primary border-white scale-110' : 'bg-white/40 border-white'}`}>
                        {selectedIds.includes(work.id) && <span className="material-symbols-outlined text-white text-xl font-black">done</span>}
                      </div>
                    </div>
                  )}

                  {/* 类型标识 */}
                  <div className="absolute top-4 right-4 bg-white/30 backdrop-blur-md size-9 rounded-2xl flex items-center justify-center border border-white/40 text-white shadow-lg">
                    <span className="material-symbols-outlined text-xl">
                      {work.type === 'photo' ? 'auto_fix_high' : 'movie_filter'}
                    </span>
                  </div>
                  
                  {work.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <div className="size-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                          <span className="material-symbols-outlined text-white text-4xl">play_circle</span>
                       </div>
                    </div>
                  )}

                  <div className="relative z-10">
                    <p className="text-white text-sm font-black line-clamp-1 mb-0.5">{work.title}</p>
                    <p className="text-white/60 text-[10px] font-bold">{work.date}</p>
                  </div>
                </div>
              </div>
            ))}
            {/* 新增引导位 */}
            {!isManaging && (
              <div 
                onClick={onGoHome}
                className="aspect-[3/4] bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center gap-4 text-gray-300 cursor-pointer hover:bg-gray-100 hover:border-primary/20 transition-all group"
              >
                 <div className="size-14 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                   <span className="material-symbols-outlined text-3xl font-light text-primary">add_photo_alternate</span>
                 </div>
                 <span className="text-xs font-black">找回更多记忆</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
             <div className="size-32 bg-primary/5 rounded-full flex items-center justify-center mb-8">
               <span className="material-symbols-outlined text-6xl text-primary/20">photo_library</span>
             </div>
             <p className="text-gray-400 font-bold text-lg">您的相册还是空的</p>
             <button onClick={onGoHome} className="mt-6 bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-transform">立即开始第一次修复</button>
          </div>
        )}
      </div>

      {/* 批量操作工具栏 (悬浮) */}
      {isManaging && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-md animate-in slide-in-from-bottom duration-300 z-[60]">
          <div className="bg-charcoal text-white rounded-[2rem] p-4 flex items-center justify-between shadow-2xl border border-white/10 ring-1 ring-white/20">
            <div className="px-4">
               <p className="text-base font-black">已选中 {selectedIds.length} 项</p>
               <p className="text-[10px] text-white/40 font-bold">请确保已完成存储</p>
            </div>
            <div className="flex gap-2">
              <button 
                disabled={selectedIds.length === 0}
                onClick={handleBatchDownload}
                className="bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 px-6 h-12 rounded-2xl transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined font-black">download</span>
                <span className="text-sm font-black">批量存入相册</span>
              </button>
              <button 
                disabled={selectedIds.length === 0}
                onClick={() => setShowConfirmDelete(true)}
                className="bg-red-500 text-white size-12 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30 disabled:opacity-30"
              >
                <span className="material-symbols-outlined font-black">delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-charcoal/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-[3rem] p-10 text-center shadow-2xl border border-gray-100">
             <div className="size-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl font-black">delete_forever</span>
             </div>
             <h4 className="text-2xl font-black text-charcoal mb-3">确认要永久删除吗？</h4>
             <p className="text-gray-400 text-sm font-bold leading-relaxed mb-8">
               选中的 {selectedIds.length} 件作品将被从云端永久移除。<br/>
               <span className="text-orange-500">删除后将无法找回</span>，请确保您已经完成了保存操作。
             </p>
             <div className="flex flex-col gap-3">
               <button onClick={handleBatchDelete} className="w-full bg-red-500 text-white h-16 rounded-[1.5rem] font-black text-xl active:scale-95 shadow-xl shadow-red-500/20">
                 确认删除
               </button>
               <button onClick={() => setShowConfirmDelete(false)} className="w-full bg-gray-50 text-gray-400 h-16 rounded-[1.5rem] font-black text-xl active:scale-95">
                 我不删了
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
