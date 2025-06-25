import {
  users,
  reflections,
  analysis,
  finalLearnings,
  type User,
  type UpsertUser,
  type Reflection,
  type InsertReflection,
  type Analysis,
  type InsertAnalysis,
  type FinalLearning,
  type InsertFinalLearning,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations 
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Reflection operations
  getUserReflections(userId: string): Promise<Reflection[]>;
  getReflection(userId: string, questionId: number): Promise<Reflection | undefined>;
  upsertReflection(reflection: InsertReflection): Promise<Reflection>;
  
  // Analysis operations
  getUserAnalysis(userId: string): Promise<Analysis | undefined>;
  saveAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  
  // Final learnings operations
  getFinalLearnings(userId: string): Promise<FinalLearning | undefined>;
  saveFinalLearnings(learnings: InsertFinalLearning): Promise<FinalLearning>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Reflection operations
  async getUserReflections(userId: string): Promise<Reflection[]> {
    return await db
      .select()
      .from(reflections)
      .where(eq(reflections.userId, userId))
      .orderBy(reflections.questionId);
  }

  async getReflection(userId: string, questionId: number): Promise<Reflection | undefined> {
    const [reflection] = await db
      .select()
      .from(reflections)
      .where(and(eq(reflections.userId, userId), eq(reflections.questionId, questionId)));
    return reflection;
  }

  async upsertReflection(reflectionData: InsertReflection): Promise<Reflection> {
    const existingReflection = await this.getReflection(reflectionData.userId, reflectionData.questionId);
    
    if (existingReflection) {
      const [updatedReflection] = await db
        .update(reflections)
        .set({
          userResponse: reflectionData.userResponse,
          updatedAt: new Date(),
        })
        .where(and(
          eq(reflections.userId, reflectionData.userId),
          eq(reflections.questionId, reflectionData.questionId)
        ))
        .returning();
      return updatedReflection;
    } else {
      const [newReflection] = await db
        .insert(reflections)
        .values(reflectionData)
        .returning();
      return newReflection;
    }
  }

  // Analysis operations
  async getUserAnalysis(userId: string): Promise<Analysis | undefined> {
    const [userAnalysis] = await db
      .select()
      .from(analysis)
      .where(eq(analysis.userId, userId))
      .orderBy(analysis.analysisTimestamp)
      .limit(1);
    return userAnalysis;
  }

  async saveAnalysis(analysisData: InsertAnalysis): Promise<Analysis> {
    // Delete existing analysis for the user (keep only the latest)
    await db.delete(analysis).where(eq(analysis.userId, analysisData.userId));
    
    const [newAnalysis] = await db
      .insert(analysis)
      .values({
        userId: analysisData.userId,
        selfDiscoveries: analysisData.selfDiscoveries
      } as any)
      .returning();
    return newAnalysis;
  }

  // Final learnings operations
  async getFinalLearnings(userId: string): Promise<FinalLearning | undefined> {
    const [learnings] = await db
      .select()
      .from(finalLearnings)
      .where(eq(finalLearnings.userId, userId))
      .orderBy(finalLearnings.submittedAt)
      .limit(1);
    return learnings;
  }

  async saveFinalLearnings(learningsData: InsertFinalLearning): Promise<FinalLearning> {
    const existing = await this.getFinalLearnings(learningsData.userId);
    
    if (existing) {
      const [updatedLearnings] = await db
        .update(finalLearnings)
        .set({
          selfWrittenLearnings: learningsData.selfWrittenLearnings,
          submittedAt: new Date(),
        })
        .where(eq(finalLearnings.userId, learningsData.userId))
        .returning();
      return updatedLearnings;
    } else {
      const [newLearnings] = await db
        .insert(finalLearnings)
        .values(learningsData)
        .returning();
      return newLearnings;
    }
  }
}

export const storage = new DatabaseStorage();
