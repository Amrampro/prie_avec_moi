-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : jeu. 17 sep. 2026 à 22:50
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `prie_avec_moi`
--

-- --------------------------------------------------------

--
-- Structure de la table `event`
--

CREATE TABLE `event` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `place` varchar(191) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `imageUrl` varchar(191) DEFAULT NULL,
  `theme` varchar(191) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) NOT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `favorite`
--

CREATE TABLE `favorite` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `meditationId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `meditation`
--

CREATE TABLE `meditation` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `imageUrl` varchar(191) DEFAULT NULL,
  `bodyText` varchar(191) NOT NULL,
  `footerText` varchar(191) DEFAULT NULL,
  `audioUrl` varchar(191) DEFAULT NULL,
  `audioDuration` varchar(191) DEFAULT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `seriesId` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `post`
--

CREATE TABLE `post` (
  `id` varchar(191) NOT NULL,
  `text` text NOT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 0,
  `authorId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `postcomment`
--

CREATE TABLE `postcomment` (
  `id` varchar(191) NOT NULL,
  `postId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `text` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `postimage`
--

CREATE TABLE `postimage` (
  `id` varchar(191) NOT NULL,
  `postId` varchar(191) NOT NULL,
  `imageUrl` varchar(191) NOT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `postlike`
--

CREATE TABLE `postlike` (
  `id` varchar(191) NOT NULL,
  `postId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `series`
--

CREATE TABLE `series` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `coverUrl` varchar(191) DEFAULT NULL,
  `isPublished` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `user`
--

CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `fullName` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `avatarUrl` varchar(191) DEFAULT NULL,
  `isAdmin` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `event`
--
ALTER TABLE `event`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Event_startDate_endDate_idx` (`startDate`,`endDate`),
  ADD KEY `Event_isPublished_idx` (`isPublished`);

--
-- Index pour la table `favorite`
--
ALTER TABLE `favorite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Favorite_userId_meditationId_key` (`userId`,`meditationId`),
  ADD KEY `Favorite_meditationId_fkey` (`meditationId`);

--
-- Index pour la table `meditation`
--
ALTER TABLE `meditation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Meditation_slug_key` (`slug`),
  ADD KEY `Meditation_seriesId_fkey` (`seriesId`);

--
-- Index pour la table `post`
--
ALTER TABLE `post`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Post_createdAt_idx` (`createdAt`),
  ADD KEY `Post_authorId_idx` (`authorId`);

--
-- Index pour la table `postcomment`
--
ALTER TABLE `postcomment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `PostComment_postId_createdAt_idx` (`postId`,`createdAt`),
  ADD KEY `PostComment_userId_idx` (`userId`);

--
-- Index pour la table `postimage`
--
ALTER TABLE `postimage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `PostImage_postId_idx` (`postId`);

--
-- Index pour la table `postlike`
--
ALTER TABLE `postlike`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `PostLike_postId_userId_key` (`postId`,`userId`),
  ADD KEY `PostLike_userId_idx` (`userId`);

--
-- Index pour la table `series`
--
ALTER TABLE `series`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Series_slug_key` (`slug`);

--
-- Index pour la table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`);

--
-- Index pour la table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `favorite`
--
ALTER TABLE `favorite`
  ADD CONSTRAINT `Favorite_meditationId_fkey` FOREIGN KEY (`meditationId`) REFERENCES `meditation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `meditation`
--
ALTER TABLE `meditation`
  ADD CONSTRAINT `Meditation_seriesId_fkey` FOREIGN KEY (`seriesId`) REFERENCES `series` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `post`
--
ALTER TABLE `post`
  ADD CONSTRAINT `Post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `postcomment`
--
ALTER TABLE `postcomment`
  ADD CONSTRAINT `PostComment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PostComment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `postimage`
--
ALTER TABLE `postimage`
  ADD CONSTRAINT `PostImage_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `postlike`
--
ALTER TABLE `postlike`
  ADD CONSTRAINT `PostLike_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `post` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PostLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
