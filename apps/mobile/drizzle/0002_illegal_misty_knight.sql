CREATE TABLE `film_adr_tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`characterName` varchar(128) NOT NULL,
	`dialogueLine` text,
	`trackType` enum('adr','wild_track','loop_group','walla') DEFAULT 'adr',
	`status` enum('pending','recorded','approved','rejected') DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `film_adr_tracks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `film_foley_tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`foleyType` enum('footsteps','cloth','props','impacts','environmental','custom') DEFAULT 'custom',
	`description` text,
	`status` enum('pending','recorded','approved','rejected') DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `film_foley_tracks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `film_mix_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`dialogueBus` decimal(4,3) DEFAULT '0.850',
	`musicBus` decimal(4,3) DEFAULT '0.700',
	`effectsBus` decimal(4,3) DEFAULT '0.750',
	`masterVolume` decimal(4,3) DEFAULT '1.000',
	`reverbRoom` enum('none','small','medium','large','hall','cathedral') DEFAULT 'none',
	`reverbAmount` decimal(4,3) DEFAULT '0.000',
	`compressionRatio` decimal(5,2) DEFAULT '1.00',
	`noiseReduction` int DEFAULT 0,
	`notes` text,
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `film_mix_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `film_score_cues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`cueNumber` varchar(20) DEFAULT 'TBD',
	`title` varchar(200) NOT NULL,
	`cueType` enum('underscore','source_music','sting','theme','transition','silence') DEFAULT 'underscore',
	`description` text,
	`durationSeconds` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `film_score_cues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funding_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`fundingOrganization` varchar(200) NOT NULL,
	`projectTitle` varchar(300) NOT NULL,
	`status` enum('draft','submitted','approved','rejected') DEFAULT 'draft',
	`formData` json,
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funding_applications_id` PRIMARY KEY(`id`)
);
