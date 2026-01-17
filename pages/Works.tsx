
import React from 'react';
import { WorkItem } from '../types';

const MOCK_WORKS: WorkItem[] = [
  // Added createdAt property to match WorkItem interface and prevent type errors
  { id: '1', type: 'photo', title: '1972年老家合影', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD02wFnjNYD4E92L66PnvdAW9aL9Aurxch9Omrh_Wo-hbHzTb_pUxG_1SWJS4xxYtFJ2aadbJUBkaK7bGMvdKFqQvbSUqJdcBVjNPCdJNLHFhTVQOc0us13ey2k57RyBt1s7on82949QC_haTCqbXEqbN9Xpj5KtGkYQN8N-N8uNwVtq7Ycvdbi_I1IKj1BXd-7nUQW3XyyvPGGEoflbl4qthRKT9yLwuTgAhTIhpcTzJp90ruJTXO_W8Nto9cN-3cZS3i-ewayIHM1', date: '2024-10-01', createdAt: Date.now() - (2 * 60 * 60 * 1000) },
  { id: '2', type: 'video', title: '年轻时的我', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDh7QJw4tj3C9ju4Qswc3mvGuSHtPnuw9pVUJw21AS1zXbEqdcwtvay21_OHG7K7jPpOovYDSD7FZlqAPNA2JN7mpAhbEBdd_kDDpbWNHkIl8fbh5jRjezebv-QGrgOR5iJkc0GzJzVO4VGASCZt227mSL4dlqaIgl7Xty1p8oA19TXa-0po4H2cm3ewSdZWu_Ambv67jJqknlmHfU49E8YXJpb5YGaB_QUn0IrBaA1v6O2MFoFDjyugjAcnnj1Alp3Z3O5aCEFiNBI', date: '2024-09-28', createdAt: Date.now() - (5 * 60 * 60 * 1000) },
  { id: '3', type: 'photo', title: '结婚纪念日', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCePPW9lJv891mr2DLWolAzZWZ_g4bL77R5dsqPyU4-vLkGFCXTv0ybuzadR_A8eMObhdBOnRyc6o116k-BMSU3SkUSk_XZycLD-fSlMEB_3BloPKeyCV-M_m1REq7sx-gAuNOXMSh01yvNRmsUw0DY1PW4sjHkMeX5H4nSaZWpBcqxef4YbNOaQe7SB6jTLR2z7nch_pZeTnhceHWJC8A2OzxfcgVzp3OI7E03CRU1s7kJgycIzfHym7WsKE4dy0Wh73uAsK8tnqB9', date: '2024-09-15', createdAt: Date.now() - (10 * 60 * 60 * 1000) },
  { id: '4', type: 'video', title: '全家福视频', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCkLQFMc7sPjHQu7RjkaNPwbniQMXReqGLwF1HMcITD9ykUYqowy1DsT-KjUP-S7cwqxfc3WHHMMARNVnFvua6lKMP4NZNhqDtwFNYpfm47CvtckS-Bu9mV-XtoGm7Hl6fdXrQHwJqVHWAdWpPzUHvD01K0Uy6RR5IiRCWZP0GN-zlnkVUbgk7voe7U95zrzxsDcVgbeg2SFDcYUNl3rC9krVWshCNrAIUrF2ZrSGginzTwL6xUIKqH73Q5eKlR9XvpDBNxJUl6Czd1', date: '2024-09-01', createdAt: Date.now() - (20 * 60 * 60 * 1000) },
];

const Works: React.FC = () => {
  return (
    <div className="animate-in fade-in duration-500 pb-12">
      <header className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <h1 className="text-text-main text-2xl font-bold tracking-tight">作品空间</h1>
        <button className="text-primary font-bold">批量整理</button>
      </header>

      <div className="px-6 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">我的珍贵记忆</h2>
          <span className="text-gray-400 text-sm">共 {MOCK_WORKS.length} 个作品</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {MOCK_WORKS.map((work) => (
            <div key={work.id} className="group relative flex flex-col gap-2 transition-transform active:scale-95">
              <div 
                className="bg-cover bg-center flex flex-col gap-3 rounded-2xl justify-end p-4 aspect-[4/5] shadow-sm overflow-hidden relative"
                style={{ backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 60%), url(${work.imageUrl})` }}
              >
                <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md p-1.5 rounded-lg border border-white/30">
                  <span className="material-symbols-outlined text-white text-xl">
                    {work.type === 'photo' ? 'auto_fix_high' : 'play_arrow'}
                  </span>
                </div>
                {work.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white/30 backdrop-blur-md size-12 rounded-full flex items-center justify-center border border-white/40">
                      <span className="material-symbols-outlined text-white text-3xl">play_arrow</span>
                    </div>
                  </div>
                )}
                <p className="text-white text-base font-bold leading-tight line-clamp-1">{work.title}</p>
              </div>
            </div>
          ))}
        </div>

        {MOCK_WORKS.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-20">inventory_2</span>
            <p className="text-lg">暂无作品，快去修复第一张照片吧</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Works;
