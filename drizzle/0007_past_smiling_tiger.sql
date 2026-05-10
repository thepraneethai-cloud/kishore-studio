ALTER TABLE `userSettings` MODIFY COLUMN `lyricsProvider` enum('chatgpt','claude','gemini','groq','mistral') DEFAULT 'chatgpt';--> statement-breakpoint
ALTER TABLE `userSettings` ADD `groqApiKey` text;--> statement-breakpoint
ALTER TABLE `userSettings` ADD `mistralApiKey` text;