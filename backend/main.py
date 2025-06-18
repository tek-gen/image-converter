from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from io import BytesIO
import os
from converter import convert_multiple_images

app = FastAPI()

# Настройка CORS. Разрешённые источники можно задать через переменную
# окружения FRONTEND_ORIGINS (список URL через запятую). По умолчанию
# разрешены все источники.
frontend_origins = os.getenv("FRONTEND_ORIGINS", "*")
allowed_origins = (
    [origin.strip() for origin in frontend_origins.split(",")]
    if frontend_origins != "*"
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/convert")
async def convert(
    files: List[UploadFile] = File(...),
    format: str = Form(...)
):
    # Обработка файлов и упаковка в ZIP
    zip_io = await convert_multiple_images(files, format)

    return StreamingResponse(
        zip_io,
        media_type="application/zip",
        headers={
            "Content-Disposition": "attachment; filename=converted_images.zip"
        }
    )
