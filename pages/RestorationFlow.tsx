
import React, { useState, useRef, useEffect } from 'react';
import { RestorationState, WorkItem } from '../types';
import { colorizeAndRestorePhoto, generateGuidanceSpeech, generateVideoFromPhoto } from '../services/geminiService';

interface RestorationFlowProps {
  mode: 'photo' | 'video';
  onClose: () => void;
  energy: number;
  onConsume: (amount: number) => boolean;
  onRefund: (amount: number) => void;
  onGoToBenefits: () => void;
  onSuccess: (work: WorkItem) => void;
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const RestorationFlow: React.FC<RestorationFlowProps> = ({ mode, onClose, energy, onConsume, onRefund, onGoToBenefits, onSuccess }) => {
  const [state, setState] = useState<RestorationState & { videoUrl?: string }>({
    step: 1,
    originalImage: null,
    restoredImage: null,
    isProcessing: false,
    videoUrl: undefined,
    aiAnalysis: ""
  });

  const [sliderPos, setSliderPos] = useState(50);
  const [showLowEnergy, setShowLowEnergy] = useState(false);
  const [showKeyRequest, setShowKeyRequest] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loadingText, setLoadingText] = useState("正在扫描照片细节...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const lastAudioRequestRef = useRef<number>(0);
  const pendingFileRef = useRef<{ base64: string; dataUrl: string } | null>(null);

  const COST = mode === 'photo' ? 2 : 5;

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  };

  const stopCurrentAudio = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch (e) {}
      currentSourceRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  const playGuidance = async (text: string) => {
    const requestId = Date.now();
    lastAudioRequestRef.current = requestId;
    stopCurrentAudio();

    try {
      const base64Audio = await generateGuidanceSpeech(text);
      if (lastAudioRequestRef.current !== requestId || !base64Audio) return;

      setIsPlayingAudio(true);
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();

      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentSourceRef.current = source;
      source.onended = () => {
        if (currentSourceRef.current === source) {
          setIsPlayingAudio(false);
          currentSourceRef.current = null;
        }
      };
      source.start();
    } catch (err) {
      console.error("Play guidance failed", err);
      setIsPlayingAudio(false);
    }
  };

  useEffect(() => {
    return () => stopCurrentAudio();
  }, []);

  const handleKeySelection = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
    }
    setShowKeyRequest(false);
    if (pendingFileRef.current) {
      const { base64, dataUrl } = pendingFileRef.current;
      await startRestorationProcess(base64, dataUrl);
      pendingFileRef.current = null;
    }
  };

  const startRestorationProcess = async (base64: string, dataUrl: string) => {
    const aistudio = (window as any).aistudio;
    const hasKey = aistudio && typeof aistudio.hasSelectedApiKey === 'function' ? await aistudio.hasSelectedApiKey() : true;
    
    if (!hasKey) {
      pendingFileRef.current = { base64, dataUrl };
      setShowKeyRequest(true);
      return;
    }

    setState(prev => ({ ...prev, originalImage: dataUrl, isProcessing: true }));
    onConsume(COST);
    
    if (mode === 'photo') {
      setLoadingText("正在精细重建光影...");
      try {
        const result = await colorizeAndRestorePhoto(base64);
        const newWork: WorkItem = {
          id: Date.now().toString(),
          type: 'photo',
          title: `高级修复于 ${new Date().toLocaleTimeString()}`,
          imageUrl: result.restoredImage || dataUrl,
          date: new Date().toLocaleDateString(),
          createdAt: Date.now()
        };
        setState(prev => ({ 
          ...prev, 
          step: 2, 
          isProcessing: false, 
          restoredImage: result.restoredImage, 
          aiAnalysis: result.analysis 
        }));
        playGuidance(result.analysis || "修复好了！您看这张照片是不是和记忆中一样清晰？");
        onSuccess(newWork);
      } catch (err: any) {
        handleApiError(err, base64, dataUrl);
      }
    } else {
      setLoadingText("正在唤醒时光记忆...");
      try {
        const videoUrl = await generateVideoFromPhoto(base64, (msg) => setLoadingText(msg));
        const newWork: WorkItem = {
          id: Date.now().toString(),
          type: 'video',
          title: `动态记忆于 ${new Date().toLocaleTimeString()}`,
          imageUrl: dataUrl,
          date: new Date().toLocaleDateString(),
          createdAt: Date.now()
        };
        setState(prev => ({ ...prev, step: 2, isProcessing: false, videoUrl: videoUrl, aiAnalysis: "瞧！照片里的人动起来了，那时多精神呀！" }));
        playGuidance("瞧！照片里的人动起来了，那时多精神呀！");
        onSuccess(newWork);
      } catch (err: any) {
        handleApiError(err, base64, dataUrl);
      }
    }
  };

  const handleApiError = (err: any, base64: string, dataUrl: string) => {
    console.error("Restoration Error:", err);
    if (err.message === "API_KEY_INVALID" || err.message?.includes("Requested entity was not found") || err.message?.includes("403") || err.message?.includes("400")) {
      // 如果 Key 无效，清除本地存储的 Key，给用户重新输入的机会
      localStorage.removeItem('GEMINI_API_KEY');
      pendingFileRef.current = { base64, dataUrl };
      setShowKeyRequest(true);
      // 积分退还逻辑
      onRefund(COST);
      setErrorMessage("积分已退还，请检查 API Key");
      setTimeout(() => setErrorMessage(null), 3000);
    } else {
      setLoadingText("服务连接稍微有点忙，请重试。");
      setErrorMessage(err.message || "服务繁忙，请稍后重试");
      // 积分退还逻辑
      onRefund(COST);
      setTimeout(() => setErrorMessage(null), 3000);
    }
    setState(prev => ({ ...prev, isProcessing: false }));
  };

  const handleSave = async () => {
    const url = mode === 'photo' ? (state.restoredImage || '') : (state.videoUrl || '');
    if (!url) return;
    
    const fileName = `好着呢_作品_${Date.now()}.${mode === 'photo' ? 'png' : 'mp4'}`;

    // 1. 尝试使用 Web Share API (移动端体验最佳)
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '好着呢 - 老照片修复',
          text: '这是我用“好着呢”修复的老照片，效果很棒！'
        });
        playGuidance("请在弹出的菜单中选择“保存图像”或分享给朋友。");
        return;
      }
    } catch (error) {
      console.warn("Web Share API failed, falling back to download");
    }

    // 2. 降级方案：传统的下载链接
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 3. 针对 iOS Safari 等无法自动下载的情况，给出语音提示
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
        playGuidance("如果无法自动保存，请长按上方的照片，选择“存储到“照片””");
    } else {
        playGuidance("作品正在保存，请查看您的下载目录或相册。");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (energy < COST) {
        setShowLowEnergy(true);
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const dataUrl = event.target?.result as string;
        await startRestorationProcess(base64, dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300 bg-[#F9FAFB]">
      <header className="flex items-center bg-white p-4 justify-between border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <button onClick={onClose} className="flex size-12 items-center justify-center cursor-pointer text-gray-400">
          <span className="material-symbols-outlined text-2xl font-black">arrow_back_ios_new</span>
        </button>
        <h2 className="text-xl font-black flex-1 text-center pr-12 font-display text-charcoal">
          {state.step === 1 ? (mode === 'photo' ? '高级物理修复' : '制作动态视频') : '修复成品'}
        </h2>
      </header>

      {state.step === 1 ? (
        <div className="p-8">
          <div className="mb-10">
             <div className="bg-primary/5 rounded-[2.5rem] p-8 border-2 border-primary/10 relative overflow-hidden min-h-[140px] flex flex-col justify-center">
               <div className="absolute top-0 right-0 p-4 opacity-10 -rotate-12">
                 <span className="material-symbols-outlined !text-8xl text-primary">{mode === 'photo' ? 'flare' : 'motion_photos_on'}</span>
               </div>
               <h3 className="text-2xl font-black text-primary mb-2 relative z-10">
                 {mode === 'photo' ? '高级模式已就绪' : '动态引擎已就绪'}
               </h3>
               <p className="text-gray-600 font-bold text-base leading-relaxed relative z-10">
                 {mode === 'photo' ? '通过物理光影技术为您找回最真实的色彩。' : '让静止的照片重现神采，一个微笑，重回当年。'}
               </p>
             </div>
          </div>

          <label className="flex flex-col items-center justify-center w-full aspect-square rounded-[3rem] border-4 border-dashed border-primary/20 bg-white shadow-2xl shadow-gray-200/50 cursor-pointer hover:border-primary transition-all active:scale-[0.98]">
            <div className="flex flex-col items-center gap-6">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/5 text-primary relative">
                <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping opacity-20"></div>
                <span className="material-symbols-outlined text-7xl font-light">
                  {mode === 'photo' ? 'image_search' : 'video_call'}
                </span>
              </div>
              <div className="text-center px-6">
                <p className="text-2xl font-black text-charcoal">{mode === 'photo' ? '点击上传老照片' : '上传照片变视频'}</p>
                <p className="text-primary font-black mt-3 animate-pulse text-sm">支持手机翻拍的老照片</p>
              </div>
            </div>
            <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
          </label>
        </div>
      ) : (
        <div className="flex flex-col flex-1 p-6 pb-24 overflow-y-auto no-scrollbar">
          <div className="w-full relative min-h-[380px] bg-white rounded-[2rem] shadow-xl overflow-hidden border-[6px] border-white mb-8">
            {mode === 'photo' ? (
              <>
                <img src={state.restoredImage || ''} alt="Restored" className="w-full h-full object-contain absolute inset-0 bg-gray-50" />
                <div className="absolute inset-0 z-10 pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                  <img src={state.originalImage || ''} alt="Original" className="w-full h-full object-contain" />
                </div>
                <div className="absolute inset-y-0 z-20 w-1 bg-white shadow-xl" style={{ left: `${sliderPos}%` }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-10 bg-primary rounded-full flex items-center justify-center border-4 border-white text-white">
                    <span className="material-symbols-outlined text-xl font-black">palette</span>
                  </div>
                </div>
                <input type="range" min="0" max="100" value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} className="absolute inset-0 opacity-0 z-30 cursor-ew-resize w-full h-full" />
              </>
            ) : (
              <video src={state.videoUrl} controls autoPlay loop className="w-full h-full object-contain bg-black" />
            )}
          </div>

          {/* AI 时光感言卡片 */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 mb-10 border border-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <span className="material-symbols-outlined !text-6xl text-primary">format_quote</span>
             </div>
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-primary font-black flex items-center gap-2">
                 <span className="material-symbols-outlined text-lg">auto_awesome</span>
                 时光寄语
               </h4>
               <button 
                onClick={() => playGuidance(state.aiAnalysis || "")}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-full transition-all ${isPlayingAudio ? 'bg-primary text-white scale-105' : 'bg-primary/5 text-primary'}`}
               >
                 <span className="material-symbols-outlined text-base font-black">{isPlayingAudio ? 'graphic_eq' : 'volume_up'}</span>
                 <span className="text-xs font-black">{isPlayingAudio ? '播报中' : '听听看'}</span>
               </button>
             </div>
             <p className="text-gray-600 font-bold leading-relaxed text-lg tracking-tight">
               {state.aiAnalysis || "岁月流金，那时的美好记忆依然在照片中闪光。"}
             </p>
          </div>

          <div className="flex flex-col gap-4">
            <button onClick={handleSave} className="w-full bg-primary text-white flex items-center justify-center gap-3 py-5 rounded-[1.5rem] shadow-xl shadow-primary/30 active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-3xl font-black">download</span>
              <span className="text-xl font-black">存入我的手机相册</span>
            </button>
            <button onClick={onClose} className="w-full bg-gray-100 text-gray-500 py-4 rounded-[1.5rem] font-black text-lg">返回首页</button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {state.isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full mx-6 flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="relative size-20 mb-6">
               <div className="absolute inset-0 rounded-full border-4 border-gray-100"></div>
               <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
               <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary text-3xl animate-pulse">
                 {mode === 'photo' ? 'brush' : 'movie_filter'}
               </span>
            </div>
            <h3 className="text-xl font-black text-charcoal mb-2">正在施展魔法</h3>
            <p className="text-gray-500 font-bold animate-pulse mb-4">{loadingText}</p>
            {/* Progress Bar */}
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-progress-indeterminate rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Low Energy Modal */}
      {showLowEnergy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full mx-6 flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="size-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl">bolt</span>
            </div>
            <h3 className="text-xl font-black text-charcoal mb-2">体力不足啦</h3>
            <p className="text-gray-500 font-bold mb-8">修复老照片需要消耗体力，去福利中心看看吧？</p>
            <div className="flex flex-col gap-3 w-full">
              <button onClick={onGoToBenefits} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/30">去领体力</button>
              <button onClick={() => setShowLowEnergy(false)} className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-black">稍后再说</button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Request Modal */}
      {showKeyRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full mx-6 flex flex-col items-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="size-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-3xl">key</span>
            </div>
            <h3 className="text-xl font-black text-charcoal mb-2">需要 API Key</h3>
            <p className="text-gray-500 font-bold mb-6 text-center text-sm">为了使用 AI 修复功能，请提供您的 Gemini API Key。</p>
            
            <input 
              type="text" 
              placeholder="输入 API Key (回车确认)" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim();
                  if (val) {
                     localStorage.setItem('GEMINI_API_KEY', val);
                     setShowKeyRequest(false);
                     if (pendingFileRef.current) {
                       const { base64, dataUrl } = pendingFileRef.current;
                       startRestorationProcess(base64, dataUrl);
                       pendingFileRef.current = null;
                     }
                  }
                }
              }}
            />
            <button onClick={() => setShowKeyRequest(false)} className="text-gray-400 font-bold text-sm">取消</button>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-6 py-3 rounded-full shadow-xl animate-in fade-in slide-in-from-top duration-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-400">error</span>
          <span className="font-bold text-sm">{errorMessage}</span>
        </div>
      )}

    </div>
  );
};

export default RestorationFlow;
