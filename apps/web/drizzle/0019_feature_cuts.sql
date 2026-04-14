-- Migration: Add feature cuts, feature cut scenes, and compile jobs
  -- Feature cuts: editorial selection and ordering of scenes into a final film

  CREATE TABLE `featureCuts` (
    `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    `projectId` int NOT NULL,
    `userId` int NOT NULL,
    `title` varchar(255) NOT NULL DEFAULT 'Director''s Cut',
    `description` text,
    `status` enum('open','locked','archived') NOT NULL DEFAULT 'open',
    `totalRuntime` int DEFAULT 0,
    `notes` text,
    `lockedAt` timestamp,
    `lockedBy` int,
    `compiledMovieId` int,
    `version` int NOT NULL DEFAULT 1,
    `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );

  CREATE TABLE `featureCutScenes` (
    `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    `cutId` int NOT NULL,
    `sceneId` int NOT NULL,
    `orderIndex` int NOT NULL DEFAULT 0,
    `included` boolean NOT NULL DEFAULT true,
    `notes` text,
    `trimStart` int DEFAULT 0,
    `trimEnd` int,
    `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE `compileJobs` (
    `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    `cutId` int NOT NULL,
    `projectId` int NOT NULL,
    `userId` int NOT NULL,
    `status` enum('queued','processing','completed','failed') NOT NULL DEFAULT 'queued',
    `progress` int DEFAULT 0,
    `currentStep` varchar(255),
    `outputMovieId` int,
    `outputUrl` text,
    `errorMessage` text,
    `scenesTotal` int DEFAULT 0,
    `scenesProcessed` int DEFAULT 0,
    `metadata` json,
    `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
  