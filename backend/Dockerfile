FROM python:3.11-slim

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
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --upgrade pip setuptools wheel

RUN pip install cmake

RUN pip install dlib==19.24.2 \
    --config-settings="cmake.args=-DCMAKE_POLICY_VERSION_MINIMUM=3.5"

RUN pip install face-recognition==1.3.0

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}