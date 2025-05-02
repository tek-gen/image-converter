const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const fileCounterTop = document.getElementById('fileCounterTop');
const fileCounterBottom = document.getElementById('fileCounterBottom');
const output = document.getElementById('outputArea');
const downloadZipContainer = document.getElementById('downloadZipContainer');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const dropZone = document.getElementById('dropZone');

let selectedFiles = [];
let convertedBlobs = [];

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.style.background = '#d0eaff';
});

dropZone.addEventListener('dragleave', () => {
  dropZone.style.background = '#eef6ff';
});

dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.style.background = '#eef6ff';
  const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
  if (selectedFiles.length + dropped.length > 10) {
    alert("⚠ You can only upload up to 10 images.");
    return;
  }
  selectedFiles = selectedFiles.concat(dropped);
  convertedBlobs = Array(selectedFiles.length).fill(null); // reset
  renderFileList();
  updateFileCounters();
});

fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files);
  if (selectedFiles.length + files.length > 10) {
    alert("⚠ You can only upload up to 10 images.");
    return;
  }
  selectedFiles = selectedFiles.concat(files);
  convertedBlobs = Array(selectedFiles.length).fill(null); // reset
  fileInput.value = ''; // allow re-uploading same files
  renderFileList();
  updateFileCounters();
});

function updateFileCounters() {
    fileCounterTop.textContent = selectedFiles.length;

  if (selectedFiles.length === 0) {
    downloadZipContainer.classList.add("hidden");
    output.textContent = ""; // ✅ убираем текст "✅ Conversion complete"
  }
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  convertedBlobs.splice(index, 1);
  renderFileList();
  updateFileCounters();
}

function renderFileList() {
  fileList.innerHTML = '';
  selectedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'file-item';

    const reader = new FileReader();
    const info = document.createElement('div');
    info.className = 'file-info';

    const img = document.createElement('img');
    const name = document.createElement('span');
    name.textContent = file.name;

    reader.onload = e => img.src = e.target.result;
    reader.readAsDataURL(file);

    info.appendChild(img);
    info.appendChild(name);

    const actions = document.createElement('div');
    actions.className = 'file-actions';

    const btn = document.createElement('button');
    btn.className = "download-btn";
    btn.textContent = "Download";
    btn.onclick = () => {
      const blob = convertedBlobs[index];
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.replace(/\.[^/.]+$/, "") + "." + document.getElementById("formatSelect").value;
      a.click();
    };

    // показываем кнопку, если файл уже был сконвертирован
    if (convertedBlobs[index]) {
      btn.style.display = "inline-flex";
    } else {
      btn.style.display = "none";
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = "×";
    removeBtn.onclick = () => removeFile(index);

    actions.appendChild(btn);
    actions.appendChild(removeBtn);
    item.appendChild(info);
    item.appendChild(actions);
    fileList.appendChild(item);
  });
}

document.getElementById('convertForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (selectedFiles.length === 0) {
    output.textContent = "⚠ Please select at least one image to convert.";
    return;
  }

  output.textContent = "⏳ Converting...";
  convertedBlobs = Array(selectedFiles.length).fill(null);
  downloadZipContainer.classList.add("hidden");

  const format = document.getElementById('formatSelect').value;
  const formData = new FormData();
  selectedFiles.forEach(file => formData.append('files', file));
  formData.append('format', format);

  const fileItems = document.querySelectorAll('.file-item');
  fileItems.forEach(item => {
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressBar.appendChild(progressFill);
    const actions = item.querySelector('.file-actions');
    actions.insertBefore(progressBar, actions.firstChild);
  });

  try {
    const response = await fetch(API_CONVERT_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Conversion failed');

    const zip = await response.blob();
    const zipBuffer = await zip.arrayBuffer();
    const zipData = new JSZip();
    const loaded = await zipData.loadAsync(zipBuffer);

    const keys = Object.keys(loaded.files);
    const fileItems = document.querySelectorAll('.file-item');

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const file = loaded.files[key];
      const blob = await file.async("blob");
      convertedBlobs[i] = blob;

      const item = fileItems[i];
      const progress = item.querySelector('.progress-fill');
      if (progress) progress.style.width = "100%";

      setTimeout(() => {
        const btn = item.querySelector('.download-btn');
        btn.style.display = 'inline-flex';
        btn.classList.add('fade-in');
        const progressBar = item.querySelector('.progress-bar');
        if (progressBar) progressBar.remove();
      }, 400);
    }

    output.innerHTML = "✅ Conversion complete.";
    downloadZipContainer.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    output.textContent = "❌ Error: " + err.message;
  }
});

downloadZipBtn.addEventListener('click', async () => {
  const zip = new JSZip();
  selectedFiles.forEach((file, index) => {
    const blob = convertedBlobs[index];
    if (blob) {
      const filename = file.name.replace(/\.[^/.]+$/, "") + "." + document.getElementById("formatSelect").value;
      zip.file(filename, blob);
    }
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "converted_images.zip";
  a.click();
});
