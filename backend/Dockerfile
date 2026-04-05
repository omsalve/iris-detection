# Use a slim Python 3.11 Linux image
FROM python:3.11-slim

# 1. Install system dependencies
# (Replaced libgl1-mesa-glx with libgl1 for modern Debian compatibility)
RUN apt-get update && apt-get install -y \
    cmake \
    gcc \
    g++ \
    make \
    libopenblas-dev \
    liblapack-dev \
    libx11-6 \
    libx11-dev \
    pkg-config \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Upgrade core Python build tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# 3. Build dlib with the CMake policy fix for Python 3.11+
ENV CMAKE_POLICY_VERSION_MINIMUM=3.5
RUN pip install --no-cache-dir dlib==19.24.2 \
    --config-settings="cmake.define.CMAKE_POLICY_DEFAULT_CMP0148=OLD"

# 4. Install face-recognition before the rest of requirements.txt
RUN pip install --no-cache-dir face-recognition==1.3.0

# 5. Copy requirements and install the rest (FastAPI, OpenCV, Firebase)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy your backend code
COPY . .

# 7. Expose Hugging Face's default port (7860) and run Uvicorn
EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]