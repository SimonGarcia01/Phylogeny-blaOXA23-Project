FROM python:3.12-slim

# Install Java (required for JModelTest2) and basic utilities
RUN apt-get update && apt-get install -y \
    default-jre-headless \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app

# Make sure the Linux binaries are executable
RUN chmod +x app/tools/raxml-ng
RUN chmod +x app/tools/jmodeltest/exe/phyml/PhyML_3.0_linux64

# Expose the FastAPI port
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]