
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ProductReference, HumanModel } from "../types";

export class GeminiService {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  static async generateBrandContext(name: string, sector: string, market: string, description: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this furniture company data and generate a hyper-technical, architectural SYSTEM_PROMPT.
        Brand: ${name}
        Sector: ${sector}
        Market: ${market}
        Style: ${description}
        
        The prompt must define:
        1. Material DNA (e.g., 'open-pore oak', 'brushed brass', '700gsm bouclé').
        2. Lighting Philosophy (e.g., 'soft global illumination with 45-degree key lights').
        3. Scene Composition (e.g., 'minimalist Italian showroom with concrete floors').
        Return ONLY the optimized system prompt.`
    });
    return response.text || "";
  }

  static async describeImage(imageUrl: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: imageUrl.split(',')[1], mimeType: 'image/png' } },
          { text: "Act as a technical product designer. Describe ONLY the physical characteristics of the furniture piece shown: exact silhouette, structural materials, joint details, and upholstery texture. DO NOT describe the camera angle, the lighting setup, or the current perspective. Focus on the object's DNA so it can be reconstructed from any angle." }
        ]
      }
    });
    return response.text || "";
  }

  static assembleFurniturePrompt(data: {
    brandStyle: string;
    dimensions?: { w: number; h: number; d: number };
    productRefs: ProductReference[];
    productDesc?: string;
    visualAnalysis?: string;
    envRef?: { url: string; description: string };
    lighting?: { type: string; custom?: string };
    models: HumanModel[];
    view?: string;
  }): string {
    let p = `[BRAND_STYLE]: ${data.brandStyle}. `;
    
    if (data.visualAnalysis) {
      p += `[PRODUCT_DNA]: ${data.visualAnalysis}. `;
    }

    if (data.dimensions) {
      p += `[TECHNICAL_PROPORTIONS]: Width ${data.dimensions.w}cm, Height ${data.dimensions.h}cm, Depth ${data.dimensions.d}cm. `;
    }

    if (data.productDesc) {
      p += `[DESIGN_DETAILS]: ${data.productDesc}. `;
    }

    if (data.envRef) {
      p += `[ENVIRONMENT]: ${data.envRef.description || 'Professional architectural background'}. `;
    }

    if (data.lighting) {
      const lightDesc = data.lighting.type === 'Custom' ? data.lighting.custom : data.lighting.type;
      p += `[LIGHTING_ENGINE]: ${lightDesc} studio lighting setup. `;
    }

    if (data.view) {
      p += `[CAMERA_ANGLE]: Architectural photography from a ${data.view} perspective. `;
    }

    if (data.models.length > 0) {
      p += `[LIFESTYLE]: Add ${data.models.map(m => `${m.gender} model ${m.interaction}`).join(', ')}. Keep focus on furniture. `;
    }

    p += "Output: Photorealistic 8k CGI render, sharp focus, magazine quality.";
    return p;
  }

  static assembleConsistencyPrompt(targetView: string, brandStyle: string, visualAnalysis: string): string {
    return `Generate a NEW render of the same furniture item. 
    [IDENTITY]: ${visualAnalysis}. 
    [BRAND_CONTEXT]: ${brandStyle}. 
    [PERSPECTIVE_SHIFT]: Render the scene from a ${targetView} camera angle. 
    MANDATORY: Keep materials and design details identical, but the view MUST be different from the source. Environment must adapt to the new angle.`;
  }

  static async generateImage(
    prompt: string, 
    config: { aspectRatio: string; imageSize: string },
    images?: { url: string; mimeType: string }[]
  ): Promise<string> {
    const ai = this.getAI();
    const parts: any[] = [{ text: prompt }];
    
    if (images) {
      for (const img of images) {
        const base64 = img.url.split(',')[1];
        if (base64) {
          parts.push({ inlineData: { data: base64, mimeType: img.mimeType } });
        }
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        // @ts-ignore
        imageConfig: { aspectRatio: config.aspectRatio, imageSize: config.imageSize }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from model");
  }

  static async editImage(baseImage: string, editPrompt: string, config?: { aspectRatio: string }): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: baseImage.split(',')[1], mimeType: 'image/png' } },
          { text: editPrompt }
        ]
      },
      config: config ? {
        // @ts-ignore
        imageConfig: { aspectRatio: config.aspectRatio }
      } : undefined
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from edit model");
  }
}
