CREATE INDEX `idx_projects_userId` ON `projects` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_jobs_userId` ON `jobs` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_jobs_projectId` ON `jobs` (`projectId`);--> statement-breakpoint
CREATE INDEX `idx_jobs_status` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX `idx_costTracking_userId` ON `costTracking` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_scenes_projectId` ON `scenes` (`projectId`);--> statement-breakpoint
CREATE INDEX `idx_promptTemplates_userId` ON `promptTemplates` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_sunoStyleTemplates_userId` ON `sunoStyleTemplates` (`userId`);
