ALTER TABLE `userSettings` ADD `llmModel` text DEFAULT ('gemini-2.5-flash');--> statement-breakpoint
ALTER TABLE `userSettings` DROP COLUMN `llm_model`;