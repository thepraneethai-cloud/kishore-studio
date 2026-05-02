CREATE TABLE `costTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(64) NOT NULL,
	`type` enum('lyrics','image','video') NOT NULL,
	`cost` decimal(10,4) NOT NULL,
	`jobId` varchar(64),
	`date` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `costTracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` varchar(64) NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`type` enum('lyrics','image','video','scene_generation') NOT NULL,
	`provider` varchar(64) NOT NULL,
	`status` enum('queued','processing','succeeded','failed','cancelled') NOT NULL DEFAULT 'queued',
	`input` json NOT NULL,
	`output` json,
	`cost` decimal(10,4),
	`errorMessage` text,
	`retryCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('devotional','story','mythology','custom') NOT NULL,
	`status` enum('draft','in_progress','completed','archived') NOT NULL DEFAULT 'draft',
	`deity` varchar(64),
	`storyTitle` varchar(255),
	`storyDescription` text,
	`lyrics` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sceneNumber` int NOT NULL,
	`description` text NOT NULL,
	`imagePrompt` text,
	`videoPrompt` text,
	`imageJobId` varchar(64),
	`videoJobId` varchar(64),
	`imageUrl` text,
	`videoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`lyricsProvider` enum('chatgpt','claude','gemini') DEFAULT 'chatgpt',
	`imageProvider` enum('flux','dalle','midjourney') DEFAULT 'flux',
	`videoProvider` enum('runway','grok','pika') DEFAULT 'runway',
	`openaiApiKey` text,
	`claudeApiKey` text,
	`geminiApiKey` text,
	`replicateApiKey` text,
	`dallEApiKey` text,
	`midjourneyApiKey` text,
	`grokApiKey` text,
	`pikaApiKey` text,
	`monthlyBudgetUSD` decimal(10,2) DEFAULT '50.00',
	`budgetResetDay` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSettings_userId_unique` UNIQUE(`userId`)
);
