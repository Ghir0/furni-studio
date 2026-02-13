
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ProductReference, HumanModel } from "../types";

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

  /**
   * ADVANCED PROMPT ASSEMBLY LOGIC
   * Concatenates Brand Context + Dimensions + References + Models + View
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
  }): string {
    let p = `[ESTETICA BRAND]: ${data.brandStyle}. `;
    
    if (data.dimensions) {
      p += `[DIMENSIONI]: Larghezza ${data.dimensions.w}cm, Altezza ${data.dimensions.h}cm, Profondità ${data.dimensions.d}cm. Mantieni proporzioni fotorealistiche. `;
    }

    if (data.productDesc) {
      p += `[DESCRIZIONE PRODOTTO]: ${data.productDesc}. `;
    }

    if (data.productRefs.length > 0) {
      p += `[REFERENCE VISIVE PRODOTTO]: Utilizza le immagini fornite come riferimento primario per design, materiali e finiture. `;
      data.productRefs.forEach((ref, i) => {
        p += `Immagine ${i+1}: ${ref.description}. `;
      });
    }

    if (data.envRef) {
      p += `[AMBIENTE]: Usa l'immagine di riferimento ambientale fornita. ${data.envRef.description || 'Ambiente integrato perfettamente'}. `;
    }

    if (data.lighting) {
      const lightDesc = data.lighting.type === 'Custom' ? data.lighting.custom : data.lighting.type;
      p += `[ILLUMINAZIONE]: Setup ${lightDesc}. Resa High-end catalog. `;
    }

    if (data.view) {
      p += `[INQUADRATURA]: Vista ${data.view}. `;
    }

    if (data.models.length > 0) {
      p += `[MODELLI UMANI]: `;
      data.models.forEach((m) => {
        p += `Un modello ${m.gender === 'female' ? 'Donna' : 'Uomo'} impegnato in: ${m.interaction}. `;
      });
    }

    p += "Rendering professionale per catalogo arredamento di lusso, 8k, Octane Render style, massima fedeltà materica.";
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
