import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  instagram: text("instagram"),
  profilePicture: text("profile_picture"),
  isAthlete: boolean("is_athlete").default(false),
  isCoach: boolean("is_coach").default(false),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const coaches = pgTable("coaches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  sport: text("sport").notNull(),
  description: text("description"),
  specialties: text("specialties").array(),
  instagram: text("instagram"),
  phone: text("phone"),
  imageUrl: text("image_url"),
  rating: integer("rating").default(0),
  reviewCount: integer("review_count").default(0),
  isFeatured: boolean("is_featured").default(false),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  coachId: integer("coach_id"),
  userId: integer("user_id").references(() => users.id),
  coachName: text("coach_name").notNull(),
  coachInstagram: text("coach_instagram"),
  coachEmail: text("coach_email"),
  coachPhone: text("coach_phone"),
  coachWhatsapp: text("coach_whatsapp"),
  coachingPlatform: text("coaching_platform"),
  ratingResponseTime: integer("rating_response_time"),
  ratingKnowledge: integer("rating_knowledge"),
  ratingResults: integer("rating_results"),
  ratingCommunication: integer("rating_communication"),
  ratingAvailability: integer("rating_availability"),
  communicationStyle: text("communication_style"),
  comment: text("comment").notNull(),
  authorName: text("author_name").notNull(),
  proofUrl: text("proof_url"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCoachSchema = createInsertSchema(coaches).omit({ id: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export const insertContactSchema = createInsertSchema(contactSubmissions).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Coach = typeof coaches.$inferSelect;
export type InsertCoach = z.infer<typeof insertCoachSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
