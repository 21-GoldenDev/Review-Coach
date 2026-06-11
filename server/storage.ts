import { db } from "./db";
import {
  coaches,
  reviews,
  users,
  contactSubmissions,
  type InsertCoach,
  type InsertReview,
  type InsertUser,
  type InsertContact,
  type Coach,
  type Review,
  type User,
  type ContactSubmission
} from "@shared/schema";

import { and, count, desc, eq, ilike, inArray, isNull, ne, or, sql } from "drizzle-orm";

export interface PendingReview {
  id: number;
  coachId: number | null;
  coachName: string;
  coachInstagram: string | null;
  coachEmail: string | null;
  coachPhone: string | null;
  coachWhatsapp: string | null;
  ratingResponseTime: number | null;
  ratingKnowledge: number | null;
  ratingResults: number | null;
  ratingCommunication: number | null;
  ratingAvailability: number | null;
  communicationStyle: string | null;
  comment: string;
  authorName: string;
  proofUrl: string | null;
  status: string | null;
  createdAt: Date | null;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  instagram: string | null;
  profilePicture: string | null;
  isAthlete: boolean | null;
  isCoach: boolean | null;
  role: string | null;
  createdAt: Date | null;
  isFeatured: boolean;
}

export interface CoachWithRating {
  id: number;
  name: string;
  sport: string;
  instagram: string | null;
  imageUrl: string | null;
  calculatedRating: string;
  feedbackCount: number;
}

export interface IStorage {
  getCoaches(search?: string): Promise<Coach[]>;
  getCoach(id: number): Promise<Coach | undefined>;
  getCoachByUserId(userId: number): Promise<Coach | undefined>;
  getCoachByName(name: string): Promise<Coach | undefined>;
  getCoachesWithRatings(search?: string, featuredOnly?: boolean): Promise<CoachWithRating[]>;
  ensureCoachForUser(user: User): Promise<Coach>;
  setCoachFeatured(userId: number, isFeatured: boolean): Promise<Coach | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  getPendingReviews(page: number, limit: number): Promise<{ reviews: PendingReview[]; total: number }>;
  getApprovedReviews(page: number, limit: number): Promise<{ reviews: PendingReview[]; total: number }>;
  getRejectedReviews(page: number, limit: number): Promise<{ reviews: PendingReview[]; total: number }>;
  getApprovedReviewsByCoachName(coachName: string): Promise<Review[]>;
  getRecentReviews(limit: number): Promise<PendingReview[]>;
  updateReviewStatus(id: number, status: string): Promise<Review | undefined>;
  getReview(id: number): Promise<Review | undefined>;
  createContactSubmission(contact: InsertContact): Promise<ContactSubmission>;
  updateUserRole(id: number, role: string): Promise<void>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<AdminUser[]>;
  deleteUser(id: number): Promise<boolean>;
  getAthleteCount(): Promise<number>;
  getCoachUserCount(): Promise<number>;
  clearOrphanFeaturedCoaches(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getCoaches(search?: string): Promise<Coach[]> {
    if (search) {
      return await db.select().from(coaches).where(ilike(coaches.name, `%${search}%`));
    }
    return await db.select().from(coaches);
  }

  async getCoach(id: number): Promise<Coach | undefined> {
    const [coach] = await db.select().from(coaches).where(eq(coaches.id, id));
    return coach;
  }

  async getCoachByUserId(userId: number): Promise<Coach | undefined> {
    const [coach] = await db.select().from(coaches).where(eq(coaches.userId, userId));
    return coach;
  }

  async getCoachByName(name: string): Promise<Coach | undefined> {
    const trimmedName = name.trim();
    const [coach] = await db.select().from(coaches).where(ilike(coaches.name, trimmedName));
    return coach;
  }

  async ensureCoachForUser(user: User): Promise<Coach> {
    let coach = await this.getCoachByUserId(user.id);
    if (!coach) {
      coach = await this.getCoachByName(user.name);
      if (coach && !coach.userId) {
        const [linked] = await db
          .update(coaches)
          .set({ userId: user.id })
          .where(eq(coaches.id, coach.id))
          .returning();
        coach = linked;
      }
    }
    if (!coach) {
      coach = await this.createCoach({
        userId: user.id,
        name: user.name,
        sport: "General",
        instagram: user.instagram,
        imageUrl: user.profilePicture,
        isFeatured: false,
      });
    }
    return coach;
  }

  async setCoachFeatured(userId: number, isFeatured: boolean): Promise<Coach | undefined> {
    const user = await this.getUser(userId);
    if (!user?.isCoach) return undefined;
    const coach = await this.ensureCoachForUser(user);
    const [updated] = await db
      .update(coaches)
      .set({ isFeatured })
      .where(eq(coaches.id, coach.id))
      .returning();
    if (!updated) return undefined;

    // Clear stale featured flags on orphan/unlinked duplicate coach rows (e.g. from review approval).
    await db
      .update(coaches)
      .set({ isFeatured: false })
      .where(
        and(
          ilike(coaches.name, coach.name),
          ne(coaches.id, coach.id),
          or(isNull(coaches.userId), ne(coaches.userId, userId)),
        ),
      );

    return updated;
  }

  async getCoachesWithRatings(search?: string, featuredOnly?: boolean): Promise<CoachWithRating[]> {
    let coachList: Coach[];

    if (featuredOnly) {
      const featuredRows = await db
        .select()
        .from(coaches)
        .where(eq(coaches.isFeatured, true));

      const linkedRows = featuredRows.filter((c) => c.userId != null);
      if (linkedRows.length === 0) {
        coachList = [];
      } else {
        const userIds = Array.from(new Set(linkedRows.map((c) => c.userId!)));
        const coachUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(and(inArray(users.id, userIds), eq(users.isCoach, true)));

        const validUserIds = new Set(coachUsers.map((u) => u.id));
        coachList = linkedRows.filter((c) => validUserIds.has(c.userId!));
      }
    } else {
      const conditions = [];
      if (search) {
        conditions.push(ilike(coaches.name, `%${search}%`));
      }

      coachList =
        conditions.length > 0
          ? await db.select().from(coaches).where(and(...conditions))
          : await db.select().from(coaches);
    }

    // Get all approved reviews
    const approvedReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.status, "approved"));

    // Calculate ratings for each coach
    return coachList.map((coach) => {
      const coachReviews = approvedReviews.filter(
        (r) => r.coachName && coach.name && r.coachName.toLowerCase() === coach.name.toLowerCase()
      );

      if (coachReviews.length === 0) {
        return {
          id: coach.id,
          name: coach.name,
          sport: coach.sport,
          instagram: coach.instagram,
          imageUrl: coach.imageUrl,
          calculatedRating: "0.0",
          feedbackCount: 0,
        };
      }

      // Calculate: Sum of all ratings / (feedbacks × 4)
      let totalSum = 0;
      coachReviews.forEach((review) => {
        if (review.ratingResponseTime !== null) totalSum += review.ratingResponseTime;
        if (review.ratingKnowledge !== null) totalSum += review.ratingKnowledge;
        if (review.ratingResults !== null) totalSum += review.ratingResults;
        if (review.ratingCommunication !== null) totalSum += review.ratingCommunication;
        if (review.ratingAvailability !== null) totalSum += review.ratingAvailability;
      });

      const overallRating = totalSum / (coachReviews.length * 5);

      return {
        id: coach.id,
        name: coach.name,
        sport: coach.sport,
        instagram: coach.instagram,
        imageUrl: coach.imageUrl,
        calculatedRating: overallRating.toFixed(1),
        feedbackCount: coachReviews.length,
      };
    });
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db.insert(reviews).values(insertReview).returning();
    return review;
  }

  async createCoach(insertCoach: InsertCoach): Promise<Coach> {
    const [coach] = await db.insert(coaches).values(insertCoach).returning();
    return coach;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getPendingReviews(page: number, limit: number): Promise<{ reviews: PendingReview[]; total: number }> {
    const offset = (page - 1) * limit;
    const select = {
      id: reviews.id,
      coachId: reviews.coachId,
      coachName: reviews.coachName,
      coachInstagram: reviews.coachInstagram,
      coachEmail: reviews.coachEmail,
      coachPhone: reviews.coachPhone,
      coachWhatsapp: reviews.coachWhatsapp,
      ratingResponseTime: reviews.ratingResponseTime,
      ratingKnowledge: reviews.ratingKnowledge,
      ratingResults: reviews.ratingResults,
      ratingCommunication: reviews.ratingCommunication,
      ratingAvailability: reviews.ratingAvailability,
      communicationStyle: reviews.communicationStyle,
      comment: reviews.comment,
      authorName: reviews.authorName,
      proofUrl: reviews.proofUrl,
      status: reviews.status,
      createdAt: reviews.createdAt,
    };
    const [reviewsResult, totalResult] = await Promise.all([
      db.select(select).from(reviews).where(eq(reviews.status, 'pending')).limit(limit).offset(offset),
      db.select({ count: count() }).from(reviews).where(eq(reviews.status, 'pending')),
    ]);
    return { reviews: reviewsResult, total: totalResult[0].count };
  }

  async getApprovedReviews(page: number, limit: number): Promise<{ reviews: PendingReview[]; total: number }> {
    const offset = (page - 1) * limit;
    const select = {
      id: reviews.id,
      coachId: reviews.coachId,
      coachName: reviews.coachName,
      coachInstagram: reviews.coachInstagram,
      coachEmail: reviews.coachEmail,
      coachPhone: reviews.coachPhone,
      coachWhatsapp: reviews.coachWhatsapp,
      ratingResponseTime: reviews.ratingResponseTime,
      ratingKnowledge: reviews.ratingKnowledge,
      ratingResults: reviews.ratingResults,
      ratingCommunication: reviews.ratingCommunication,
      ratingAvailability: reviews.ratingAvailability,
      communicationStyle: reviews.communicationStyle,
      comment: reviews.comment,
      authorName: reviews.authorName,
      proofUrl: reviews.proofUrl,
      status: reviews.status,
      createdAt: reviews.createdAt,
    };
    const [reviewsResult, totalResult] = await Promise.all([
      db.select(select).from(reviews).where(eq(reviews.status, 'approved')).limit(limit).offset(offset),
      db.select({ count: count() }).from(reviews).where(eq(reviews.status, 'approved')),
    ]);
    return { reviews: reviewsResult, total: totalResult[0].count };
  }

  async getRejectedReviews(page: number, limit: number): Promise<{ reviews: PendingReview[]; total: number }> {
    const offset = (page - 1) * limit;
    const select = {
      id: reviews.id,
      coachId: reviews.coachId,
      coachName: reviews.coachName,
      coachInstagram: reviews.coachInstagram,
      coachEmail: reviews.coachEmail,
      coachPhone: reviews.coachPhone,
      coachWhatsapp: reviews.coachWhatsapp,
      ratingResponseTime: reviews.ratingResponseTime,
      ratingKnowledge: reviews.ratingKnowledge,
      ratingResults: reviews.ratingResults,
      ratingCommunication: reviews.ratingCommunication,
      ratingAvailability: reviews.ratingAvailability,
      communicationStyle: reviews.communicationStyle,
      comment: reviews.comment,
      authorName: reviews.authorName,
      proofUrl: reviews.proofUrl,
      status: reviews.status,
      createdAt: reviews.createdAt,
    };
    const [reviewsResult, totalResult] = await Promise.all([
      db.select(select).from(reviews).where(eq(reviews.status, 'rejected')).limit(limit).offset(offset),
      db.select({ count: count() }).from(reviews).where(eq(reviews.status, 'rejected')),
    ]);
    return { reviews: reviewsResult, total: totalResult[0].count };
  }

  async getApprovedReviewsByCoachName(coachName: string): Promise<Review[]> {
    const result = await db
      .select()
      .from(reviews)
      .where(eq(reviews.status, 'approved'));
    return result.filter(r => 
      r.coachName?.toLowerCase().includes(coachName.toLowerCase())
    );
  }

  async getRecentReviews(limit: number): Promise<PendingReview[]> {
    const select = {
      id: reviews.id,
      coachId: reviews.coachId,
      coachName: reviews.coachName,
      coachInstagram: reviews.coachInstagram,
      coachEmail: reviews.coachEmail,
      coachPhone: reviews.coachPhone,
      coachWhatsapp: reviews.coachWhatsapp,
      ratingResponseTime: reviews.ratingResponseTime,
      ratingKnowledge: reviews.ratingKnowledge,
      ratingResults: reviews.ratingResults,
      ratingCommunication: reviews.ratingCommunication,
      ratingAvailability: reviews.ratingAvailability,
      communicationStyle: reviews.communicationStyle,
      comment: reviews.comment,
      authorName: reviews.authorName,
      proofUrl: reviews.proofUrl,
      status: reviews.status,
      createdAt: reviews.createdAt,
    };
    return db
      .select(select)
      .from(reviews)
      .where(eq(reviews.status, 'approved'))
      .orderBy(desc(reviews.createdAt))
      .limit(limit);
  }

  async updateReviewStatus(id: number, status: string): Promise<Review | undefined> {
    const [review] = await db
      .update(reviews)
      .set({ status })
      .where(eq(reviews.id, id))
      .returning();
    return review;
  }

  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review;
  }

  async createContactSubmission(contact: InsertContact): Promise<ContactSubmission> {
    const [submission] = await db.insert(contactSubmissions).values(contact).returning();
    return submission;
  }

  async updateUserRole(id: number, role: string): Promise<void> {
    await db.update(users).set({ role }).where(eq(users.id, id));
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    await db.update(users).set(updates).where(eq(users.id, id));
    return await this.getUser(id);
  }

  async getAllUsers(): Promise<AdminUser[]> {
    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        instagram: users.instagram,
        profilePicture: users.profilePicture,
        isAthlete: users.isAthlete,
        isCoach: users.isCoach,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    const coachRows = await db
      .select({
        userId: coaches.userId,
        name: coaches.name,
        isFeatured: coaches.isFeatured,
      })
      .from(coaches);

    const featuredByUserId = new Map<number, boolean>();
    for (const row of coachRows) {
      if (row.isFeatured && row.userId != null) {
        featuredByUserId.set(row.userId, true);
      }
    }

    return userList.map((u) => ({
      ...u,
      isFeatured: u.isCoach === true && featuredByUserId.get(u.id) === true,
    }));
  }

  async deleteUser(id: number): Promise<boolean> {
    const existing = await this.getUser(id);
    if (!existing) return false;
    await db.update(coaches).set({ userId: null }).where(eq(coaches.userId, id));
    await db.update(reviews).set({ userId: null }).where(eq(reviews.userId, id));
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  async getAthleteCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isAthlete, true));
    return Number(result[0]?.count ?? 0);
  }

  async getCoachUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isCoach, true));
    return Number(result[0]?.count ?? 0);
  }

  async clearOrphanFeaturedCoaches(): Promise<number> {
    const cleared = await db
      .update(coaches)
      .set({ isFeatured: false })
      .where(and(isNull(coaches.userId), eq(coaches.isFeatured, true)))
      .returning({ id: coaches.id });
    return cleared.length;
  }
}

export const storage = new DatabaseStorage();
