
import { GoogleGenAI, Modality } from "@google/genai";

const getAIClient = () => {
  const apiKey = localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_API_KEY || "";
  return new GoogleGenAI({ apiKey, httpOptions: { baseUrl: "/gemini-api" } });
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

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const apiKey = localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_API_KEY || "";
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
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
