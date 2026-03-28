ALTER TABLE `projects` MODIFY COLUMN `resolution` varchar(32) DEFAULT '1920x1080';--> statement-breakpoint
ALTER TABLE `projects` ADD `storyResolution` text;