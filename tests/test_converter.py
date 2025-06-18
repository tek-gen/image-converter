import zipfile
from io import BytesIO
from fastapi import UploadFile
from PIL import Image
import pytest

from backend.converter import convert_multiple_images

@pytest.mark.asyncio
async def test_sanitize_path_components():
    img = Image.new("RGB", (1, 1), color="red")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    upload = UploadFile(buf, filename="../nested/evil.png")
    result = await convert_multiple_images([upload], "jpeg")

    with zipfile.ZipFile(result) as z:
        names = z.namelist()
    assert names == ["evil.jpeg"]

