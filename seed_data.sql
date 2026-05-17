-- ====================================================================
-- KORA JOB PORTAL - MYSQL DATABASE SEED DATA
-- Generates 30 Cameroonian Job Seekers, 27 Employers, and 27 Companies
-- Default Password for all accounts: kora@2026#
-- Password BCrypt Hash: $2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. BASE SECURITY ROLES INITIALIZATION
-- --------------------------------------------------------------------
INSERT INTO `roles` (`id`, `name`) VALUES 
(1, 'ROLE_JOB_SEEKER'),
(2, 'ROLE_EMPLOYER'),
(3, 'ROLE_ADMIN')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- --------------------------------------------------------------------
-- 2. JOB SEEKERS (USERS TABLE - IDs 1 to 30)
-- --------------------------------------------------------------------
INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`, `provider`, `provider_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Samuel Eto\'o', 'samuel.etoo@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(2, 'Jean-Paul Mbarga', 'jeanpaul.mbarga@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(3, 'Florence Ngo Nonga', 'florence.nonga@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(4, 'Chantal Bidzogo', 'chantal.bidzogo@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(5, 'Dieudonné Ndip', 'dieudonne.ndip@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(6, 'Divine Ayuk', 'divine.ayuk@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(7, 'Marcelle Fotso', 'marcelle.fotso@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(8, 'Emmanuel Sadi', 'emmanuel.sadi@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(9, 'Aminatou Harouna', 'aminatou.harouna@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(10, 'Paul-Valéry Abega', 'paulvalery.abega@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(11, 'Rodrigue Mpondo', 'rodrigue.mpondo@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(12, 'Beatrice Ndzie', 'beatrice.ndzie@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(13, 'Collins Tabi', 'collins.tabi@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(14, 'Gladys Che', 'gladys.che@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(15, 'Yvette Djene', 'yvette.djene@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(16, 'Christian Kamga', 'christian.kamga@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(17, 'Arouna Ousmanou', 'arouna.ousmanou@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(18, 'Fadimatou Dewa', 'fadimatou.dewa@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(19, 'Eric Tchatchouang', 'eric.tchatchouang@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(20, 'Sandrine Bella', 'sandrine.bella@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(21, 'Blaise Ngando', 'blaise.ngando@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(22, 'Miriam Enow', 'miriam.enow@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(23, 'Patrick Mbah', 'patrick.mbah@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(24, 'Sylvain Noah', 'sylvain.noah@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(25, 'Roseline Wamba', 'roseline.wamba@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(26, 'Ibrahim Bello', 'ibrahim.bello@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(27, 'Christelle Ngono', 'christelle.ngono@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(28, 'Olivier Mebenga', 'olivier.mebenga@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(29, 'Patricia Kengne', 'patricia.kengne@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(30, 'Franklin Tabot', 'franklin.tabot@kora.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'JOB_SEEKER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00');

-- --------------------------------------------------------------------
-- 3. JOB SEEKERS PROFILES (JOB_SEEKERS TABLE - IDs 1 to 30)
-- --------------------------------------------------------------------
INSERT INTO `job_seekers` (`id`, `phone`, `city`, `region`, `profile_summary`, `avatar_url`, `linked_in_url`, `portfolio_url`, `profile_score`, `is_open_to_work`) VALUES
(1, '+237677112233', 'Douala', 'Littoral', 'Experienced software engineer specializing in high-performance web systems and databases. Excited about Kora.', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998904/balafon_cboywy.png', 'https://linkedin.com/in/samuel-etoo', 'https://samueletoo.dev', 90, 1),
(2, '+237699445566', 'Yaoundé', 'Center', 'Junior fullstack developer focused on Spring Boot and React applications. Eager to join Cameroonian tech teams.', NULL, 'https://linkedin.com/in/jeanpaul-mbarga', NULL, 70, 1),
(3, '+237655778899', 'Douala', 'Littoral', 'Senior UI/UX Designer dedicated to crafting accessible, beautiful, and dynamic interfaces for mobile and web products.', NULL, 'https://linkedin.com/in/florence-nonga', 'https://behance.net/florence-nonga', 80, 1),
(4, '+237678990011', 'Yaoundé', 'Center', 'Detail-oriented quality assurance engineer with experience in manual testing and Selenium automation.', NULL, NULL, NULL, 50, 1),
(5, '+237680223344', 'Buea', 'Southwest', 'IT specialist with strong background in systems administration, Linux server setup, and cloud migrations.', NULL, 'https://linkedin.com/in/dieudonne-ndip', NULL, 70, 1),
(6, '+237650334455', 'Limbe', 'Southwest', 'Web developer with passion for modern CSS animations, HTML5, and responsive design systems.', NULL, NULL, 'https://github.com/divineayuk', 60, 1),
(7, '+237671234567', 'Bafoussam', 'West', 'Experienced financial analyst skilled in financial modeling, budgeting, and corporate investment reporting.', NULL, 'https://linkedin.com/in/marcelle-fotso', NULL, 70, 1),
(8, '+237691234567', 'Garoua', 'North', 'Project manager with 5+ years of managing civil engineering and public infrastructure projects in Cameroon.', NULL, NULL, NULL, 50, 1),
(9, '+237651234567', 'Maroua', 'Far North', 'Bilingual communications professional with expertise in public relations and community management.', NULL, 'https://linkedin.com/in/aminatou-harouna', NULL, 70, 1),
(10, '+237672223344', 'Yaoundé', 'Center', 'Creative graphic designer and brand strategist specializing in visual identity designs and logo creation.', NULL, 'https://linkedin.com/in/paulvalery-abega', 'https://dribbble.com/paulvalery', 80, 1),
(11, '+237693334455', 'Douala', 'Littoral', 'Backend specialist focusing on Node.js, Express, and distributed microservices architectures.', NULL, NULL, NULL, 50, 1),
(12, '+237653334455', 'Yaoundé', 'Center', 'Database administrator skilled in MySQL, PostgreSQL, performance tuning, and backup recovery.', NULL, 'https://linkedin.com/in/beatrice-ndzie', NULL, 70, 1),
(13, '+237674445566', 'Bamenda', 'Northwest', 'Dedicated software tester focusing on security penetration testing and api vulnerability analysis.', NULL, NULL, NULL, 50, 1),
(14, '+237694445566', 'Bamenda', 'Northwest', 'Human resources coordinator passionate about recruiting, onboarding, and developer relations.', NULL, 'https://linkedin.com/in/gladys-che', NULL, 70, 1),
(15, '+237654445566', 'Douala', 'Littoral', 'Executive assistant with high proficiency in bilingual reporting, meeting scheduling, and office management.', NULL, NULL, NULL, 50, 1),
(16, '+237675556677', 'Bafoussam', 'West', 'Mobile application developer creating native Android apps using Kotlin and Jetpack Compose.', NULL, 'https://linkedin.com/in/christian-kamga', 'https://github.com/christiankamga', 80, 1),
(17, '+237695556677', 'Garoua', 'North', 'Agricultural technology advisor bridging the gap between digital solutions and modern farming practices.', NULL, NULL, NULL, 50, 1),
(18, '+237655556677', 'Ngaoundéré', 'Adamawa', 'Network security administrator experienced with Cisco routers, firewall configuration, and VPN setups.', NULL, 'https://linkedin.com/in/fadimatou-dewa', NULL, 70, 1),
(19, '+237676667788', 'Douala', 'Littoral', 'Data scientist with deep interest in Python, Pandas, machine learning models, and big data pipeline setups.', NULL, NULL, NULL, 50, 1),
(20, '+237696667788', 'Yaoundé', 'Center', 'Content writer and SEO strategist with a proven track record of boosting organic website traffic.', NULL, 'https://linkedin.com/in/sandrine-bella', NULL, 70, 1),
(21, '+237656667788', 'Douala', 'Littoral', 'Frontend specialist with experience building interactive web applications with Angular, React, and Vue.', NULL, NULL, NULL, 50, 1),
(22, '+237677778899', 'Kumba', 'Southwest', 'Bilingual customer success representative dedicated to providing excellent client service and solving technical issues.', NULL, 'https://linkedin.com/in/miriam-enow', NULL, 70, 1),
(23, '+2376977778899', 'Buea', 'Southwest', 'DevOps engineer focusing on Docker, Kubernetes, CI/CD pipelines, and AWS cloud management.', NULL, NULL, NULL, 50, 1),
(24, '+237657778899', 'Yaoundé', 'Center', 'Digital marketing expert with extensive experience managing high-converting social media campaigns.', NULL, 'https://linkedin.com/in/sylvain-noah', NULL, 70, 1),
(25, '+237678889900', 'Bafoussam', 'West', 'Operations manager focused on streamline supply chain logistics and warehouse inventory setups.', NULL, NULL, NULL, 50, 1),
(26, '+237698889900', 'Maroua', 'Far North', 'Embedded systems engineer passionate about internet of things (IoT) and hardware prototyping.', NULL, 'https://linkedin.com/in/ibrahim-bello', NULL, 70, 1),
(27, '+237658889900', 'Ebolowa', 'South', 'Public administration specialist focused on community engagement and regional development programs.', NULL, NULL, NULL, 50, 1),
(28, '+237679990011', 'Yaoundé', 'Center', 'Systems architect specialized in cloud-native microservice systems and enterprise integration patterns.', NULL, 'https://linkedin.com/in/olivier-mebenga', 'https://github.com/olivier-mebenga', 80, 1),
(29, '+237699990011', 'Douala', 'Littoral', 'Product manager bridging the gap between business needs, customer desires, and software development.', NULL, NULL, NULL, 50, 1),
(30, '+237659990011', 'Limbe', 'Southwest', 'Web developer specializing in building beautiful Shopify and WordPress digital storefronts.', NULL, 'https://linkedin.com/in/franklin-tabot', NULL, 70, 1);

-- --------------------------------------------------------------------
-- 4. ROLE ENTITY MAPPING FOR JOB SEEKERS (IDs 1 to 30)
-- --------------------------------------------------------------------
INSERT INTO `user_role_entities` (`user_id`, `role_entity_id`) VALUES
(1, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(2, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(3, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(4, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(5, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(6, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(7, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(8, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(9, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(10, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(11, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(12, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(13, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(14, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(15, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(16, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(17, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(18, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(19, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(20, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(21, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(22, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(23, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(24, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(25, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(26, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(27, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(28, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(29, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1)),
(30, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_JOB_SEEKER' LIMIT 1));

-- --------------------------------------------------------------------
-- 5. EMPLOYER USER ACCOUNTS (USERS TABLE - IDs 31 to 57)
-- --------------------------------------------------------------------
INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`, `provider`, `provider_id`, `is_active`, `created_at`, `updated_at`) VALUES
(31, 'Pierre Moukoko', 'recruitment@uba.com', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(32, 'Sarah Ebongue', 'careers@camtel.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(33, 'Jean-Marc Ngassi', 'jobs@orange.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(34, 'Carine Tchakounté', 'careers@mtn.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(35, 'Dieudonné Tchokoss', 'hr@tchokoss.com', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(36, 'Nathalie Ewane', 'recruitment@leeloubabyfood.com', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(37, 'Pascal Foko', 'jobs@pafic.com', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(38, 'Chantal Dovv', 'hr@dovv.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(39, 'Sylvestre Lucia', 'careers@santalucia.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(40, 'Brice Antic', 'hr@antic.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(41, 'Serge Tentee', 'jobs@tentee.com', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(42, 'Michel Megasoft', 'hr@megasoft.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(43, 'Arthur Supermont', 'recruitment@supermont.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(44, 'Cyrille Balafon', 'admin@radiobalafon.net', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(45, 'Edouard Canal2', 'jobs@canal2international.net', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(46, 'Ferdinand CCAA', 'careers@ccaa.aero', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(47, 'Gilbert Port', 'recruitment@portdedouala.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(48, 'Henri Azur', 'careers@azursa.com', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(49, 'Isidore Mayor', 'hr@sctm-mayor.com', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(50, 'Julienne Chococam', 'careers@chococam.com', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(51, 'Karl Brasseries', 'jobs@lesboissonsducameroun.com', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(52, 'Louis Total', 'recruitment@totalenergies.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(53, 'Martial CBC', 'careers@cbc-bank.com', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(54, 'Nestor Tradex', 'careers@tradexsa.com', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(55, 'Odile CRTV', 'hr@crtv.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(56, 'Patrick Equinoxe', 'jobs@equinoxetv.com', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00'),
(57, 'Richard Eneo', 'recruitment@eneocameroon.cm', '$2a$10$zPkaWMlGe7mHoMblhPHII.6GPZ9rgriBlY6bSdwe5R/G1Dp3Y7EOu', 'EMPLOYER', 'LOCAL', NULL, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00');

-- --------------------------------------------------------------------
-- 6. EMPLOYER PROFILES (EMPLOYERS TABLE - IDs 31 to 57)
-- --------------------------------------------------------------------
INSERT INTO `employers` (`id`, `phone`, `city`, `region`, `avatar_url`, `job_title`, `bio`, `is_approved`, `profile_score`) VALUES
(31, '+237677000101', 'Douala', 'Littoral', NULL, 'Talent Acquisition Director', 'Managing corporate recruits at UBA bank.', 1, 90),
(32, '+237699000102', 'Yaoundé', 'Center', NULL, 'Head of Human Resources', 'Overseeing technical positions at Cameroon Telecommunications.', 1, 90),
(33, '+237655000103', 'Douala', 'Littoral', NULL, 'Senior Staffing Partner', 'Directing staffing activities at Orange Cameroun.', 1, 90),
(34, '+237678000104', 'Douala', 'Littoral', NULL, 'Recruiting Manager', 'In charge of global network team recruitment at MTN Cameroon.', 1, 90),
(35, '+237680000105', 'Douala', 'Littoral', NULL, 'General Manager', 'Directing activities at Tchokoss Group.', 1, 90),
(36, '+237650000106', 'Douala', 'Littoral', NULL, 'HR Recruiter', 'Managing hiring cycles for Leelou Baby Food.', 1, 90),
(37, '+237671000107', 'Yaoundé', 'Center', NULL, 'Personnel Manager', 'Recruiting for industrial and plastic packaging lines at Pafic.', 1, 90),
(38, '+237691000108', 'Yaoundé', 'Center', NULL, 'Head of Staffing', 'Recruiting retail staff and administrative profiles for Dovv Supermarkets.', 1, 90),
(39, '+237651000109', 'Yaoundé', 'Center', NULL, 'HR Coordinator', 'Managing local personnel recruitment for Santa Lucia.', 1, 90),
(40, '+237672000110', 'Yaoundé', 'Center', NULL, 'IT Recruiting Officer', 'Directing state agency technological staff profiles for ANTIC.', 1, 90),
(41, '+237693000111', 'Douala', 'Littoral', NULL, 'Director of Operations', 'Recruiting construction managers and real estate analysts.', 1, 90),
(42, '+237653000112', 'Douala', 'Littoral', NULL, 'Head of Engineering hiring', 'Recruiting top-tier software engineers and analysts for Megasoft.', 1, 90),
(43, '+237674000113', 'Douala', 'Littoral', NULL, 'Talent Specialist', 'Directing factory personnel and commercial agent hiring for Supermont.', 1, 90),
(44, '+237694000114', 'Douala', 'Littoral', NULL, 'Radio Operations Lead', 'Staffing reporters, sound technicians, and media managers for Balafon.', 1, 90),
(45, '+237654000115', 'Douala', 'Littoral', NULL, 'Broadcasting Hiring Director', 'Overseeing TV reporters and content creators hiring for Canal 2.', 1, 90),
(46, '+237675000116', 'Yaoundé', 'Center', NULL, 'Aviation Staffing Lead', 'Overseeing airport safety auditors and mechanical staff at CCAA.', 1, 90),
(47, '+237695000117', 'Douala', 'Littoral', NULL, 'Maritime Recruiter', 'Managing ship captains, port engineers and container traffic managers at PAD.', 1, 90),
(48, '+237655000118', 'Douala', 'Littoral', NULL, 'Factory HR Manager', 'In charge of consumer soap manufacturing workforce at Azur S.A.', 1, 90),
(49, '+237676000119', 'Douala', 'Littoral', NULL, 'Supply Chain Staffing Lead', 'Recruiting distributors and retail relationship managers for SCTM-Mayor.', 1, 90),
(50, '+237696000120', 'Douala', 'Littoral', NULL, 'Talent Acquisition Partner', 'In charge of food manufacturing engineers and commercial managers at Chococam.', 1, 90),
(51, '+237656000121', 'Douala', 'Littoral', NULL, 'National Recruitment Director', 'Directing massive workforce recruitment campaigns for Les Boissons du Cameroun.', 1, 90),
(52, '+237677000122', 'Douala', 'Littoral', NULL, 'Energy Staffing Director', 'Overseeing offshore platform specialists and station managers at TotalEnergies.', 1, 90),
(53, '+237697000123', 'Douala', 'Littoral', NULL, 'Banking HR Lead', 'In charge of credit analysts, auditors, and bank tellers at CBC Bank.', 1, 90),
(54, '+237657000124', 'Yaoundé', 'Center', NULL, 'Petroleum Staffing Partner', 'Directing petrol station engineers and corporate safety officers at Tradex.', 1, 90),
(55, '+237678000125', 'Yaoundé', 'Center', NULL, 'National Broadcasting HR Director', 'Overseeing thousands of media production and telecommunication personnel at CRTV.', 1, 90),
(56, '+237698000126', 'Douala', 'Littoral', NULL, 'TV Recruiting Officer', 'Directing news anchors, scriptwriters and cameramen staffing for Équinoxe.', 1, 90),
(57, '+237658000127', 'Douala', 'Littoral', NULL, 'Electrical Staffing Director', 'In charge of electrical grid workers and regional utility managers at Eneo.', 1, 90);

-- --------------------------------------------------------------------
-- 7. ROLE ENTITY MAPPING FOR EMPLOYERS (IDs 31 to 57)
-- --------------------------------------------------------------------
INSERT INTO `user_role_entities` (`user_id`, `role_entity_id`) VALUES
(31, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(32, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(33, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(34, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(35, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(36, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(37, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(38, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(39, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(40, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(41, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(42, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(43, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(44, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(45, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(46, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(47, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(48, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(49, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(50, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(51, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(52, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(53, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(54, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(55, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(56, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1)),
(57, (SELECT `id` FROM `roles` WHERE `name` = 'ROLE_EMPLOYER' LIMIT 1));

-- --------------------------------------------------------------------
-- 8. COMPANIES (COMPANIES TABLE - IDs 1 to 27)
-- --------------------------------------------------------------------
INSERT INTO `companies` (`id`, `name`, `description`, `sector`, `website_url`, `logo_url`, `city`, `country`, `contact_email`, `contact_phone`, `company_size`, `average_rating`, `rating_count`, `is_active`, `created_at`, `updated_at`, `employer_id`) VALUES
(1, 'United Bank for Africa Cameroon', 'One of Africa\'s leading financial institutions, offering elite banking solutions to businesses and individuals in Cameroon.', 'Banking & Finance', 'https://www.ubacameroon.com', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998913/uba_wzl00s.png', 'Douala', 'Cameroon', 'support@ubacameroon.com', '+237677000101', 'ENTERPRISE', 4.5, 12, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 31),
(2, 'Camtel', 'Cameroon Telecommunications is the national telecommunications and internet service provider of Cameroon.', 'Telecommunications', 'https://www.camtel.cm', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998912/camtel_qspywo.jpg', 'Yaoundé', 'Cameroon', 'info@camtel.cm', '+237699000102', 'ENTERPRISE', 4.0, 8, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 32),
(3, 'Orange Cameroun', 'A premier mobile network operator providing top tier 4G/5G communications and mobile money solutions across Cameroon.', 'Telecommunications', 'https://www.orange.cm', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998911/orange_djx5i3.png', 'Douala', 'Cameroon', 'customer@orange.cm', '+237655000103', 'ENTERPRISE', 4.6, 25, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 33),
(4, 'MTN Cameroon', 'The largest telecommunications provider in Cameroon, committed to driving modern digital transformation and connectivity.', 'Telecommunications', 'https://www.mtn.cm', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998911/mtn_tikiis.png', 'Douala', 'Cameroon', 'help@mtn.cm', '+237678000104', 'ENTERPRISE', 4.4, 30, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 34),
(5, 'Tchokoss Group', 'A prominent local group focusing on international logistics, transit, maritime transport and storage services.', 'Logistics & Transport', 'https://www.tchokoss.com', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998910/tchokoss_ov8ag4.jpg', 'Douala', 'Cameroon', 'contact@tchokoss.com', '+237680000105', 'MEDIUM', 3.8, 4, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 35),
(6, 'Leelou Baby Food', 'Proudly Cameroonian manufacturer creating premium organic baby food products from locally harvested cereals and fruits.', 'Agribusiness & Food', 'https://www.leeloubabyfood.com', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998909/leelou_kki1vz.jpg', 'Douala', 'Cameroon', 'orders@leelou.com', '+237650000106', 'SMALL', 4.8, 15, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 36),
(7, 'Pafic S.A.', 'A pioneer manufacturer in Cameroon focusing on plastics, packaging materials, and consumer household plasticware.', 'Manufacturing', 'https://www.pafic.com', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998908/pafic_k6larl.jpg', 'Yaoundé', 'Cameroon', 'info@pafic.com', '+237671000107', 'MEDIUM', 4.1, 7, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 37),
(8, 'Dovv Distribution', 'A leading local supermarket chain in Yaoundé providing everyday consumer goods, groceries, and fresh produce.', 'Retail & Supermarkets', 'https://www.dovv.cm', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998907/dovv_cewgsb.jpg', 'Yaoundé', 'Cameroon', 'contact@dovv.cm', '+237691000108', 'LARGE', 4.2, 19, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 38),
(9, 'Santa Lucia Supermarket', 'One of the most trusted hypermarkets in Cameroon, offering vast selection of retail merchandise and bakery items.', 'Retail & Supermarkets', 'https://www.santalucia.cm', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998907/santa_lucia_mwiqyb.jpg', 'Yaoundé', 'Cameroon', 'careers@santalucia.cm', '+237651000109', 'LARGE', 4.0, 14, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 39),
(10, 'ANTIC', 'The National Agency for Information and Communication Technologies regulates and secures the IT infrastructure of Cameroon.', 'Information Technology', 'https://www.antic.cm', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998907/antic_ylqfk3.jpg', 'Yaoundé', 'Cameroon', 'contact@antic.cm', '+237672000110', 'MEDIUM', 4.3, 11, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 40),
(11, 'Tentee SARL', 'A highly recognized architecture and building construction company delivering civil engineering excellence in Cameroon.', 'Construction & Real Estate', 'https://www.tentee.com', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998905/sarl_htdn8p.png', 'Douala', 'Cameroon', 'info@tentee.com', '+237693000111', 'SMALL', 3.9, 6, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 41),
(12, 'Megasoft S.A.', 'A premier IT consulting and custom software development agency supplying ERP solutions to Central African enterprises.', 'Information Technology', 'https://www.megasoft.cm', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998904/mega_soft_z2yrdb.jpg', 'Douala', 'Cameroon', 'contact@megasoft.cm', '+237653000112', 'SMALL', 4.7, 10, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 42),
(13, 'Supermont', 'Produced by Source du Pays, Supermont is the most popular, premium natural mineral water brand in Cameroon.', 'Beverages & FMCG', 'https://www.sourcedupays.com', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998904/supermont_oq4m6g.png', 'Douala', 'Cameroon', 'contact@sourcedupays.com', '+237674000113', 'LARGE', 4.5, 18, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 43),
(14, 'Radio Balafon', 'A private commercial radio broadcasting from Douala, highly celebrated for playing the best urban African music.', 'Media & Entertainment', 'https://www.radiobalafon.net', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998904/balafon_cboywy.png', 'Douala', 'Cameroon', 'news@radiobalafon.net', '+237694000114', 'SMALL', 4.6, 21, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 44),
(15, 'Canal 2 International', 'The leading private television network in Cameroon, delivering 24/7 news, culture, and political programs.', 'Media & Entertainment', 'https://www.canal2international.net', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998903/canal_2_nd6mvc.jpg', 'Douala', 'Cameroon', 'jobs@canal2.tv', '+237654000115', 'MEDIUM', 4.2, 17, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 45),
(16, 'Cameroon Civil Aviation Authority', 'The government body overseeing aviation operations, airport security, and aerospace regulation in Cameroon.', 'Aviation & Government', 'https://www.ccaa.aero', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998881/ccaa_wgknb2.jpg', 'Yaoundé', 'Cameroon', 'ccaa@ccaa.aero', '+237675000116', 'LARGE', 4.1, 13, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 46),
(17, 'Port Autonome de Douala', 'The state-managed authority directing shipping operations at the Douala port, the largest entry gateway in Cameroon.', 'Maritime & Logistics', 'https://www.portdedouala-pad.cm', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998881/pod_z6b7gv.png', 'Douala', 'Cameroon', 'contact@portdedouala.cm', '+237695000117', 'LARGE', 4.3, 24, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 47),
(18, 'Azur S.A.', 'A heavy industry company specializing in high-quality soap manufacturing, refining crude palm oil, and household cleaning products.', 'Manufacturing & Soap', 'https://www.azursa.com', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998880/azur_nvwqz4.png', 'Douala', 'Cameroon', 'contact@azursa.com', '+237655000118', 'LARGE', 4.0, 9, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 48),
(19, 'SCTM Mayor', 'A leading local brand offering household consumer essentials, cooking gas cylinders, and refined cooking oils.', 'FMCG & Consumer Goods', 'https://www.sctm-mayor.com', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998880/mayor_alz6pp.jpg', 'Douala', 'Cameroon', 'info@sctm-mayor.com', '+237676000119', 'MEDIUM', 3.7, 5, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 49),
(20, 'Chococam Tiger Brands', 'The chocolate manufacturing giant of Cameroon, producing globally enjoyed brands like Mambo, Chocolat Tartina, and Arina.', 'Agribusiness & Food', 'https://www.chococam.com', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998878/chococam_apjbfh.jpg', 'Douala', 'Cameroon', 'hr@chococam.com', '+237696000120', 'LARGE', 4.6, 22, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 50),
(21, 'Societe Anonyme des Boissons du Cameroun', 'SABC is the dominant beverage, brewing, and packaging enterprise in Cameroon, operating multiple factories nationwide.', 'Beverages & FMCG', 'https://www.lesboissonsducameroun.com', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998878/brasserie_ylso6b.png', 'Douala', 'Cameroon', 'sabc@sabc.cm', '+237656000121', 'ENTERPRISE', 4.7, 45, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 51),
(22, 'TotalEnergies Marketing Cameroun', 'A major distributor of petroleum products, service station networks, and specialized energy solutions in Cameroon.', 'Energy & Petroleum', 'https://totalenergies.cm', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998878/total_wablfr.jpg', 'Douala', 'Cameroon', 'contact@totalenergies.cm', '+237677000122', 'ENTERPRISE', 4.5, 31, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 52),
(23, 'Commercial Bank of Cameroon', 'A top commercial banking institution, empowering local small and medium enterprises with financing and advisory services.', 'Banking & Finance', 'https://www.cbc-bank.com', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998877/cbc_nl8b0p.png', 'Douala', 'Cameroon', 'info@cbc-bank.com', '+237697000123', 'LARGE', 4.4, 16, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 53),
(24, 'Tradex S.A.', 'A major petroleum marketing enterprise supplying heavy industrial fuels, service stations, and marine refueling across Cameroon.', 'Energy & Petroleum', 'https://www.tradexsa.com', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998877/tradex_rqngdm.jpg', 'Yaoundé', 'Cameroon', 'tradex@tradexsa.com', '+237657000124', 'LARGE', 4.3, 18, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 54),
(25, 'CRTV', 'Cameroon Radio Television is the state-funded national television and radio broadcaster of Cameroon.', 'Media & Broadcasting', 'https://www.crtv.cm', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998877/crtv_mt3igc.png', 'Yaoundé', 'Cameroon', 'contact@crtv.cm', '+237678000125', 'LARGE', 3.9, 29, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 55),
(26, 'Equinoxe TV', 'A highly viewed private television station based in Douala, famous for high-caliber investigative journalism and local news broadcasts.', 'Media & Broadcasting', 'https://www.equinoxetv.com', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998877/equinoxe_tv_wcpxzi.jpg', 'Douala', 'Cameroon', 'news@equinoxetv.com', '+237698000126', 'MEDIUM', 4.5, 33, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 56),
(27, 'Eneo Cameroon S.A.', 'The central electrical utility company of Cameroon, supplying electricity generation, distribution, and grid maintenance.', 'Energy & Utilities', 'https://www.eneocameroon.cm', 'https://res.cloudinary.com/dbwumcxvq/image/upload/v1778998876/eneo_pk2qwx.png', 'Douala', 'Cameroon', 'customer@eneo.cm', '+237658000127', 'ENTERPRISE', 3.8, 41, 1, '2026-05-17 07:00:00', '2026-05-17 07:00:00', 57);

-- --------------------------------------------------------------------
-- SEED DATA LOADING COMPLETED SUCCESSFULLY
-- --------------------------------------------------------------------
