FROM python:3.11-slim

WORKDIR /app

# Install libmagic system library
RUN apt-get update && apt-get install -y libmagic1 libmagic-dev && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Start server
CMD uvicorn main:app --host 0.0.0.0 --port $PORT