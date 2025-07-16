import type { ReactNode } from 'react';

export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
  image?: {
    data: string; // base64 encoded image data
    mimeType: string;
  };
  sources?: {
    uri: string;
    title: string;
  }[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  icon: ReactNode;
  welcomeMessage: string;
  useGoogleSearch?: boolean;
  promptSuggestions?: string[];
  isTool?: boolean;
  isCustom?: boolean;
}

export enum ToastType {
    SUCCESS = 'success',
    ERROR = 'error',
    INFO = 'info',
}

export interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}

export interface Slide {
    title: string;
    content: string[];
    speakerNotes: string;
}

export interface Presentation {
    title: string;
    slides: Slide[];
}

export interface ResumeAnalysis {
    score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    interviewQuestions: string[];
}

export interface SWOTAnalysis {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
}

export interface Email {
    subject: string;
    body: string;
}

export interface JobDescription {
    summary: string;
    responsibilities: string[];
    qualifications: string[];
    benefits: string[];
}

export interface BlogPostIdea {
    title: string;
    hook: string;
    outline: string[];
    seoKeywords: string[];
}

export interface SentimentKeyword {
    word: string;
    influence: 'positivo' | 'negativo' | 'neutro';
}

export interface SentimentAnalysis {
    sentiment: 'Positivo' | 'Negativo' | 'Neutro';
    score: number;
    justification: string;
    keywords: SentimentKeyword[];
}

export interface MarketingPersona {
    name: string;
    demographics: string;
    goals: string[];
    frustrations: string[];
    userJourney: string;
}

export interface MeetingSummary {
    summary: string;
    actionItems: { task: string; owner: string; }[];
    followUpEmail: {
        subject: string;
        body: string;
    };
}

export interface RouteOptimizationResult {
    optimizedRoute: string[];
    notes: string;
}

// --- Auth Types ---
export interface User {
    id: string;
    email: string;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}


// --- Workflow Types ---
export enum WorkflowStepStatus {
    PENDING = 'pending',
    RUNNING = 'running',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

export interface WorkflowStep {
    id: string;
    name: string;
    status: WorkflowStepStatus;
    result: any | null;
    error: string | null;
}

export interface WorkflowResult {
    swot?: SWOTAnalysis;
    personas?: MarketingPersona[];
    blogIdeas?: { ideas: BlogPostIdea[] };
}
