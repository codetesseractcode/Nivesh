# ML Services Dockerfile
# Uses official PyTorch CUDA base image (Python 3.10 + PyTorch 2.2 + CUDA 12.1 pre-installed)
# No local dependency installation needed — everything runs inside Docker

FROM pytorch/pytorch:2.2.0-cuda12.1-cudnn8-runtime

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy and install remaining requirements
# Remove torch lines from requirements — already provided by the base image
COPY requirements.txt .
RUN grep -v '^torch' requirements.txt > requirements_notorch.txt \
    && pip install --no-cache-dir -r requirements_notorch.txt \
    && rm requirements_notorch.txt

# Download spaCy model
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run FastAPI server
# Workers configurable via WEB_CONCURRENCY env var (default: 2)
CMD ["sh", "-c", "exec gunicorn model_server.app:app --worker-class uvicorn.workers.UvicornWorker --workers ${WEB_CONCURRENCY:-2} --bind 0.0.0.0:8000 --timeout 120 --keep-alive 5 --access-logfile -"]
