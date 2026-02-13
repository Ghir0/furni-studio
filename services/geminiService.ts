
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ProductReference, HumanModel } from "../types";

export class GeminiService {
  private static getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  /**
   * Genera il DNA del Brand
   */
  static async generateBrandContext(name: string, sector: string, market: string, description: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this company data and generate a refined, technical SYSTEM_PROMPT that defines the brand's visual and communicative DNA for future AI generations.
        Brand: ${name}
        Sector: ${sector}
        Market: ${market}
        Aesthetic Description: ${description}
        
        Return only the optimized system prompt, focused on materials, lighting, architectural style, and the "vibe" of the furniture design.`
    });
    return response.text || "";
  }

  /**
   * ANALISI SORGENTE: Chiede a Gemini di descrivere l'immagine per bloccare la coerenza
   */
  static async describeImage(imageUrl: string): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: imageUrl.split(',')[1], mimeType: 'image/png' } },
          { text: "Describe this piece of furniture and its environment in extreme technical detail. Focus on: exact materials, textures (matte/glossy), leg shape, fabric weave, hardware details, and lighting conditions. This description will be used to ensure 100% consistency in future renders. Be concise but hyper-specific." }
        ]
      }
    });
    return response.text || "";
  }

  /**
   * ADVANCED PROMPT ASSEMBLY LOGIC v2.4
   */
  static assembleFurniturePrompt(data: {
    brandStyle: string;
    dimensions?: { w: number; h: number; d: number };
    productRefs: ProductReference[];
    productDesc?: string;
    visualAnalysis?: string; // Descrizione tecnica ottenuta dall'analisi
    envRef?: { url: string; description: string };
    lighting?: { type: string; custom?: string };
    models: HumanModel[];
    view?: string;
  }): string {
    let p = `[CONTEXT BRAND]: ${data.brandStyle}. `;
    
    if (data.visualAnalysis) {
      p += `[VISUAL DNA ANCHOR]: ${data.visualAnalysis}. `;
    }

    if (data.dimensions) {
      p += `[TECHNICAL SPECS]: Precise physical dimensions - Width ${data.dimensions.w}cm, Height ${data.dimensions.h}cm, Depth ${data.dimensions.d}cm. Ensure the furniture respects these proportions. `;
    }

    if (data.productDesc) {
      p += `[DESIGN FOCUS]: ${data.productDesc}. `;
    }

    if (data.productRefs.length > 0 && !data.visualAnalysis) {
      p += `[VISUAL ANCHORS]: Maintain absolute consistency with the silhouettes and finishes in the uploaded images. `;
    }

    if (data.envRef) {
      p += `[ENVIRONMENTAL INTEGRATION]: ${data.envRef.description || 'Seamless integration into the provided scenario'}. `;
    }

    if (data.lighting) {
      const lightDesc = data.lighting.type === 'Custom' ? data.lighting.custom : data.lighting.type;
      p += `[LIGHTING ENGINE]: Lighting setup ${lightDesc}. Photorealistic rendering with high dynamic range. `;
    }

    if (data.view) {
      p += `[CINEMATOGRAPHY]: Framing/Shot ${data.view}. `;
    }

    if (data.models.length > 0) {
      p += `[LIFESTYLE ELEMENTS]: `;
      data.models.forEach((m) => {
        p += `Human presence: ${m.gender === 'female' ? 'Female Model' : 'Male Model'} involved in: ${m.interaction}. Do not obscure furniture details. `;
      });
    }

    p += "Output: Professional design catalog photography, 8k resolution, hyper-detailed textures.";
    return p;
  }

  /**
   * CONSISTENCY PROMPT con Visual Analysis
   */
  static assembleConsistencyPrompt(targetView: string, brandStyle: string, visualAnalysis: string): string {
    return `[PRODUCT CONSISTENCY MANDATE]: You are generating an alternative camera angle of the EXACT same furniture piece.
    [TECHNICAL DESCRIPTION]: ${visualAnalysis}.
    [BRAND STYLE]: ${brandStyle}.
    [ACTION]: Change the camera viewpoint to a "${targetView}" shot. 
    - MANDATORY: Keep every single texture, material, and geometric detail identical. 
    - MANDATORY: Keep the lighting and background architectural details consistent.`;
  }

  /**
   * RESIZE PROMPT
   */
  static assembleResizePrompt(brandStyle: string, ratio: string): string {
    return `[ASPECT RATIO ADAPTATION]: Re-render the exact same scene but adapt it to ratio: ${ratio}. 
    MANDATORY: Identical furniture and environment. Context: ${brandStyle}.`;
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

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    return imageUrl;
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

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    return imageUrl;
  }
}
