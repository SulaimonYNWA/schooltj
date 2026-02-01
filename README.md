# 🇹🇯 Education CRM (Tajikistan)

A scalable, full-stack Customer Relationship Management (CRM) and Learning Management System (LMS) designed specifically for the educational sector in Tajikistan.

This platform bridges the gap between **Schools**, **Independent Teachers**, and **Students**, providing a unified ecosystem for course management, enrollment, and payments.

---

## 🚀 Project Overview

The system is designed to handle the specific nuances of the local market, including:
- **Hybrid Teaching Models:** Supporting both established schools (Gymnasiums, Private Schools) and independent tutors.
- **Localization:** Built from the ground up to support **Tajik**, **Russian**, and **English**.
- **Local Payments:** Architecture ready for integration with **Alif**, **Humo**, and **Korti Milli**.

### User Roles
1.  **School Admin:** Manages a school entity, hires teachers, creates official courses, and views school-wide analytics.
2.  **Independent Teacher:** Operates as a freelancer. Creates their own courses and manages direct payments.
3.  **Student:** Browses the marketplace, enrolls in courses, and tracks progress.
4.  **Teacher (School Affiliate):** Assigned to a school. Teaches courses created by the school admin.

---

## 🛠 Tech Stack

### Backend
- **Language:** Golang (1.21+)
- **Architecture:** Clean Architecture (Handlers -> Services -> Repositories)
- **Router:** Chi / Echo (depending on implementation)
- **Auth:** JWT (JSON Web Tokens)
- **Database:** MySQL 8.0

### Frontend
- **Framework:** ReactJS (Vite)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **State/Data:** React Query + Context API
- **HTTP Client:** Axios (with Interceptors)

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Migrations:** SQL-based migration files

---

## 📂 Project Structure (Monorepo)

```text
├── cmd/
│   ├── api/            # Main entry point for the REST API
│   └── seed/           # Script to populate DB with dummy data
├── internal/
│   ├── config/         # Configuration loading (Env vars)
│   ├── domain/         # Structs and Interfaces
│   ├── handler/        # HTTP Handlers (Controllers)
│   ├── service/        # Business Logic
│   └── repository/     # Database Access Layer
├── migrations/         # Raw SQL migration files (Up/Down)
├── web/                # React Frontend application
├── docker-compose.yml  # Container orchestration
└── Makefile            # Shortcut commands