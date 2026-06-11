<div align="center">
  <h1>🛡️ DocuVault</h1>
  <p><b>Secure Enterprise-Grade Document Management System (DMS)</b></p>
  
  [![Go](https://img.shields.io/badge/Go-1.22-00ADD8.svg?style=flat&logo=go)](https://golang.org)
  [![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?style=flat&logo=postgresql)](https://www.postgresql.org/)
  [![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?style=flat&logo=docker)](https://www.docker.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

<hr>

## 📖 Project Overview

**DocuVault** is a secure, enterprise-grade Document Management System (DMS) built with a modern full-stack architecture. Designed for MCA project evaluation and professional enterprise use, it provides robust capabilities for secure document storage, advanced role-based and department-based access control, file integrity verification, and seamless collaboration.


## ✨ Core Features

- 🔐 **Security & Access Control**
  - **JWT Authentication & Authorization**: Secure stateless sessions.
  - **Role-Based Access Control (RBAC)**: Supports roles like `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `EMPLOYEE`, and `VIEWER`.
  - **Department-Based Access Control**: Isolate documents and resources by organizational departments.
- 📄 **Document Management**
  - **Upload & Download**: Secure file handling.
  - **File Integrity Verification**: SHA-256 hash checks to prevent tampering.
  - **Granular Sharing**: Share documents based on specific Users, Roles, or Departments.
  - **Advanced Search & Filtering**: Quickly find documents using metadata, categories, and tags.
  - **Soft Delete & Restore**: Recover accidentally deleted files from a secure recycle bin.
- 📊 **Monitoring & Administration**
  - **Audit Logging**: Comprehensive tracking of all critical system actions.
  - **Dashboard Analytics**: Visual insights into system usage, storage, and user activity.
  - **SMTP Notifications**: Automated email alerts for sharing and system events.
- 🚀 **Infrastructure**
  - **Dockerized Deployment**: Easy to spin up using Docker Compose.
  - **RESTful APIs**: Documented with OpenAPI/Swagger.

## 🛠️ Technology Stack

| Component | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, React Router, React Hook Form, Zod, Axios |
| **Backend** | Go (Golang), Gin Framework, Clean Architecture, JWT, bcrypt, Swagger/OpenAPI |
| **Database & ORM** | PostgreSQL, GORM |
| **Infrastructure**| Docker, Docker Compose |
| **Testing** | Vitest, React Testing Library, MSW (Frontend) \| Go testing, Testify, Mockery (Backend) |



## 🚀 Quick Start & Installation

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Go 1.22+](https://go.dev/doc/install) (for local backend development)
- [Node.js 20+](https://nodejs.org/en/) (for local frontend development)

### Running with Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/docuvault.git
   cd docuvault
   ```

2. **Set up Environment Variables:**
   - Copy `.env.example` files to `.env` in both `backend` and `frontend` directories, configuring your database and SMTP details.

3. **Start the application:**
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application:**
   - Frontend UI: `http://localhost:5173`
   - Backend API: `http://localhost:8080/api/v1`
   - Swagger Docs: `http://localhost:8080/swagger/index.html`

## 📁 Repository Structure

```text
docuvault/
├── backend/               # Go API server & database logic
│   ├── cmd/               # Application entry points
│   ├── internal/          # Clean architecture layers (handlers, services, repositories)
│   └── pkg/               # Reusable packages (auth, hashing, db)
├── frontend/              # React single-page application
│   ├── src/               # UI components, pages, state management
│   └── public/            # Static assets
├── docker-compose.yml     # Orchestration configuration
└── README.md              # Project documentation
```

## 📚 Detailed Documentation

Dive deeper into the specific stacks:

```md
📦 Backend Documentation → ./backend/README.md

🎨 Frontend Documentation → ./frontend/README.md
```

## 🚢 Deployment

DocuVault is container-ready. For production deployments:
1. Ensure strong, secure `.env` variables (secrets, complex DB passwords).
2. Configure a reverse proxy (like Nginx or Traefik) for SSL termination.
3. Deploy the `docker-compose.yml` to your VPS or cloud provider (AWS EC2, DigitalOcean, etc.).

## 🔮 Future Enhancements

- **OAuth2 / SSO Integration**: Google Workspace & Microsoft Azure AD logins.
- **Document Versioning**: Track changes and restore previous versions of files.
- **AI-Powered OCR**: Extract and search text content from uploaded images and PDFs.
- **Watermarking**: Automatic document watermarking on download.

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

---
*Built as a comprehensive MCA Project demonstrating full-stack engineering, clean architecture, and modern security practices.*
