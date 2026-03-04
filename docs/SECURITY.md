# Security Guide — Nivesh Platform

This document defines the secrets management strategy, rotation procedures, and security best practices for the Nivesh financial platform.

---

## Table of Contents

1. [Secrets Management Overview](#secrets-management-overview)
2. [Local Development](#local-development)
3. [Docker Compose](#docker-compose)
4. [Kubernetes Secrets (Production)](#kubernetes-secrets-production)
5. [Secret Rotation Procedures](#secret-rotation-procedures)
6. [Pre-commit Secret Detection](#pre-commit-secret-detection)
7. [CI/CD Secret Scanning](#cicd-secret-scanning)
8. [Incident Response](#incident-response)

---

## Secrets Management Overview

| Environment   | Strategy                              | Rotation          |
| ------------- | ------------------------------------- | ----------------- |
| Local dev     | `.env` file (git-ignored)             | N/A               |
| CI/CD         | GitHub Actions Secrets                | On key events     |
| Staging       | ExternalSecrets → HashiCorp Vault     | Automated         |
| Production    | ExternalSecrets → HashiCorp Vault     | Automated + audit |

**Golden Rules:**
- Never commit real secrets to version control
- Never use default/example passwords in production
- All secrets must be rotatable without downtime
- All secret access must be auditable

---

## Local Development

1. Copy the env example files:
   ```bash
   cp docker-compose.env.example .env              # Docker Compose passwords
   cp backend/.env.example backend/.env             # Backend app config
   cp ml-services/.env.example ml-services/.env     # ML services config
   ```

2. Generate secure local secrets:
   ```bash
   # JWT Secret (min 32 chars)
   openssl rand -hex 32

   # Encryption Key (exactly 32 chars)
   openssl rand -hex 16

   # Database passwords
   openssl rand -base64 24
   ```

3. The `.env` files are listed in `.gitignore` and will never be committed.

---

## Docker Compose

All credentials in `docker-compose.yml` use `${VAR}` substitution. **No passwords are hardcoded.**

Docker Compose reads variables from:
1. Shell environment variables
2. `.env` file in the project root (auto-loaded)

Required variables (will fail fast if missing):
- `POSTGRES_PASSWORD`
- `NEO4J_PASSWORD`
- `MONGO_PASSWORD`
- `REDIS_PASSWORD`
- `CLICKHOUSE_PASSWORD`

Optional variables (have defaults for dev):
- `POSTGRES_USER` (default: `nivesh_user`)
- `POSTGRES_DB` (default: `nivesh_db`)
- `GRAFANA_ADMIN_USER` (default: `admin`)

---

## Kubernetes Secrets (Production)

### Using ExternalSecrets Operator with HashiCorp Vault

1. **Install ExternalSecrets Operator:**
   ```bash
   helm repo add external-secrets https://charts.external-secrets.io
   helm install external-secrets external-secrets/external-secrets \
     -n external-secrets --create-namespace
   ```

2. **Configure ClusterSecretStore:**
   ```yaml
   apiVersion: external-secrets.io/v1beta1
   kind: ClusterSecretStore
   metadata:
     name: vault-backend
   spec:
     provider:
       vault:
         server: "https://vault.nivesh.internal:8200"
         path: "secret"
         version: "v2"
         auth:
           kubernetes:
             mountPath: "kubernetes"
             role: "nivesh-backend"
   ```

3. **Create ExternalSecret for backend:**
   ```yaml
   apiVersion: external-secrets.io/v1beta1
   kind: ExternalSecret
   metadata:
     name: nivesh-backend-secrets
     namespace: nivesh
   spec:
     refreshInterval: 1h
     secretStoreRef:
       kind: ClusterSecretStore
       name: vault-backend
     target:
       name: nivesh-backend-secret
       creationPolicy: Owner
     data:
       - secretKey: JWT_SECRET
         remoteRef:
           key: nivesh/backend
           property: jwt_secret
       - secretKey: ENCRYPTION_KEY
         remoteRef:
           key: nivesh/backend
           property: encryption_key
       - secretKey: DATABASE_URL
         remoteRef:
           key: nivesh/backend
           property: database_url
       - secretKey: REDIS_PASSWORD
         remoteRef:
           key: nivesh/backend
           property: redis_password
       - secretKey: NEO4J_PASSWORD
         remoteRef:
           key: nivesh/backend
           property: neo4j_password
       - secretKey: MONGO_PASSWORD
         remoteRef:
           key: nivesh/backend
           property: mongo_password
       - secretKey: CLICKHOUSE_PASSWORD
         remoteRef:
           key: nivesh/backend
           property: clickhouse_password
   ```

4. **Reference in Deployment:**
   ```yaml
   envFrom:
     - secretRef:
         name: nivesh-backend-secret
   ```

### Alternative: Sealed Secrets (simpler, no Vault needed)

```bash
# Install Sealed Secrets controller
helm install sealed-secrets sealed-secrets/sealed-secrets -n kube-system

# Encrypt a secret
echo -n "my-jwt-secret-value" | kubeseal --raw \
  --from-file=/dev/stdin --namespace nivesh --name nivesh-backend-secret
```

---

## Secret Rotation Procedures

### JWT Secret — Rotate every 90 days

1. Generate a new JWT secret:
   ```bash
   NEW_SECRET=$(openssl rand -hex 32)
   ```

2. Update Vault (or your secrets store):
   ```bash
   vault kv put nivesh/backend jwt_secret=$NEW_SECRET
   ```

3. Deploy with **dual-secret support** (overlap window):
   - Set `JWT_SECRET` to the new value
   - Set `JWT_SECRET_PREVIOUS` to the old value
   - The auth middleware should accept tokens signed with either secret during the overlap window (default: 7 days)

4. After the overlap window, remove `JWT_SECRET_PREVIOUS`

### Encryption Key — Rotate every 180 days

> ⚠️ **Critical**: Encryption key rotation requires re-encrypting all existing encrypted data.

1. Generate new key: `openssl rand -hex 16`
2. Run the re-encryption migration script (TBD)
3. Update the key in Vault
4. Deploy and verify

### Database Passwords — Rotate every 180 days

1. Create new credentials in the database
2. Update Vault with new credentials
3. ExternalSecrets auto-syncs within `refreshInterval`
4. Rolling restart of affected services
5. Drop old credentials after verification

### API Keys — Rotate on team member offboarding

1. Immediately revoke all API keys associated with the departing member
2. Regenerate any shared API keys
3. Audit access logs for the 30 days prior to offboarding

---

## Pre-commit Secret Detection

We use [detect-secrets](https://github.com/Yelp/detect-secrets) to prevent accidentally committing real secrets.

### Setup

```bash
pip install pre-commit detect-secrets
pre-commit install

# Create initial baseline (marks existing false positives)
detect-secrets scan > .secrets.baseline
```

### Usage

- Pre-commit hook runs automatically on `git commit`
- To scan all files manually: `pre-commit run detect-secrets --all-files`
- To update baseline after resolving findings: `detect-secrets scan --update .secrets.baseline`

---

## CI/CD Secret Scanning

### GitHub Actions — scan every PR

```yaml
# .github/workflows/secret-scan.yml
name: Secret Scan
on: [pull_request]
jobs:
  detect-secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install detect-secrets
      - run: detect-secrets scan --baseline .secrets.baseline
      - run: detect-secrets audit --report --baseline .secrets.baseline
```

### GitHub Advanced Security

If available, enable:
- **Secret scanning** — detects known secret patterns from 100+ providers
- **Push protection** — blocks pushes containing secrets before they reach the repo

---

## Incident Response

If a secret is accidentally committed:

1. **Immediately rotate** the exposed secret
2. **Force-push** to remove from Git history:
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch <file>' HEAD
   git push origin --force --all
   ```
3. **Audit** access logs for unauthorized usage
4. **Notify** the security team and affected users
5. **Post-mortem** — update pre-commit rules to prevent recurrence

> **Important:** Even after force-pushing, assume the secret is compromised. GitHub caches commits and forks may retain the data. Always rotate.
