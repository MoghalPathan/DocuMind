FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --default-timeout=600 --retries 10 torch==2.14.1+cpu --extra-index-url https://download.pytorch.org/whl/cpu

RUN --mount=type=cache,target=/root/.cache/pip \
    grep -v -e pywin32 -e "^torch==" requirements.txt > req.txt && \
    pip install --default-timeout=600 --retries 10 -r req.txt


COPY backend/ backend/
COPY frontend/ frontend/
RUN mkdir -p data

ENV PYTHONUNBUFFERED=1
EXPOSE 8000 8501
CMD ["uvicorn", "main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000"]
