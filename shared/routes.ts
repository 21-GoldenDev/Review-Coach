import { z } from 'zod';
import { insertCoachSchema, insertReviewSchema, insertUserSchema, coaches, reviews, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const registerInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  instagram: z.string().optional(),
  profilePicture: z.string().optional(),
  description: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  isAthlete: z.boolean().default(false),
  isCoach: z.boolean().default(false),
  verificationAnswer: z.string().min(1, "Verification answer is required"),
});

export const api = {
  coaches: {
    list: {
      method: 'GET' as const,
      path: '/api/coaches',
      input: z.object({
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof coaches.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/coaches/:id',
      responses: {
        200: z.custom<typeof coaches.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  reviews: {
    create: {
      method: 'POST' as const,
      path: '/api/reviews',
      input: z.object({
        coachName: z.string().min(1, "Coach name is required"),
        coachInstagram: z.string().optional(),
        coachEmail: z.string().optional(),
        coachPhone: z.string().optional(),
        coachWhatsapp: z.string().optional(),
        coachingPlatform: z.string().optional(),
        ratingResponseTime: z.number().min(0).max(5).optional(),
        ratingKnowledge: z.number().min(0).max(5).optional(),
        ratingResults: z.number().min(0).max(5).optional(),
        ratingCommunication: z.number().min(0).max(5).optional(),
        ratingAvailability: z.number().min(0).max(5).optional(),
        communicationStyle: z.string().optional(),
        comment: z.string().min(1, "Please write a review"),
        proofUrl: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof reviews.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.validation,
        403: errorSchemas.validation,
      },
    },
    getByCoachName: {
      method: 'GET' as const,
      path: '/api/reviews/coach/:coachName',
      responses: {
        200: z.array(z.custom<typeof reviews.$inferSelect>()),
      },
    },
  },
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register',
      input: registerInputSchema,
      responses: {
        201: z.object({
          id: z.number(),
          name: z.string(),
          email: z.string(),
          isAthlete: z.boolean(),
          isCoach: z.boolean(),
        }),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        email: z.string().email("Please enter a valid email"),
        password: z.string().min(1, "Password is required"),
      }),
      responses: {
        200: z.object({
          id: z.number(),
          name: z.string(),
          email: z.string(),
          isAthlete: z.boolean(),
          isCoach: z.boolean(),
          role: z.string().optional(),
        }),
        401: errorSchemas.validation,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout',
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.object({
          id: z.number(),
          name: z.string(),
          email: z.string(),
          isAthlete: z.boolean(),
          isCoach: z.boolean(),
          profilePicture: z.string().nullable(),
          role: z.string().optional(),
        }),
        401: errorSchemas.validation,
      },
    },
    updateProfile: {
      method: 'PUT' as const,
      path: '/api/auth/profile',
      input: z.object({
        name: z.string().min(1, "Name is required").optional(),
        instagram: z.string().optional(),
        profilePicture: z.string().optional(),
        description: z.string().optional(),
        specialties: z.array(z.string()).optional(),
      }),
      responses: {
        200: z.object({
          id: z.number(),
          name: z.string(),
          email: z.string(),
          isAthlete: z.boolean(),
          isCoach: z.boolean(),
          profilePicture: z.string().nullable(),
          role: z.string().optional(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.validation,
      },
    },
  },
  admin: {
    pendingReviews: {
      method: 'GET' as const,
      path: '/api/admin/reviews',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          coachName: z.string(),
          coachInstagram: z.string().nullable(),
          coachEmail: z.string().nullable(),
          coachPhone: z.string().nullable(),
          coachWhatsapp: z.string().nullable(),
          ratingResponseTime: z.number().nullable(),
          ratingKnowledge: z.number().nullable(),
          ratingResults: z.number().nullable(),
          ratingCommunication: z.number().nullable(),
          ratingAvailability: z.number().nullable(),
          communicationStyle: z.string().nullable(),
          comment: z.string(),
          authorName: z.string(),
          proofUrl: z.string().nullable(),
          status: z.string().nullable(),
          createdAt: z.string().nullable(),
        })),
        401: errorSchemas.validation,
        403: errorSchemas.validation,
      },
    },
    approvedReviews: {
      method: 'GET' as const,
      path: '/api/admin/reviews/approved',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          coachName: z.string(),
          coachInstagram: z.string().nullable(),
          coachEmail: z.string().nullable(),
          coachPhone: z.string().nullable(),
          coachWhatsapp: z.string().nullable(),
          ratingResponseTime: z.number().nullable(),
          ratingKnowledge: z.number().nullable(),
          ratingResults: z.number().nullable(),
          ratingCommunication: z.number().nullable(),
          ratingAvailability: z.number().nullable(),
          communicationStyle: z.string().nullable(),
          comment: z.string(),
          authorName: z.string(),
          proofUrl: z.string().nullable(),
          status: z.string().nullable(),
          createdAt: z.string().nullable(),
        })),
        401: errorSchemas.validation,
        403: errorSchemas.validation,
      },
    },
    rejectedReviews: {
      method: 'GET' as const,
      path: '/api/admin/reviews/rejected',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          coachName: z.string(),
          coachInstagram: z.string().nullable(),
          coachEmail: z.string().nullable(),
          coachPhone: z.string().nullable(),
          coachWhatsapp: z.string().nullable(),
          ratingResponseTime: z.number().nullable(),
          ratingKnowledge: z.number().nullable(),
          ratingResults: z.number().nullable(),
          ratingCommunication: z.number().nullable(),
          ratingAvailability: z.number().nullable(),
          communicationStyle: z.string().nullable(),
          comment: z.string(),
          authorName: z.string(),
          proofUrl: z.string().nullable(),
          status: z.string().nullable(),
          createdAt: z.string().nullable(),
        })),
        401: errorSchemas.validation,
        403: errorSchemas.validation,
      },
    },
    approveReview: {
      method: 'POST' as const,
      path: '/api/admin/reviews/:id/approve',
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.validation,
        403: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    rejectReview: {
      method: 'POST' as const,
      path: '/api/admin/reviews/:id/reject',
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.validation,
        403: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    unpublishReview: {
      method: 'POST' as const,
      path: '/api/admin/reviews/:id/unpublish',
      responses: {
        200: z.object({ success: z.boolean() }),
        401: errorSchemas.validation,
        403: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    listUsers: {
      method: 'GET' as const,
      path: '/api/admin/users',
      responses: {
        200: z.array(z.object({
          id: z.number(),
          name: z.string(),
          email: z.string(),
          instagram: z.string().nullable(),
          profilePicture: z.string().nullable(),
          isAthlete: z.boolean().nullable(),
          isCoach: z.boolean().nullable(),
          isFeatured: z.boolean().nullable(),
          role: z.string().nullable(),
          createdAt: z.string().nullable(),
        })),
        401: errorSchemas.validation,
        403: errorSchemas.validation,
      },
    },
    createUser: {
      method: 'POST' as const,
      path: '/api/admin/users',
      input: z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Please enter a valid email"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        instagram: z.string().optional(),
        profilePicture: z.string().optional(),
        isAthlete: z.boolean().default(false),
        isCoach: z.boolean().default(false),
        role: z.enum(["user", "admin"]).default("user"),
      }),
      responses: {
        201: z.object({
          id: z.number(),
          name: z.string(),
          email: z.string(),
          isAthlete: z.boolean().nullable(),
          isCoach: z.boolean().nullable(),
          role: z.string().nullable(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.validation,
        403: errorSchemas.validation,
      },
    },
    updateUser: {
      method: 'PUT' as const,
      path: '/api/admin/users/:id',
      input: z.object({
        name: z.string().min(1, "Name is required").optional(),
        email: z.string().email("Please enter a valid email").optional(),
        password: z.string().min(6, "Password must be at least 6 characters").optional(),
        instagram: z.string().nullable().optional(),
        profilePicture: z.string().nullable().optional(),
        isAthlete: z.boolean().optional(),
        isCoach: z.boolean().optional(),
        role: z.enum(["user", "admin"]).optional(),
      }),
      responses: {
        200: z.object({
          id: z.number(),
          name: z.string(),
          email: z.string(),
          isAthlete: z.boolean().nullable(),
          isCoach: z.boolean().nullable(),
          role: z.string().nullable(),
        }),
        400: errorSchemas.validation,
        401: errorSchemas.validation,
        403: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    deleteUser: {
      method: 'DELETE' as const,
      path: '/api/admin/users/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
        401: errorSchemas.validation,
        403: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    toggleUserFeatured: {
      method: 'POST' as const,
      path: '/api/admin/users/:id/featured',
      responses: {
        200: z.object({ isFeatured: z.boolean() }),
        400: errorSchemas.validation,
        401: errorSchemas.validation,
        403: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
