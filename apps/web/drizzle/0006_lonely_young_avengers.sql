ALTER TABLE `projects` MODIFY COLUMN `resolution` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `mainPlot` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `sidePlots` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `plotTwists` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `characterArcs` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `themes` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `setting` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `actStructure` varchar(64) DEFAULT 'three-act';--> statement-breakpoint
ALTER TABLE `projects` ADD `tone` varchar(128);--> statement-breakpoint
ALTER TABLE `projects` ADD `targetAudience` varchar(255);--> statement-breakpoint
ALTER TABLE `projects` ADD `openingScene` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `climax` text;