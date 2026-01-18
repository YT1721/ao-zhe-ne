
import { GoogleGenAI, Modality } from "@google/genai";

const getAIClient = () => {
  let apiKey = localStorage.getItem('GEMINI_API_KEY');
  const envKey = import.meta.env.VITE_API_KEY;

  // 如果本地存储的是占位符或空，则清除并尝试使用环境变量
  if (apiKey === 'PLACEHOLDER_API_KEY' || !apiKey) {
    localStorage.removeItem('GEMINI_API_KEY');
    apiKey = null;
  }

  // 优先使用 LocalStorage，其次使用环境变量
  const finalKey = apiKey || envKey || "";
  
  if (!finalKey) {
    console.warn("Gemini API Key is missing!");
  } else {
    // 仅在开发环境打印，方便调试（生产环境请移除）
    if (import.meta.env.DEV) {
      console.log(`Using API Key from: ${apiKey ? 'LocalStorage' : 'Env'} (${finalKey.substring(0, 5)}...)`);
    }
  }

  return new GoogleGenAI({ 
    apiKey: finalKey, 
    httpOptions: { 
      baseUrl: `${window.location.origin}/gemini-api` 
    } 
  });
};

/**
 * 使用 Gemini 3 Pro 进行物理修复并生成温情描述
 */
export const colorizeAndRestorePhoto = async (base64Image: string) => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: "这是一项极高要求的历史影像修复任务。请完成以下两个步骤：\n1. 【图像修复】：精准消除照片折痕、污迹，进行高保真自然上色，严禁改变人物特征，返回高清图像。\n2. 【情感感言】：请仔细观察这张照片的内容（人物神态、场景、服饰等），写一段 50 字以内、极其温暖、感性的短评，用‘我’的语气（仿佛是老友或是照片的守护者），描述照片中展现的珍贵情感。请将这段话放在返回结果的文字部分。" }
        ]
      },
      config: {
        imageConfig: {
          imageSize: "1K",
          aspectRatio: "1:1"
        }
      }
    });

    let restoredImageBase64 = null;
    let analysisText = "岁月流金，这张照片里的记忆依然鲜活。";

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        restoredImageBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        analysisText = part.text;
      }
    }

    if (!restoredImageBase64) throw new Error("未能生成修复后的图像");

    return { restoredImage: restoredImageBase64, analysis: analysisText };
  } catch (error: any) {
    console.error("AI Restoration failed", error);
    throw error;
  }
};

export const generateVideoFromPhoto = async (base64Image: string, onProgress?: (msg: string) => void) => {
  const ai = getAIClient();
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: '让照片中的人物微微点头微笑，神态自然亲切，画面柔和有电影感',
      image: { imageBytes: base64Image, mimeType: 'image/jpeg' },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });

    onProgress?.("正在开启时光通道...");

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      onProgress?.("回忆正在苏醒...");
    }

    // 增加对 result 字段的检查，因为有时 API 可能会返回 result 而不是 generatedVideos
    // @ts-ignore
    let downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri || operation.result?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      console.error("Video Generation Operation Result (Full):", JSON.stringify(operation, null, 2));

      // 1. 检查是否因安全原因被拦截
      // @ts-ignore
      const finishReason = operation.result?.error?.code || operation.error?.code;
      if (finishReason === 400 || finishReason === "400") {
         throw new Error("视频生成失败：请求参数有误或图片无法识别");
      }
      
      // @ts-ignore
      // 检查具体的拦截原因（如果 API 返回了相关字段）
      // Google Veo 模型有时会因为“人物一致性”或“Deepfake 预防”策略静默失败
      
      throw new Error("AI 模型拒绝了请求（可能触发了人脸安全策略）。请尝试换一张不包含清晰人脸的照片测试，或者稍后再试。");
    }

    const apiKey = localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_API_KEY || "";
    
    // 使用代理路径替换原始 Google 域名，解决国内访问问题
    // 原始: https://generativelanguage.googleapis.com/v1beta/files/xxx
    // 代理: https://www.laozhaopian.xin/gemini-api/v1beta/files/xxx
    // 兼容所有 Google 域名（如 storage.googleapis.com 等），只要是通过 gemini-api 转发的
    let proxyUrl = downloadLink;
    if (downloadLink.includes('googleapis.com')) {
       // 提取路径部分，例如 /v1beta/files/xxx
       const urlObj = new URL(downloadLink);
       proxyUrl = `${window.location.origin}/gemini-api${urlObj.pathname}${urlObj.search}`;
    }
    
    const separator = proxyUrl.includes('?') ? '&' : '?';
    const response = await fetch(`${proxyUrl}${separator}key=${apiKey}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Video fetch failed:", response.status, errorText);
      throw new Error(`Video download failed: ${response.status}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error: any) {
    console.error("Video Generation failed", error);
    throw error;
  }
};

export const generateGuidanceSpeech = async (text: string) => {
  const ai = getAIClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `用非常亲切、温暖、慢节奏的长辈口吻说：${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    return null;
  }
};
