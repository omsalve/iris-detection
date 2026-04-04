FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libopenblas-dev \
    liblapack-dev \
    libx11-6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --upgrade pip setuptools wheel

RUN pip install dlib==19.24.2 --extra-index-url https://pypi.org/simple/ || \
    pip install dlib==19.24.2

RUN pip install face-recognition==1.3.0

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}