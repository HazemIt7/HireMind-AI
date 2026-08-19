# 🧠 HireMind AI — Next-Generation SaaS Recruitment Platform

> **HireMind AI** is an end-to-end, AI-powered recruitment platform combining a **Mobile App for Candidates (Flutter)**, a **Recruiter Web Portal (Next.js 16)**, and an **AI Core Backend (NestJS)** equipped with **Qdrant Vector DB**, **Adaptive Interview Engine**, and a **Safe Code Sandbox**.

---

## 🌟 Key Features

### 💻 1. Recruiter Web Studio (`hiremind_web`)
* **ATS Kanban Pipeline**: Interactive drag-and-drop candidate management across 6 customizable status columns.
* **Skill Passport Radar**: Dynamic 5-axis visualization (*Software Dev, Cybersecurity, Networks, Systems, Soft Skills*).
* **AI Job Generator**: Generate complete, structured job postings with market salary recommendations from quick natural language prompts.
* **IA Copilot RH**: Interactive AI assistant side-drawer capable of comparing candidates, summarizing pipeline metrics, and recommending top profiles.
* **State Persistence**: Browser `localStorage` persistence ensuring ATS pipeline movements survive reloads.

### 📱 2. Mobile Candidate App (`hiremind_mobile`)
* **CV Upload & Parsing**: Instant PDF upload connected to NestJS parsing microservices.
* **Interactive Skill Passport**: Visual radar chart generated from AI-extracted technical and methodological skills.
* **Adaptive AI Interviews**: Dynamic question tree adapting to candidate performance in real time.

### ⚙️ 3. Core Backend & AI Services (`hiremind_backend`)
* **Qdrant Vector DB Integration**: 16-dimensional Cosine Similarity embeddings for semantic candidate-to-job matching.
* **CV Parsing Engine**: Dynamic extraction of identity, contact info, and 50+ technical/methodological skill keywords.
* **Technical Code Sandbox**: Multi-language isolated runner (Python, JavaScript/Node) with execution metrics and anti-cheat/plagiarism inspection.
* **Multi-Database Architecture**: PostgreSQL (Auth & Billing via TypeORM), MongoDB (Domain models via Mongoose), Redis (Caching/Queues).

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Mobile App** | **Flutter / Dart** | Cross-platform candidate app with native UI & Audio |
| **Web Portal** | **Next.js 16 / React 19** | TailwindCSS v4, Framer Motion, Lucide Icons, Glassmorphism UI |
| **Core Backend** | **NestJS 11 / TypeScript** | REST API, Swagger OpenAPI, Clean Architecture & DDD |
| **Vector DB** | **Qdrant Vector DB** | 16-D Cosine distance vector embeddings |
| **Databases** | **PostgreSQL & MongoDB** | TypeORM (Relational) + Mongoose (Document) |
| **Storage & Cache** | **MinIO & Redis** | S3-compatible file storage & In-memory cache |
| **Infrastructure** | **Docker & Docker Compose** | Multi-container orchestration |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) & Docker Compose
- [Flutter SDK](https://flutter.dev/) (for mobile app)

### 1. Launch Docker Infrastructure
```bash
docker-compose up -d
```
*Services started:*
- Qdrant Vector DB: `http://localhost:6333`
- PostgreSQL: `localhost:5432`
- MongoDB: `localhost:27017`
- Redis: `localhost:6379`
- MinIO: `http://localhost:9000`

### 2. Start Core Backend (NestJS)
```bash
cd hiremind_backend
npm install
npm run start:dev
```
- API Base URL: `http://localhost:3000/api/v1`
- Swagger Documentation: `http://localhost:3000/api-docs`

### 3. Start Recruiter Web Studio (Next.js)
```bash
cd hiremind_web
npm install
npm run dev
```
- Web Application: `http://localhost:3001`

### 4. Start Mobile Candidate App (Flutter)
```bash
cd hiremind_mobile
flutter pub get
flutter run
```

---

## 📁 Repository Structure

```
stage/
├── docker-compose.yml           # Infrastructure services (PostgreSQL, Mongo, Redis, Qdrant, MinIO)
├── hiremind_backend/            # NestJS Core API & AI Engines
├── hiremind_web/                # Next.js Recruiter Studio & ATS Kanban
├── hiremind_mobile/             # Flutter Candidate Mobile Application
├── api-spec/                    # OpenAPI / Swagger contracts
└── Cahier des Charges...pdf     # Project Specifications Document
```

---

## 📜 License

This project is licensed under the **MIT License**.
