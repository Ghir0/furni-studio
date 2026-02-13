
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
   * ADVANCED PROMPT ASSEMBLY LOGIC
   * Concatenates Brand Context + Dimensions + Product/Env References + Models + View
   */
  static assembleFurniturePrompt(data: {
    brandStyle: string;
    dimensions?: { w: number; h: number; d: number };
    productRefs: ProductReference[];
    productDesc?: string;
    envRef?: { url: string; description: string };
    lighting?: { type: string; custom?: string };
    models: HumanModel[];
    view?: string;
  }):string {
    let p = `[CONTEXT BRAND]: ${data.brandStyle}. `;
    
    if (data.dimensions) {
      p += `[TECHNICAL SPECS]: Precise physical dimensions - Width ${data.dimensions.w}cm, Height ${data.dimensions.h}cm, Depth ${data.dimensions.d}cm. Ensure the furniture respects these proportions within the space. `;
    }

    if (data.productDesc) {
      p += `[DESIGN FOCUS]: ${data.productDesc}. `;
    }

    if (data.productRefs.length > 0) {
      p += `[VISUAL ANCHORS]: Maintain absolute consistency with the uploaded images regarding silhouette, finishes, and materials. `;
      data.productRefs.forEach((ref, i) => {
        p += `Reference ${i+1}: ${ref.description}. `;
      });
    }

    if (data.envRef) {
      p += `[ENVIRONMENTAL INTEGRATION]: Place the furniture within the reference environment. ${data.envRef.description || 'Seamless integration into the provided scenario'}. `;
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
        p += `Human presence: ${m.gender === 'female' ? 'Female Model' : 'Male Model'} involved in: ${m.interaction}. The model must not obscure the key details of the furniture. `;
      });
    }

    p += "Output: Professional design catalog photography, controlled depth of field, hyper-detailed material textures, 8k resolution.";
    return p;
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
          parts.push({
            inlineData: {
              data: base64,
              mimeType: img.mimeType
            }
          });
        }
      }
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
}
