import express, { type Express, Request, Response } from "express";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { comparePassword, hashPassword } from "./password";
import type { User } from "@shared/schema";
import { upload, localStorageService, UPLOADS_DIR } from "./local-storage";
import { insertContactSchema } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { coaches } from "@shared/schema";
async function requireAdmin(
  req: Request,
  res: Response,
): Promise<User | null> {
  if (!req.session.userId) {
    res.status(401).json({ message: "Not authenticated" });
    return null;
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return null;
  }
  return user;
}

export async function registerRoutes(app: Express): Promise<void> {
  // File upload endpoint for presigned URL flow replacement
  app.post("/api/uploads/request-url", async (req, res) => {
    try {
      const { name, size, contentType, subdir = "avatars" } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      if (size && size > 10 * 1024 * 1024) {
        return res.status(400).json({
          error: "File size exceeds maximum (10MB)",
        });
      }

      if (typeof subdir !== "string" || !subdir.match(/^[a-zA-Z0-9_-]+$/)) {
        return res.status(400).json({
          error: "Invalid upload subdirectory",
        });
      }

      // Generate a unique filename and return the presigned URL
      const filename = localStorageService.generateFilename(name);
      const uploadPath = `/uploads/${subdir}/${filename}`;
      const uploadURL = `/api/uploads/${subdir}/${filename}`;

      res.json({
        uploadURL,
        objectPath: uploadPath,
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error preparing upload:", error);
      res.status(500).json({ error: "Failed to prepare upload" });
    }
  });

  // File upload endpoint - binary PUT for presigned URL flow
  app.put("/api/uploads/:subdir/:filename", async (req, res) => {
    try {
      const { subdir, filename } = req.params;

      // Validate subdir to prevent directory traversal
      if (!subdir.match(/^[a-zA-Z0-9_-]+$/)) {
        return res.status(400).json({ error: "Invalid subdirectory" });
      }

      // Validate filename
      if (!filename || filename.includes("/") || filename.includes("\\")) {
        return res.status(400).json({ error: "Invalid filename" });
      }

      const relativePath = await localStorageService.saveStream(
        req,
        filename,
        subdir,
      );
      const fileUrl = localStorageService.getFileUrl(relativePath);

      res.json({
        success: true,
        fileUrl,
        filePath: relativePath,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // File upload endpoint - multipart form data POST
  app.post("/api/uploads", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const subdir = (req.body.subdir as string) || "files";
      const relativePath = await localStorageService.saveFile(req.file, subdir);
      const fileUrl = localStorageService.getFileUrl(relativePath);

      res.json({
        success: true,
        fileUrl,
        filePath: relativePath,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Serve uploaded files from disk (profile photos, proof attachments, etc.)
  app.use(
    "/uploads",
    express.static(UPLOADS_DIR, {
      maxAge: "1h",
      setHeaders(res, filePath) {
        if (/\.(jpe?g|png|gif|webp)$/i.test(filePath)) {
          res.setHeader("Content-Disposition", "inline");
        }
      },
    }),
  );
  // Do not fall through to the SPA when a file is missing
  app.use("/uploads", (_req, res) => {
    res.status(404).send("File not found");
  });

  app.get("/api/stats", async (req, res) => {
    try {
      res.set("Cache-Control", "no-store");
      const coachCount = await storage.getCoachUserCount();
      const athleteCount = await storage.getAthleteCount();
      res.json({ coachCount, athleteCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get(api.coaches.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const coaches = await storage.getCoaches(search);
    res.json(coaches);
  });

  // Get coaches with calculated ratings from approved reviews
  app.get("/api/coaches-with-ratings", async (req, res) => {
    const search = req.query.search as string | undefined;
    const coachesWithRatings = await storage.getCoachesWithRatings(search, false);
    res.json(coachesWithRatings);
  });

  app.get("/api/featured-coaches", async (_req, res) => {
    const featuredCoaches = await storage.getCoachesWithRatings(undefined, true);
    res.json(featuredCoaches);
  });

  app.get(api.coaches.get.path, async (req, res) => {
    const coach = await storage.getCoach(Number(req.params.id));
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }
    res.json(coach);
  });

  app.post(api.reviews.create.path, async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({
          message: "You must be logged in to submit a review",
        });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      if (!user.isAthlete) {
        return res.status(403).json({
          message: "Only athletes can submit reviews",
        });
      }

      const input = api.reviews.create.input.parse(req.body);

      const reviewData = {
        coachName: input.coachName,
        coachInstagram: input.coachInstagram || null,
        coachEmail: input.coachEmail || null,
        coachPhone: input.coachPhone || null,
        coachWhatsapp: input.coachWhatsapp || null,
        coachingPlatform: input.coachingPlatform || null,
        ratingResponseTime: input.ratingResponseTime || null,
        ratingKnowledge: input.ratingKnowledge || null,
        ratingResults: input.ratingResults || null,
        ratingCommunication: input.ratingCommunication || null,
        ratingAvailability: input.ratingAvailability || null,
        communicationStyle: input.communicationStyle || null,
        comment: input.comment,
        proofUrl: input.proofUrl || null,
        authorName: user.name,
        userId: user.id,
        status: "pending",
      };

      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.get("/api/coaches/:id/contact", async (req, res) => {
    const coach = await storage.getCoach(Number(req.params.id));
    if (!coach) {
      return res.status(404).json({ message: "Coach not found" });
    }

    let coachSignupEmail: string | null = null;
    if (coach.userId) {
      const coachUser = await storage.getUser(coach.userId);
      if (coachUser) {
        coachSignupEmail = coachUser.email;
      }
    }

    const approvedReviews = await storage.getApprovedReviewsByCoachName(
      coach.name,
    );

    const reviewEmails: string[] = [];
    const reviewPhones: string[] = [];
    const reviewWhatsapps: string[] = [];

    for (const review of approvedReviews) {
      if (
        review.coachEmail &&
        review.coachEmail !== coachSignupEmail &&
        !reviewEmails.includes(review.coachEmail)
      ) {
        reviewEmails.push(review.coachEmail);
      }
      if (review.coachPhone && !reviewPhones.includes(review.coachPhone)) {
        reviewPhones.push(review.coachPhone);
      }
      if (
        review.coachWhatsapp &&
        !reviewWhatsapps.includes(review.coachWhatsapp)
      ) {
        reviewWhatsapps.push(review.coachWhatsapp);
      }
    }

    res.json({
      signupEmail: coachSignupEmail,
      reviewEmails,
      reviewPhones,
      reviewWhatsapps,
      instagram: coach.instagram,
    });
  });

  app.get(api.reviews.getByCoachName.path, async (req, res) => {
    const coachName = decodeURIComponent(String(req.params.coachName));
    const approvedReviews =
      await storage.getApprovedReviewsByCoachName(coachName);
    res.json(
      approvedReviews.map((r) => ({
        ...r,
        createdAt: r.createdAt?.toISOString() ?? null,
      })),
    );
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);

      if (input.verificationAnswer.trim().toLowerCase() !== "derek lunsford") {
        return res.status(400).json({
          message: "Incorrect verification answer",
          field: "verificationAnswer",
        });
      }

      const normalizedEmail = input.email.trim().toLowerCase();
      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({
          message: "Email already registered",
          field: "email",
        });
      }

      const hashedPassword = await hashPassword(input.password);

      let validatedProfilePicture: string | null = null;
      if (
        input.profilePicture &&
        input.profilePicture.startsWith("/uploads/")
      ) {
        validatedProfilePicture = input.profilePicture;
      }

      const user = await storage.createUser({
        name: input.name,
        email: normalizedEmail,
        password: hashedPassword,
        instagram: input.instagram || null,
        profilePicture: validatedProfilePicture,
        isAthlete: input.isAthlete,
        isCoach: input.isCoach,
      });

      if (user.isCoach) {
        await storage.createCoach({
          userId: user.id,
          name: user.name,
          sport: "General",
          description: input.description || null,
          specialties: input.specialties || null,
          instagram: user.instagram,
          imageUrl: validatedProfilePicture,
        });
      }

      req.session.userId = user.id;

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        isAthlete: user.isAthlete ?? false,
        isCoach: user.isCoach ?? false,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);

      const user = await storage.getUserByEmail(
        input.email.trim().toLowerCase(),
      );
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      const validPassword = await comparePassword(
        input.password,
        user.password,
      );
      if (!validPassword) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      req.session.userId = user.id;

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        isAthlete: user.isAthlete ?? false,
        isCoach: user.isCoach ?? false,
        profilePicture: user.profilePicture,
        role: user.role ?? "user",
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isAthlete: user.isAthlete ?? false,
      isCoach: user.isCoach ?? false,
      profilePicture: user.profilePicture,
      role: user.role ?? "user",
    });
  });

  app.put(api.auth.updateProfile.path, async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const input = api.auth.updateProfile.input.parse(req.body);

      // Validate profile picture URL if provided
      let validatedProfilePicture = input.profilePicture;
      if (validatedProfilePicture && !validatedProfilePicture.startsWith("/uploads/")) {
        validatedProfilePicture = undefined;
      }

      // Update user data
      const updates: any = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.instagram !== undefined) updates.instagram = input.instagram;
      if (validatedProfilePicture !== undefined) updates.profilePicture = validatedProfilePicture;

      const updatedUser = await storage.updateUser(req.session.userId, updates);

      // Update coach profile if user is a coach
      if (user.isCoach && (input.description !== undefined || input.specialties !== undefined)) {
        const coach = await storage.getCoachByName(user.name);
        if (coach) {
          const coachUpdates: any = {};
          if (input.description !== undefined) coachUpdates.description = input.description;
          if (input.specialties !== undefined) coachUpdates.specialties = input.specialties;
          if (validatedProfilePicture !== undefined) coachUpdates.imageUrl = validatedProfilePicture;

          await db.update(coaches).set(coachUpdates).where(eq(coaches.id, coach.id));
        }
      }

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update profile" });
      }

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAthlete: updatedUser.isAthlete ?? false,
        isCoach: updatedUser.isCoach ?? false,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role ?? "user",
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Profile update error:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin routes
  app.get(api.admin.pendingReviews.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    const pendingReviews = await storage.getPendingReviews();
    res.json(
      pendingReviews.map((r) => ({
        ...r,
        createdAt: r.createdAt?.toISOString() ?? null,
      })),
    );
  });

  app.post(api.admin.approveReview.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    const reviewId = Number(req.params.id);
    const review = await storage.getReview(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if coach exists, create if not
    const existingCoach = await storage.getCoachByName(review.coachName.trim());
    let coachCreated = false;

    if (!existingCoach) {
      // Create a new coach from review data
      await storage.createCoach({
        name: review.coachName.trim(),
        sport: review.coachingPlatform || "General",
        instagram: review.coachInstagram || null,
        phone: review.coachPhone || null,
        imageUrl: null,
        rating: 0,
        reviewCount: 0,
      });
      coachCreated = true;
    }

    await storage.updateReviewStatus(reviewId, "approved");
    res.json({ success: true, coachCreated });
  });

  app.post(api.admin.rejectReview.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    const reviewId = Number(req.params.id);
    const review = await storage.getReview(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await storage.updateReviewStatus(reviewId, "rejected");
    res.json({ success: true });
  });

  app.get(api.admin.listUsers.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    const allUsers = await storage.getAllUsers();
    res.json(
      allUsers.map((u) => ({
        ...u,
        isAthlete: u.isAthlete ?? false,
        isCoach: u.isCoach ?? false,
        isFeatured: u.isFeatured ?? false,
        createdAt: u.createdAt?.toISOString() ?? null,
      })),
    );
  });

  app.post(api.admin.toggleUserFeatured.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    const userId = Number(req.params.id);
    const targetUser = await storage.getUser(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!targetUser.isCoach) {
      return res.status(400).json({ message: "Only coach accounts can be featured" });
    }

    const coach = await storage.ensureCoachForUser(targetUser);
    const nextFeatured = !(coach.isFeatured ?? false);
    const updated = await storage.setCoachFeatured(userId, nextFeatured);
    if (!updated) {
      return res.status(500).json({ message: "Failed to update featured status" });
    }

    res.json({ isFeatured: updated.isFeatured ?? false });
  });

  app.post(api.admin.createUser.path, async (req, res) => {
    if (!(await requireAdmin(req, res))) return;

    try {
      const input = api.admin.createUser.input.parse(req.body);
      const normalizedEmail = input.email.trim().toLowerCase();
      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({
          message: "Email already registered",
          field: "email",
        });
      }

      let validatedProfilePicture: string | null = null;
      if (
        input.profilePicture &&
        input.profilePicture.startsWith("/uploads/")
      ) {
        validatedProfilePicture = input.profilePicture;
      }

      const hashedPassword = await hashPassword(input.password);
      const newUser = await storage.createUser({
        name: input.name,
        email: normalizedEmail,
        password: hashedPassword,
        instagram: input.instagram || null,
        profilePicture: validatedProfilePicture,
        isAthlete: input.isAthlete,
        isCoach: input.isCoach,
        role: input.role,
      });

      if (newUser.isCoach) {
        const existingCoach = await storage.getCoachByName(newUser.name);
        if (!existingCoach) {
          await storage.createCoach({
            userId: newUser.id,
            name: newUser.name,
            sport: "General",
            instagram: newUser.instagram,
            imageUrl: validatedProfilePicture,
          });
        }
      }

      res.status(201).json({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isAthlete: newUser.isAthlete ?? false,
        isCoach: newUser.isCoach ?? false,
        role: newUser.role ?? "user",
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.put(api.admin.updateUser.path, async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    try {
      const userId = Number(req.params.id);
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const input = api.admin.updateUser.input.parse(req.body);

      if (input.email) {
        const normalizedEmail = input.email.trim().toLowerCase();
        const existingUser = await storage.getUserByEmail(normalizedEmail);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({
            message: "Email already in use",
            field: "email",
          });
        }
      }

      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.email !== undefined) updates.email = input.email.trim().toLowerCase();
      if (input.instagram !== undefined) updates.instagram = input.instagram;
      if (input.isAthlete !== undefined) updates.isAthlete = input.isAthlete;
      if (input.isCoach !== undefined) updates.isCoach = input.isCoach;
      if (input.role !== undefined) updates.role = input.role;
      if (input.password) {
        updates.password = await hashPassword(input.password);
      }
      if (input.profilePicture !== undefined) {
        if (
          input.profilePicture === null ||
          input.profilePicture.startsWith("/uploads/")
        ) {
          updates.profilePicture = input.profilePicture;
        }
      }

      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }

      if (input.isCoach && !targetUser.isCoach) {
        const existingCoach = await storage.getCoachByName(updatedUser.name);
        if (!existingCoach) {
          await storage.createCoach({
            userId: updatedUser.id,
            name: updatedUser.name,
            sport: "General",
            instagram: updatedUser.instagram,
            imageUrl: updatedUser.profilePicture,
          });
        }
      }

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isAthlete: updatedUser.isAthlete ?? false,
        isCoach: updatedUser.isCoach ?? false,
        role: updatedUser.role ?? "user",
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete(api.admin.deleteUser.path, async (req, res) => {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const userId = Number(req.params.id);
    if (userId === admin.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const targetUser = await storage.getUser(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const deleted = await storage.deleteUser(userId);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true });
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const contactFormSchema = insertContactSchema.extend({
        firstName: z.string().min(1, "First name is required"),
        email: z.string().email("Valid email is required"),
        message: z.string().min(10, "Message must be at least 10 characters"),
        attachmentUrl: z
          .string()
          .nullable()
          .optional()
          .refine(
            (val) => !val || val.startsWith("/uploads/"),
            "Invalid attachment URL - must be an uploaded file",
          ),
      });

      const validatedData = contactFormSchema.parse(req.body);

      const submission = await storage.createContactSubmission({
        firstName: validatedData.firstName,
        email: validatedData.email,
        phone: validatedData.phone || null,
        message: validatedData.message,
        attachmentUrl: validatedData.attachmentUrl || null,
      });

      res.json({ success: true, id: submission.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Contact submission error:", error);
      res.status(500).json({ message: "Failed to submit contact form" });
    }
  });

  // Advertise form: expose Web3Forms key at runtime (VPS/system env), not only at Vite build time.
  app.get("/api/advertise-config", (_req, res) => {
    const accessKey = (
      process.env.VITE_WEB3FORMS_ACCESS_KEY ||
      process.env.WEB3FORMS_ACCESS_KEY ||
      ""
    ).trim();
    if (!accessKey) {
      return res.status(503).json({
        message:
          "Advertise form is not configured (set VITE_WEB3FORMS_ACCESS_KEY or WEB3FORMS_ACCESS_KEY).",
      });
    }
    res.json({ accessKey });
  });

}
