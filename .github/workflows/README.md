# GitHub Actions Workflows

This directory contains CI/CD workflows for the PocketFlow project.

## Workflows

### 📋 CI Workflow (`ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
1. **Frontend Tests**
   - Sets up Node.js 18
   - Installs dependencies with `npm ci`
   - Runs ESLint
   - Builds the Next.js application

2. **Backend Tests**
   - Sets up Python 3.11
   - Starts MongoDB service container
   - Installs dependencies
   - Runs pytest tests

3. **Docker Build**
   - Tests Docker image builds
   - Validates docker-compose configuration

### 🚀 Deploy Workflow (`deploy.yml`)

Runs on:
- Pushes to `main` branch
- Version tags (e.g., `v1.0.0`)

**Jobs:**
1. **Docker Deploy**
   - Builds Docker images
   - Pushes to Docker Hub (requires secrets)

## Required Secrets

To enable Docker deployment, add these secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub access token

## Running Tests Locally

### Frontend
```bash
cd frontend
npm install
npm run lint
npm run build
```

### Backend
```bash
cd backend
pip install -r requirements-dev.txt
pytest tests/ -v
```

## Badges

Add these badges to your README.md:

```markdown
![CI](https://github.com/SimonLund192/PocketFlow/workflows/CI/badge.svg)
![Deploy](https://github.com/SimonLund192/PocketFlow/workflows/Deploy/badge.svg)
```
