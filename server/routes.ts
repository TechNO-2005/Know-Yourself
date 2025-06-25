import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword, comparePassword } from "./auth";
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
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, password, email, firstName, lastName } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      const user = await storage.createUser({
        id: userId,
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName,
      });

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;

      res.json({ id: user.id, username: user.username, email: user.email });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Find user and verify password
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePassword(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      req.session.userId = user.id;
      req.session.username = user.username;

      res.json({ id: user.id, username: user.username, email: user.email });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Don't send password hash
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Questions routes (public access for landing page)
  app.get('/api/questions', async (req, res) => {
    const questions = [
      {
        id: 1,
        theme: "Identity / Roots",
        icon: "🌱",
        color: "from-emerald-500 to-teal-600",
        prompt: "Who are you when no one is watching? Describe your truest self.",
        guide: "Think about your core values, what drives you, and the person you are in private moments."
      },
      {
        id: 2,
        theme: "Challenge / Growth",
        icon: "⛰️",
        color: "from-orange-500 to-red-600",
        prompt: "Tell us about a time you failed at something important and what you learned.",
        guide: "Focus on resilience, growth mindset, and how challenges shaped your character."
      },
      {
        id: 3,
        theme: "Values / Beliefs",
        icon: "💎",
        color: "from-blue-500 to-indigo-600",
        prompt: "What principle or belief would you never compromise on, and why?",
        guide: "Explore your moral compass and what fundamentally guides your decisions."
      },
      {
        id: 4,
        theme: "Gratitude / Appreciation",
        icon: "🙏",
        color: "from-pink-500 to-rose-600",
        prompt: "What are you most grateful for that others might take for granted?",
        guide: "Reflect on unique aspects of your life, relationships, or opportunities."
      },
      {
        id: 5,
        theme: "Problem-solving",
        icon: "🧩",
        color: "from-purple-500 to-violet-600",
        prompt: "Describe a complex problem you solved and your thought process.",
        guide: "Showcase analytical thinking, creativity, and persistence in problem-solving."
      },
      {
        id: 6,
        theme: "Learning / Curiosity",
        icon: "📚",
        color: "from-cyan-500 to-blue-600",
        prompt: "What's something you taught yourself, and why did it matter to you?",
        guide: "Demonstrate intellectual curiosity and self-directed learning abilities."
      },
      {
        id: 7,
        theme: "Community / Impact",
        icon: "🤝",
        color: "from-green-500 to-emerald-600",
        prompt: "How have you contributed to your community or helped others grow?",
        guide: "Show leadership, empathy, and commitment to making a positive difference."
      },
      {
        id: 8,
        theme: "Intellectual Curiosity",
        icon: "🔬",
        color: "from-indigo-500 to-purple-600",
        prompt: "What question keeps you up at night, and how are you exploring it?",
        guide: "Reveal your intellectual passions and commitment to deeper understanding."
      },
      {
        id: 9,
        theme: "Meaningful Moments",
        icon: "✨",
        color: "from-yellow-500 to-orange-600",
        prompt: "Describe a moment that changed your perspective on life.",
        guide: "Share transformative experiences and personal growth moments."
      },
      {
        id: 10,
        theme: "Future Vision",
        icon: "🚀",
        color: "from-violet-500 to-purple-600",
        prompt: "Where do you see yourself in 10 years, and what steps are you taking now?",
        guide: "Demonstrate goal-setting, planning, and commitment to personal development."
      }
    ];
    res.json(questions);
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
      const userId = req.session.userId;
      const reflections = await storage.getUserReflections(userId);
      res.json(reflections);
    } catch (error) {
      console.error("Error fetching reflections:", error);
      res.status(500).json({ message: "Failed to fetch reflections" });
    }
  });

  app.get('/api/reflections/:questionId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
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
      const userId = req.session.userId;
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
      const userId = req.session.userId;
      const analysis = await storage.getUserAnalysis(userId);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  app.post('/api/analysis/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      
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
    } catch (error: any) {
      console.error("Error generating analysis:", error);
      
      if (error.message.includes('No completed reflections')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Failed to generate analysis" });
    }
  });

  // Final learnings routes
  app.get('/api/final-learnings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const learnings = await storage.getFinalLearnings(userId);
      res.json(learnings);
    } catch (error) {
      console.error("Error fetching final learnings:", error);
      res.status(500).json({ message: "Failed to fetch final learnings" });
    }
  });

  app.post('/api/final-learnings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session.userId;
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
      const userId = req.session.userId;
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
