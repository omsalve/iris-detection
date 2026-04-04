FROM python:3.11-slim

RUN apt-get update && apt-get install -y cmake gcc g++ make libopenblas-dev liblapack-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --upgrade pip setuptools wheel

RUN CMAKE_ARGS="-DCMAKE_POLICY_VERSION_MINIMUM=3.5 -DDLIB_NO_GUI_SUPPORT=ON" DLIB_NO_GUI_SUPPORT=1 pip install dlib==19.24.2

RUN pip install face-recognition==1.3.0

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}