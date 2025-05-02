from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from io import BytesIO
from converter import convert_multiple_images

app = FastAPI()

# Разрешаем запросы от любых источников (для локального frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
