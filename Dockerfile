# F1 tyre-degradation backend — Hugging Face Space (Docker SDK)
FROM python:3.11-slim

# HF Spaces run the container as uid 1000; create that user so runtime
# writes (the fastf1 cache) are owned correctly and not blocked.
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

WORKDIR /home/user/app

# Install dependencies first (own layer -> cached across code-only changes).
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy the backend package (the only thing the server needs).
COPY --chown=user backend ./backend

# matplotlib (via fastf1) needs a writable config/cache dir.
ENV MPLCONFIGDIR=/home/user/app/.mplconfig

# HF Spaces expose the app on port 7860.
EXPOSE 7860
CMD ["uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "7860"]
