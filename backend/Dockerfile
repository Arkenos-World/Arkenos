# Arkenos Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Copy everything and install (non-editable for production reliability)
COPY . .
RUN pip install --no-cache-dir .

# Expose port
EXPOSE 8000

# Copy and prepare startup script
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
