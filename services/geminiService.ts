import { GoogleGenAI, Chat, GenerateContentResponse, Content, Part } from "@google/genai";
import type { 
    ChatMessage, 
    Presentation, 
    ResumeAnalysis, 
    SWOTAnalysis, 
    Email, 
    JobDescription, 
    BlogPostIdea, 
    SentimentAnalysis, 
    MarketingPersona,
    MeetingSummary,
    RouteOptimizationResult
} from '../types';
import { MessageAuthor } from '../types';


// Ensure the API_KEY is available as an environment variable
const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API_KEY do Google GenAI não encontrada. Por favor, configure a variável de ambiente process.env.API_KEY.");
}

const ai = new GoogleGenAI({ apiKey });

// Helper to parse JSON from Gemini response, handling markdown fences
const parseJsonFromResponse = <T>(responseText: string): T => {
    let jsonStr = responseText.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
        jsonStr = match[1].trim();
    }
    try {
        return JSON.parse(jsonStr) as T;
    } catch (e) {
        console.error("Falha ao analisar a resposta JSON:", e);
        console.error("Texto da resposta original:", responseText);
        throw new Error("A resposta da IA não estava no formato JSON esperado.");
    }
};

const buildGeminiHistory = (messages: ChatMessage[]): Content[] => {
    return messages.map(msg => {
        const parts: Part[] = [{ text: msg.text }];
        if (msg.image) {
            parts.push({
                inlineData: {
                    mimeType: msg.image.mimeType,
                    data: msg.image.data,
                }
            });
        }
        return {
            role: msg.author === MessageAuthor.USER ? 'user' : 'model',
            parts: parts,
        };
    });
};

export function createChatSession(systemInstruction: string, history: ChatMessage[] = []): Chat {
    const filteredHistory = history.filter(m => (m.text && m.text.trim() !== '') || m.image);
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.8,
            topP: 0.95,
        },
        history: buildGeminiHistory(filteredHistory)
    });
}

export async function* sendMessageStream(
    chat: Chat, 
    message: string, 
    useGoogleSearch: boolean = false,
    image: { data: string; mimeType: string } | undefined,
    signal: AbortSignal
): AsyncGenerator<{ text?: string, sources?: {uri: string, title: string}[] }, void, unknown> {
    
    try {
        const messageParts: Part[] = [{ text: message }];
        if (image) {
            messageParts.push({
                inlineData: {
                    mimeType: image.mimeType,
                    data: image.data,
                },
            });
        }
        
        const config: any = {};
        if (useGoogleSearch) {
            config.tools = [{googleSearch: {}}];
        }

        const result = await chat.sendMessageStream({ message: messageParts, config });
        
        let finalResponse: GenerateContentResponse | null = null;
        for await (const chunk of result) {
            if (signal.aborted) {
                // Let the AbortError propagate naturally from the fetch call
                // and be caught by the calling component.
                throw new DOMException('Geração interrompida pelo usuário.', 'AbortError');
            }
            finalResponse = chunk;
            const text = chunk.text;
            if (text) {
                yield { text };
            }
        }
        
        const sources = finalResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks
            ?.map(chunk => chunk.web)
            .filter(web => web?.uri && web.title) as {uri: string, title: string}[];

        if (sources && sources.length > 0) {
            yield { sources };
        }
    } catch (error) {
        console.error("Erro na API do Gemini:", error);
        throw new Error("Falha ao comunicar com a API do Gemini. Verifique sua conexão e chave de API.");
    }
}

// Generic function for structured content generation
async function generateStructuredContent<T>(prompt: string, systemInstruction: string): Promise<T> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                temperature: 0.5,
            },
        });

        return parseJsonFromResponse<T>(response.text);
    } catch (error) {
        console.error("Erro na API do Gemini (conteúdo estruturado):", error);
        throw new Error("Falha ao gerar conteúdo estruturado com a API do Gemini.");
    }
}

// --- Tool-specific service functions ---

export function generatePresentation(prompt: string, systemInstruction: string): Promise<Presentation> {
    return generateStructuredContent<Presentation>(prompt, systemInstruction);
}

export function analyzeResume(prompt: string, systemInstruction: string): Promise<ResumeAnalysis> {
    return generateStructuredContent<ResumeAnalysis>(prompt, systemInstruction);
}

export function generateSwotAnalysis(prompt: string, systemInstruction: string): Promise<SWOTAnalysis> {
    return generateStructuredContent<SWOTAnalysis>(prompt, systemInstruction);
}

export function generateEmail(prompt: string, systemInstruction: string): Promise<Email> {
    return generateStructuredContent<Email>(prompt, systemInstruction);
}

export async function simplifyConcept(prompt: string, systemInstruction: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                temperature: 0.7,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Erro na API do Gemini (simplificar conceito):", error);
        throw new Error("Falha ao comunicar com a API do Gemini.");
    }
}

export function generateJobDescription(prompt: string, systemInstruction: string): Promise<JobDescription> {
    return generateStructuredContent<JobDescription>(prompt, systemInstruction);
}

export function generateBlogPostIdeas(prompt: string, systemInstruction: string): Promise<{ ideas: BlogPostIdea[] }> {
    return generateStructuredContent<{ ideas: BlogPostIdea[] }>(prompt, systemInstruction);
}

export function analyzeSentiment(prompt: string, systemInstruction: string): Promise<SentimentAnalysis> {
    return generateStructuredContent<SentimentAnalysis>(prompt, systemInstruction);
}

export function generatePersonas(prompt: string, systemInstruction: string): Promise<{ personas: MarketingPersona[] }> {
    return generateStructuredContent<{ personas: MarketingPersona[] }>(prompt, systemInstruction);
}

export function generateMeetingSummary(prompt: string, systemInstruction: string): Promise<MeetingSummary> {
    return generateStructuredContent<MeetingSummary>(prompt, systemInstruction);
}

export function generateRouteOptimization(prompt: string, systemInstruction: string): Promise<RouteOptimizationResult> {
    return generateStructuredContent<RouteOptimizationResult>(prompt, systemInstruction);
}

export async function generateImage(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("A IA não conseguiu gerar uma imagem.");
        }
    } catch (error) {
        console.error("Erro na API do Gemini (gerar imagem):", error);
        throw new Error("Falha ao gerar imagem com a API do Gemini.");
    }
}