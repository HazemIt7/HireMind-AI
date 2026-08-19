# 🧠 HireMind AI — Next-Generation SaaS Recruitment Platform

> **HireMind AI** is a comprehensive, end-to-end AI-powered recruitment platform combining a **Mobile App for Candidates (Flutter)**, a **Multi-Role Web Portal (Next.js 16)** for Candidates, Recruiters, and Super Admins, and an **AI Core Backend (NestJS)** powered by an **Open-Source Local LLM (Ollama)**, **Qdrant Vector DB**, **Adaptive AI Interview Engine**, and a **Safe Code Sandbox**.

---

## 🌟 Key Features

### 👤 1. Dedicated Candidate Portals (Web & Mobile)
* **Web Espace Candidat (`hiremind_web`)**:
  * **Interactive PDF CV Uploader**: Instant drag-and-drop CV upload connected to open-source LLM parsing.
  * **Skill Passport IA (Radar)**: Dynamic 5-axis visual graphic (*Software Dev, Cybersecurity, Networks, Systems, Soft Skills*).
  * **Live AI Adaptive Interview Modal**: Interactive step-by-step AI interview engine with real-time question generation. Upon completion, candidate matching scores and interview summaries are automatically routed to the recruiter's ATS Kanban pipeline.
* **Mobile Candidate App (`hiremind_mobile`)**:
  * Cross-platform Flutter application with native Dio HTTP client optimized with 60-second timeouts for local LLM parsing on CPU.
  * Instant sync of Skill Passport and candidate data between Web and Mobile spaces.

### 👔 2. Recruiter Studio & Admin Platform (`hiremind_web`)
* **Multi-Role Authentication**: Secure login/logout and session management supporting **Candidates**, **Recruiters**, and a **Super Admin** with complete platform control.
* **ATS Kanban Pipeline**: Drag-and-drop candidate management across 6 customizable hiring stages with persistent state across reloads (`localStorage`).
* **AI Recruiter Recommendation Engine**: Deep per-job AI analysis answering *"Who is the best candidate for this specific job offer and why?"* with comparative breakdown cards.
* **AI Job Generator**: Natural language prompt-to-job listing generator with market salary recommendations.
* **IA Copilot RH**: Interactive side-drawer assistant capable of comparing candidates, summarizing pipeline metrics, and querying Qdrant Vector DB embeddings.

### ⚙️ 3. Core Backend & Local Open-Source LLM (`hiremind_backend`)
* **Open-Source Local LLM (Ollama + `qwen2.5:1.5b`)**: 0-API-cost CV parsing, semantic domain classification (`SoftwareDev`, `Cybersecurity`, `DevOps`, `Networks`), and role analysis.
* **Domain-Scoped Keyword Scoping Engine**: Precise keyword taxonomy recognizing 50+ SOC, EDR, SIEM, Blue Team (*Splunk, Sentinel, Wazuh, CrowdStrike, MITRE ATT&CK, Security+*), DevOps, and Software Development skills.
* **Qdrant Vector DB Integration**: 16-dimensional Cosine Similarity embeddings for instant semantic candidate-to-job vector matching.
* **Technical Code Sandbox**: Isolated multi-language runner (Python, JavaScript/Node) with execution metrics and anti-cheat code analysis.
* **Multi-Database Architecture**: PostgreSQL (TypeORM for Auth & Relational entities) + MongoDB (Mongoose for document storage) + Redis (In-memory caching).

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Mobile App** | **Flutter / Dart** | Cross-platform candidate app with Dio HTTP client & Custom Canvas Radar |
| **Web Portal** | **Next.js 16 / React 19** | TailwindCSS v4, Framer Motion, Lucide Icons, Glassmorphism UI |
| **Core Backend** | **NestJS 11 / TypeScript** | REST API, Swagger OpenAPI, Clean Architecture & DDD |
| **Local LLM** | **Ollama (`qwen2.5:1.5b`)** | 0-cost local LLM for CV parsing & AI Recruiter Recommendations |
| **Vector DB** | **Qdrant Vector DB** | 16-D Cosine distance candidate-job embedding matching |
| **Databases** | **PostgreSQL & MongoDB** | TypeORM (Relational) + Mongoose (Document Storage) |
| **Storage & Cache** | **MinIO & Redis** | S3-compatible file storage & In-memory cache |
| **Infrastructure** | **Docker & Docker Compose** | Multi-container orchestration |

---

## 📊 Skill Radar Benchmark Results

| Skill Radar Axis | 👨‍💻 Backend Developer Profile | 🛡️ SOC Analyst Profile |
| :--- | :---: | :---: |
| **Software Dev** | **98%** | **20%** |
| **Cybersécurité** | **15%** | **98%** |
| **Réseaux** | **30%** | **90%** |
| **Systèmes & DevOps** | **70%** | **75%** |
| **Soft Skills** | **65%** | **86%** |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) & Docker Compose
- [Ollama](https://ollama.com/) (with model `qwen2.5:1.5b` installed: `ollama pull qwen2.5:1.5b`)
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

### 3. Start Multi-Role Web Studio (Next.js)
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
├── hiremind_backend/            # NestJS Core API, Local Ollama LLM Service & AI Engines
├── hiremind_web/                # Next.js Multi-Role Studio (Candidate, Recruiter, Super Admin)
├── hiremind_mobile/             # Flutter Candidate Mobile Application
├── api-spec/                    # OpenAPI / Swagger contracts
└── Cahier des Charges...pdf     # Project Specifications Document
```

---

## 📜 License

This project is licensed under the **MIT License**.
