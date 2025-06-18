
# 🖼️ Image Converter (FastAPI backend)

This is a FastAPI-based backend for converting up to 10 uploaded images to the desired format (PNG, JPEG, WEBP), returning them as a single ZIP archive.

---

## 🔧 Features

- Endpoint: `POST /convert`
- Accepts up to 10 images via multipart form
- Returns a ZIP archive with converted images
- Uses `Pillow` and `python-multipart`
- Separated logic in `converter.py`

### CORS configuration

The backend reads allowed origins from the `FRONTEND_ORIGINS` environment
variable. Provide a comma-separated list of frontend URLs, e.g.:

```bash
export FRONTEND_ORIGINS="http://localhost:8080,https://myapp.example.com"
```

When not set, all origins are allowed (useful for local development).

---

## 🛠 Local Run

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## 🚀 Deploy to Render

Click below to deploy instantly to Render:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

---

**Author:** [tek-gen](https://github.com/tek-gen)
