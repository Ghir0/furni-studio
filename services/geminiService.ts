
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";

export interface ImageRef {
  data: string; // base64
  mimeType: string;
  description: string;
}

export class GeminiService {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  static async generateBrandContext(brandName: string, description: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a detailed architectural and furniture design system prompt for the brand "${brandName}". 
      Description: ${description}. 
      The prompt should define color palettes, materials (e.g., walnut, brushed steel), lighting style, and overall aesthetic "vibe". 
      Keep it concise but highly descriptive for an AI image generator.`
    });
    return response.text || "";
  }

  static async generateImage(
    prompt: string, 
    config: { aspectRatio: string; imageSize: string },
    productRefs: ImageRef[] = [],
    envRef?: { data: string; mimeType: string }
  ): Promise<string> {
    const ai = this.getAI();
    
    // Construct parts: Text prompt first, then references
    const parts: any[] = [{ text: prompt }];

    // Add Product References
    productRefs.forEach((ref, index) => {
      parts.push({
        inlineData: { data: ref.data, mimeType: ref.mimeType }
      });
      parts.push({ text: `Product view reference ${index + 1}: ${ref.description}` });
    });

    // Add Environment Reference
    if (envRef) {
      parts.push({
        inlineData: { data: envRef.data, mimeType: envRef.mimeType }
      });
      parts.push({ text: "Environment reference: Use this photo to guide the style, lighting, and atmosphere of the scene." });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        // @ts-ignore
        imageConfig: {
          aspectRatio: config.aspectRatio,
          imageSize: config.imageSize
        }
      }
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    return imageUrl;
  }

  static async editImage(baseImage: string, editPrompt: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } },
          { text: editPrompt }
        ]
      }
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    return imageUrl;
  }

  static async generateVideo(image: string, prompt: string): Promise<string> {
    const ai = this.getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: image.split(',')[1],
        mimeType: 'image/png'
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }
}

export function assembleFurniturePrompt(data: {
  brandStyle: string;
  dimensions?: { w: number; h: number; d: number };
  productText?: string;
  envText?: string;
  lighting?: string;
  hasProductRefs: boolean;
  hasEnvRef: boolean;
  models: any[];
  view?: string;
}): string {
  let p = `Professional furniture catalog rendering. ${data.brandStyle}. `;
  
  if (data.dimensions) {
    p += `Item dimensions: Width ${data.dimensions.w}cm, Height ${data.dimensions.h}cm, Depth ${data.dimensions.d}cm. Accurate proportions. `;
  }

  if (data.productText) {
    p += `Description: ${data.productText}. `;
  }

  if (data.hasProductRefs) {
    p += "Maintain strict visual consistency with the attached product reference images (materials, color, details). ";
  }

  if (data.lighting) {
    p += `Lighting setup: ${data.lighting}. `;
  }

  if (data.envText || data.hasEnvRef) {
    p += `Environment: ${data.envText || 'Match the attached environment reference scene'}. Reproduce lighting and atmospheric conditions precisely. `;
  }

  if (data.view) {
    p += `Camera view: ${data.view}. `;
  }

  if (data.models.length > 0) {
    data.models.forEach((m: any) => {
      p += `Include a ${m.gender} human model performing: ${m.interaction}. `;
    });
  }

  p += "High-end interior photography, architectural lighting, 8k resolution, photorealistic.";
  return p;
}
