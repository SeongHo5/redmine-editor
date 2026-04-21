import { z } from "zod";

export const RedmineRefSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});
export type RedmineRef = z.infer<typeof RedmineRefSchema>;

export const RedmineStatusSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  is_closed: z.boolean().optional().default(false),
});
export type RedmineStatus = z.infer<typeof RedmineStatusSchema>;

export const RedmineTrackerSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().nullable().optional(),
  default_status: RedmineRefSchema.optional(),
});
export type RedmineTracker = z.infer<typeof RedmineTrackerSchema>;

export const RedminePrioritySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  is_default: z.boolean().optional(),
  active: z.boolean().optional(),
});
export type RedminePriority = z.infer<typeof RedminePrioritySchema>;

export const RedmineUserSchema = z.object({
  id: z.number().int(),
  name: z.string().optional(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  login: z.string().optional(),
  mail: z.string().optional(),
});
export type RedmineUser = z.infer<typeof RedmineUserSchema>;

export const RedmineMembershipSchema = z.object({
  id: z.number().int(),
  project: RedmineRefSchema,
  user: RedmineRefSchema.optional(),
  group: RedmineRefSchema.optional(),
  roles: z
    .array(
      z.object({
        id: z.number().int(),
        name: z.string(),
      }),
    )
    .optional(),
});
export type RedmineMembership = z.infer<typeof RedmineMembershipSchema>;

export const RedmineAttachmentSchema = z.object({
  id: z.number().int(),
  filename: z.string(),
  filesize: z.number().int().optional(),
  content_type: z.string().optional(),
  content_url: z.string().optional(),
  description: z.string().optional(),
  created_on: z.string().optional(),
});
export type RedmineAttachment = z.infer<typeof RedmineAttachmentSchema>;

export const RedmineIssueSchema = z.object({
  id: z.number().int(),
  project: RedmineRefSchema,
  tracker: RedmineRefSchema,
  status: RedmineRefSchema.extend({
    is_closed: z.boolean().optional(),
  }),
  priority: RedmineRefSchema,
  author: RedmineRefSchema.optional(),
  assigned_to: RedmineRefSchema.optional(),
  subject: z.string(),
  description: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  done_ratio: z.number().int().min(0).max(100).optional(),
  is_private: z.boolean().optional(),
  estimated_hours: z.number().nullable().optional(),
  created_on: z.string(),
  updated_on: z.string(),
  attachments: z.array(RedmineAttachmentSchema).optional(),
});
export type RedmineIssue = z.infer<typeof RedmineIssueSchema>;

export const IssuesListResponseSchema = z.object({
  issues: z.array(RedmineIssueSchema),
  total_count: z.number().int().optional(),
  offset: z.number().int().optional(),
  limit: z.number().int().optional(),
});
export type IssuesListResponse = z.infer<typeof IssuesListResponseSchema>;

export const IssueShowResponseSchema = z.object({
  issue: RedmineIssueSchema,
});

export const StatusesResponseSchema = z.object({
  issue_statuses: z.array(RedmineStatusSchema),
});

export const TrackersResponseSchema = z.object({
  trackers: z.array(RedmineTrackerSchema),
});

export const PrioritiesResponseSchema = z.object({
  issue_priorities: z.array(RedminePrioritySchema),
});

export const MembershipsResponseSchema = z.object({
  memberships: z.array(RedmineMembershipSchema),
  total_count: z.number().int().optional(),
  offset: z.number().int().optional(),
  limit: z.number().int().optional(),
});

export const RedmineErrorResponseSchema = z.object({
  errors: z.array(z.string()),
});
export type RedmineErrorResponse = z.infer<typeof RedmineErrorResponseSchema>;

export const IssueUpdatableFieldsSchema = z
  .object({
    status_id: z.number().int().optional(),
    priority_id: z.number().int().optional(),
    assigned_to_id: z.number().int().nullable().optional(),
    tracker_id: z.number().int().optional(),
    subject: z.string().min(1).optional(),
    done_ratio: z.number().int().min(0).max(100).optional(),
    notes: z.string().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
  });
export type IssueUpdatableFields = z.infer<typeof IssueUpdatableFieldsSchema>;

export const CurrentUserResponseSchema = z.object({
  user: RedmineUserSchema,
});

export const MetaResponseSchema = z.object({
  statuses: z.array(RedmineStatusSchema),
  trackers: z.array(RedmineTrackerSchema),
  priorities: z.array(RedminePrioritySchema),
  currentUser: z.object({
    id: z.number().int(),
    name: z.string(),
  }),
  redmineBaseUrl: z.string().url(),
});
export type MetaResponse = z.infer<typeof MetaResponseSchema>;
