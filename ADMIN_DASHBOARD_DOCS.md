# Admin Dashboard Backend Documentation

This document provides a comprehensive overview of the Admin Dashboard Backend module, including the architecture, security, and the REST APIs currently implemented.

## 1. Overview
The Admin Backend Module provides the necessary APIs for the administrator to manage users, jobs, master data (categories, skills), FAQs, and system notifications.

### Implemented Features:
1. **Dashboard Analytics:** Real-time statistics of user registrations.
2. **User Management:** Listing users and soft-deleting/activating accounts.
3. **Job Moderation:** Reviewing, approving, rejecting, and deleting job posts.
4. **Master Data Management:** Managing Categories and Skills used across the platform.
5. **CMS (FAQs):** Managing Frequently Asked Questions.
6. **System Notifications:** Triggering broadcast alerts to all users or specific roles.

---

## 2. Security & Authentication
All endpoints under the `/api/admin/**` path are secured using Spring Security. 
To access these endpoints, the client must provide a valid **JWT Token** in the `Authorization` header, and the user associated with that token must have the `ADMIN` role.

---

## 3. REST API Documentation

### 3.1. Dashboard & Users
- **`GET /api/admin/stats`**: Returns `totalUsers`, `totalJobSeekers`, `totalEmployers`, `totalAdmins`, and `activeUsers`.
- **`GET /api/admin/users`**: Returns a list of all registered users (sanitized via `UserManagementDTO`).
- **`PUT /api/admin/users/{id}/toggle-status`**: Suspends or activates a user account (Soft Delete).

### 3.2. Job Moderation
- **`GET /api/admin/jobs`**: Returns a list of all jobs posted on the platform (via `JobManagementDTO`).
- **`PUT /api/admin/jobs/{id}/approve`**: Changes a job's status to `APPROVED`, making it visible to job seekers.
- **`PUT /api/admin/jobs/{id}/reject`**: Changes a job's status to `REJECTED`.
- **`DELETE /api/admin/jobs/{id}`**: Permanently deletes a job post that violates platform policies.

### 3.3. Master Data: Categories
- **`GET /api/admin/categories`**: Fetches all job categories.
- **`POST /api/admin/categories`**: Creates a new category.
  - Body: `{ "name": "IT", "description": "Information Tech" }`
- **`DELETE /api/admin/categories/{id}`**: Deletes a category.

### 3.4. Master Data: Skills
- **`GET /api/admin/skills`**: Fetches all standard skills.
- **`POST /api/admin/skills`**: Creates a new skill.
  - Body: `{ "name": "Java" }`
- **`DELETE /api/admin/skills/{id}`**: Deletes a skill.

### 3.5. CMS: FAQs
- **`GET /api/admin/faqs`**: Fetches all FAQs.
- **`POST /api/admin/faqs`**: Creates a new FAQ.
  - Body: `{ "question": "How to apply?", "answer": "Click apply.", "isActive": true }`
- **`PUT /api/admin/faqs/{id}`**: Updates an existing FAQ.
- **`DELETE /api/admin/faqs/{id}`**: Deletes an FAQ.

### 3.6. System Notifications
- **`POST /api/admin/notifications/broadcast`**: Sends a system alert to users.
  - Query Params: `title` (required), `message` (required), `targetRole` (optional, e.g., `JOB_SEEKER`).

---

## 4. Architecture
The module follows a standard layered architecture under `JobPortal.project.admin`, `JobPortal.project.job`, and `JobPortal.project.cms`.
