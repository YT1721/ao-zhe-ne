
import React from 'react';

interface HomeProps {
  onStartRestore: (mode: 'photo' | 'video') => void;
  energy: number;
}

const Home: React.FC<HomeProps> = ({ onStartRestore, energy }) => {
  return (
    <div className="animate-in fade-in duration-500 pb-10">
      {/* 沉浸式顶部 */}
      <header className="sticky top-0 z-50 bg-background-light/90 backdrop-blur-xl px-6 py-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="size-11 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20 rotate-3 transition-transform hover:rotate-0">
            <span className="material-symbols-outlined !text-2xl">image</span>
          </div>
          <div>
            <h1 className="text-charcoal text-2xl font-black tracking-tighter leading-none">好着呢</h1>
            <p className="text-[10px] text-primary/60 font-black mt-1 uppercase tracking-widest">Memory Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-2xl border-2 border-primary/5 flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-primary text-lg font-black animate-pulse">bolt</span>
            <span className="text-primary font-black text-base">{energy}</span>
          </div>
        </div>
      </header>

      {/* 情感化 Hero 区 */}
      <section className="px-6 pt-12 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-charcoal text-4xl font-black leading-tight tracking-tighter">
              上午好，<br/>
              <span className="text-primary">找回那段岁月</span>
            </h2>
            <p className="text-gray-400 text-lg mt-3 font-bold flex items-center gap-2">
              让记忆里的人，再次清晰可见
              <span className="material-symbols-outlined text-accent-warm text-sm">favorite</span>
            </p>
          </div>
        </div>
      </section>

      <div className="px-6 flex flex-col gap-8 mt-6">
        {/* 老照片修复 - 艺术化展示 */}
        <div 
          onClick={() => onStartRestore('photo')}
          className="group relative bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-gray-200/50 border border-white transition-all active:scale-[0.97]"
        >
          <div className="aspect-[16/10] w-full relative">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0PKETE8G5BMr5sXbJH6068xMKwWqvI2fuwaN0_Tp46JtYtefl6w6-q8V5gnlIxXti61UKZFFiYiAo5ZmfLEwxYG_guoKO-4UYN-wrZ3BlYBReA-l9vAI01QUTaJJUhkYCjM2ljyaOzsqfDjxT-EDLqil-_vbuYM-H4Zg8877YqOWweS6YxzR-NjYDVVZPTdtUQcBRMWwTmAsuOMMJEBA4OBRGyuiuybzVfCtFtfcRLsDty5-5d3W2avAkjXdEzZfh1NCOdbfKehcK" 
              className="w-full h-full object-cover grayscale opacity-80" 
              alt="Restoration" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
              <div>
                <span className="bg-accent-warm text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider mb-2 inline-block">物理精修</span>
                <h3 className="text-white text-3xl font-black">老照片修复</h3>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-white/80 mb-1">
                   <span className="material-symbols-outlined !text-sm">bolt</span>
                   <span className="text-sm font-black">2 点能量</span>
                </div>
                <div className="size-12 bg-white rounded-full flex items-center justify-center text-primary shadow-xl">
                  <span className="material-symbols-outlined font-black">arrow_forward</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 照片变视频 - 动态感展示 */}
        <div 
          onClick={() => onStartRestore('video')}
          className="group relative bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-gray-200/50 border border-white transition-all active:scale-[0.97]"
        >
          <div className="aspect-[16/10] w-full relative">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjY6_cQX4LYBGHLiD0u3rvAaE2YIBUTrzHWiL9qB823Ur_z_Is5GWT4ExqtxF17VpIIue57TXg5FyIC9S95O-tqxAUzLp05QWZ0s9ZRfXo_VKnCcJ1yDhb6pCVRnHgn3rdfNQrHbkGsygSykGc-oir7ua1b2j0guLczEi7APF-aH8uQgtR1zt0SLC-N0W6D8MHzb5cSEDVgnMMA1OHbL0aXdS-s16k_T7_0E2zqgECQvdd4LVRdlZuua4XvREQ5RICwr_E-zTZOAoy" 
              className="w-full h-full object-cover grayscale opacity-80" 
              alt="Video" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
              <div>
                <span className="bg-primary text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider mb-2 inline-block">动态还原</span>
                <h3 className="text-white text-3xl font-black">照片变视频</h3>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-white/80 mb-1">
                   <span className="material-symbols-outlined !text-sm">bolt</span>
                   <span className="text-sm font-black">5 点能量</span>
                </div>
                <div className="size-12 bg-white rounded-full flex items-center justify-center text-primary shadow-xl">
                  <span className="material-symbols-outlined font-black">play_arrow</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-gray-100/50 px-4 py-2 rounded-full border border-gray-100">
             <span className="material-symbols-outlined text-xs text-primary/40">favorite</span>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
               希望给您带来一丝暖意
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
