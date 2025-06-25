import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { analyzeSelfReflections } from "./gemini";
import { 
  insertReflectionSchema,
  insertAnalysisSchema,
  insertFinalLearningsSchema,
  type InsertReflection,
  type InsertAnalysis,
  type InsertFinalLearning
} from "@shared/schema";

// Question data
const QUESTIONS = [
  {
    id: 1,
    theme: "Identity / Roots",
    icon: "seedling",
    color: "blue",
    prompt: "Describe a background, interest, or talent that has deeply shaped who you are today. Why is it significant to you?",
    guide: "Reflect on something that's been with you for a long time — a family tradition, a personal passion, or an experience that defines your roots. What role does it play in how you think or behave today?"
  },
  {
    id: 2,
    theme: "Challenge / Failure",
    icon: "mountain",
    color: "orange",
    prompt: "Talk about a meaningful failure or challenge you've faced. What did it teach you about yourself?",
    guide: "Don't focus on the mistake itself, but how it changed your thinking. Show vulnerability, growth, and the lessons you wouldn't have learned otherwise."
  },
  {
    id: 3,
    theme: "Questioning Beliefs",
    icon: "question-circle",
    color: "purple",
    prompt: "Describe a time you seriously questioned a belief or assumption you once held. What changed inside you?",
    guide: "Reflect on how you handled discomfort, confrontation, or change. What did the shift reveal about you?"
  },
  {
    id: 4,
    theme: "Experiencing Gratitude",
    icon: "heart",
    color: "emerald",
    prompt: "Reflect on a person or moment that made you feel truly grateful. How did it shape your perspective or behavior?",
    guide: "Go beyond just saying 'thank you.' Explore why that moment/person mattered, what values it revealed in you, and how it still affects your actions."
  },
  {
    id: 5,
    theme: "Personal Growth",
    icon: "arrow-trend-up",
    color: "teal",
    prompt: "What event or realization made you aware of something deep about yourself? How did it change how you live or think?",
    guide: "Talk about a turning point — a time when you discovered a part of yourself you hadn't fully seen before."
  },
  {
    id: 6,
    theme: "Passion / Flow",
    icon: "fire",
    color: "red",
    prompt: "Describe an activity or topic that completely absorbs you — something you do where time disappears. What do you think this says about who you are?",
    guide: "What lights you up? What kind of problems do you enjoy solving?"
  },
  {
    id: 7,
    theme: "Community / Belonging",
    icon: "users",
    color: "indigo",
    prompt: "Talk about a community or group you feel strongly connected to. What role does it play in your life?",
    guide: "How have you contributed or been shaped by others? What does belonging mean to you?"
  },
  {
    id: 8,
    theme: "Ethical Courage",
    icon: "shield-check",
    color: "violet",
    prompt: "Describe a time you stood up for someone or something important, even when it was difficult. What did you learn about your inner strength?",
    guide: "Reflect on fear, doubt, and what gave you the courage to act anyway."
  },
  {
    id: 9,
    theme: "Influences",
    icon: "user-group",
    color: "cyan",
    prompt: "Who has had a significant influence on how you think or live? What's the most important lesson they taught you?",
    guide: "Pick someone real. What did their presence reveal about you?"
  },
  {
    id: 10,
    theme: "Open / Creative Self",
    icon: "sparkles",
    color: "pink",
    prompt: "What's something unusual, surprising, or creative that really matters to you — and what does it reveal about your personality?",
    guide: "Think about a strange obsession, talent, or worldview you have. What makes it yours, and why do you treasure it?"
  }
];

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Questions routes
  app.get('/api/questions', isAuthenticated, async (req, res) => {
    res.json(QUESTIONS);
  });

  app.get('/api/questions/:id', isAuthenticated, async (req, res) => {
    const questionId = parseInt(req.params.id);
    const question = QUESTIONS.find(q => q.id === questionId);
    
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    res.json(question);
  });

  // Reflections routes
  app.get('/api/reflections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reflections = await storage.getUserReflections(userId);
      res.json(reflections);
    } catch (error) {
      console.error("Error fetching reflections:", error);
      res.status(500).json({ message: "Failed to fetch reflections" });
    }
  });

  app.get('/api/reflections/:questionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const questionId = parseInt(req.params.questionId);
      const reflection = await storage.getReflection(userId, questionId);
      res.json(reflection);
    } catch (error) {
      console.error("Error fetching reflection:", error);
      res.status(500).json({ message: "Failed to fetch reflection" });
    }
  });

  app.post('/api/reflections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reflectionData = insertReflectionSchema.parse({
        ...req.body,
        userId
      });
      
      const reflection = await storage.upsertReflection(reflectionData);
      res.json(reflection);
    } catch (error) {
      console.error("Error saving reflection:", error);
      res.status(500).json({ message: "Failed to save reflection" });
    }
  });

  // AI Analysis routes
  app.get('/api/analysis', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const analysis = await storage.getUserAnalysis(userId);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  app.post('/api/analysis/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get all user reflections
      const reflections = await storage.getUserReflections(userId);
      const reflectionTexts = reflections
        .filter(r => r.userResponse && r.userResponse.trim().length > 0)
        .map(r => r.userResponse!);
      
      if (reflectionTexts.length === 0) {
        return res.status(400).json({ message: "No reflections available for analysis" });
      }

      // Generate AI analysis
      const discoveries = await analyzeSelfReflections(reflectionTexts);
      
      // Save analysis
      const analysisData: InsertAnalysis = {
        userId,
        selfDiscoveries: discoveries
      };
      
      const analysis = await storage.saveAnalysis(analysisData);
      res.json(analysis);
    } catch (error) {
      console.error("Error generating analysis:", error);
      res.status(500).json({ message: "Failed to generate analysis" });
    }
  });

  // Final learnings routes
  app.get('/api/final-learnings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const learnings = await storage.getFinalLearnings(userId);
      res.json(learnings);
    } catch (error) {
      console.error("Error fetching final learnings:", error);
      res.status(500).json({ message: "Failed to fetch final learnings" });
    }
  });

  app.post('/api/final-learnings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const learningsData = insertFinalLearningsSchema.parse({
        ...req.body,
        userId
      });
      
      const learnings = await storage.saveFinalLearnings(learningsData);
      res.json(learnings);
    } catch (error) {
      console.error("Error saving final learnings:", error);
      res.status(500).json({ message: "Failed to save final learnings" });
    }
  });

  // Progress route
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reflections = await storage.getUserReflections(userId);
      const completedCount = reflections.filter(r => r.userResponse && r.userResponse.trim().length > 0).length;
      const totalQuestions = QUESTIONS.length;
      
      const progress = {
        completed: completedCount,
        total: totalQuestions,
        percentage: Math.round((completedCount / totalQuestions) * 100)
      };
      
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
