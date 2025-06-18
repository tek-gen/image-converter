from PIL import Image
from io import BytesIO
from zipfile import ZipFile
from typing import List
from fastapi import UploadFile
import os
import re

async def convert_multiple_images(files: List[UploadFile], target_format: str) -> BytesIO:
    zip_io = BytesIO()

    with ZipFile(zip_io, 'w') as zip_file:
        for i, file in enumerate(files):
            # Чтение файла
            input_bytes = await file.read()
            image = Image.open(BytesIO(input_bytes))

            # Приведение к RGB (если нужно для JPEG/WEBP)
            if target_format.lower() in ["jpeg", "jpg", "webp"] and image.mode in ("RGBA", "P"):
                image = image.convert("RGB")

            # Конвертация
            output_io = BytesIO()
            image.save(output_io, format=target_format.upper())
            output_io.seek(0)

            # Добавление в ZIP с оригинальным именем
            # Защита от передачи путей в имени файла
            sanitized = os.path.basename(file.filename)
            sanitized = re.sub(r"[\\/:]+", "_", sanitized)
            base_name = sanitized.rsplit('.', 1)[0]
            zip_name = f"{base_name}.{target_format.lower()}"
            zip_file.writestr(zip_name, output_io.read())

    zip_io.seek(0)
    return zip_io
