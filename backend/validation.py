from typing import List
from fastapi import UploadFile, HTTPException

MAX_FILES = 10
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
VALID_FORMATS = ["png", "jpeg", "webp"]


def validate_uploads(files: List[UploadFile], fmt: str) -> None:
    """Validate uploaded files and target format."""
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"No more than {MAX_FILES} files allowed")

    if fmt.lower() not in VALID_FORMATS:
        raise HTTPException(status_code=400, detail=f"Invalid format '{fmt}'. Valid options: {', '.join(VALID_FORMATS)}")

    for file in files:
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        if size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File '{file.filename}' exceeds {MAX_FILE_SIZE // (1024 * 1024)} MB limit")
