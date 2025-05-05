import { API_CONVERT_URL } from './config.js';
import { getUsageInfo, updateUsage } from './usage.js';

const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const fileCounterTop = document.getElementById('fileCounterTop');
const output = document.getElementById('outputArea');
const downloadZipContainer = document.getElementById('downloadZipContainer');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const dropZone = document.getElementById('dropZone');

let selectedFiles = [];
let convertedBlobs = [];
let isConverting = false;

window.output = output;

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
    output.textContent = "⚠ You can only upload up to 10 images.";
    return;
  }
  const oldBlobs = convertedBlobs.slice();
  selectedFiles = selectedFiles.concat(dropped);
  window.selectedFiles = selectedFiles;
  convertedBlobs = Array(selectedFiles.length).fill(null);
  for (let i = 0; i < oldBlobs.length; i++) {
    convertedBlobs[i] = oldBlobs[i];
  }
  renderFileList();
  updateFileCounters();
});

fileInput.addEventListener('change', () => {
  const files = Array.from(fileInput.files);
  if (selectedFiles.length + files.length > 10) {
    output.textContent = "⚠ You can only upload up to 10 images.";
    return;
  }
  const oldBlobs = convertedBlobs.slice();
  selectedFiles = selectedFiles.concat(files);
  window.selectedFiles = selectedFiles;
  convertedBlobs = Array(selectedFiles.length).fill(null);
  for (let i = 0; i < oldBlobs.length; i++) {
    convertedBlobs[i] = oldBlobs[i];
  }
  fileInput.value = '';
  renderFileList();
  updateFileCounters();
});

function updateFileCounters() {
  fileCounterTop.textContent = selectedFiles.length;
  if (selectedFiles.length === 0) {
    downloadZipContainer.classList.add("hidden");
    output.textContent = "";
    convertedBlobs = [];
  }
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  convertedBlobs.splice(index, 1);
  window.selectedFiles = selectedFiles;
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

    btn.style.display = convertedBlobs[index] ? "inline-flex" : "none";

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = "×";
    removeBtn.onclick = () => removeFile(index);

    actions.appendChild(btn);
    actions.appendChild(removeBtn);
    item.appendChild(info);
    item.appendChild(actions);
    fileList.prepend(item);
  });
}

document.getElementById('convertForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (isConverting) return;
  isConverting = true;

  if (selectedFiles.length === 0) {
    output.textContent = "⚠ Please select at least one image to convert.";
    isConverting = false;
    return;
  }

  if (!window.db || !window.userId) {
    output.textContent = "⚠ User not initialized. Try again later.";
    isConverting = false;
    return;
  }

  try {
    const usage = await getUsageInfo(window.db, window.userId);
    const limit = usage?.plan === 'Pro' ? 100 : 10;
    const used = usage?.count || 0;
    const remaining = limit - used;

    const unconvertedIndexes = selectedFiles
      .map((_, i) => i)
      .filter(i => !convertedBlobs[i]);

    if (unconvertedIndexes.length === 0) {
      output.textContent = "✅ All images already converted.";
      isConverting = false;
      return;
    }

    if (unconvertedIndexes.length > remaining) {
      output.textContent = `⚠ Only ${remaining} of ${unconvertedIndexes.length} new images will be converted due to limits.`;
      unconvertedIndexes.length = remaining;
      if (unconvertedIndexes.length === 0) {
        unconvertedIndexes.splice(remaining);
        output.textContent = "❌ Daily usage limit exceeded. No more images can be converted today.";
        isConverting = false;
        return;
      }
    }

    output.textContent = "⏳ Converting...";
    downloadZipContainer.classList.add("hidden");

    const format = document.getElementById('formatSelect').value;
    const formData = new FormData();
    unconvertedIndexes.forEach(i => {
      formData.append('files', selectedFiles[i]);
    });
    formData.append('format', format);

    const fileItems = [...document.querySelectorAll('.file-item')].reverse();
    unconvertedIndexes.forEach(i => {
      const item = fileItems[i];
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      progressBar.appendChild(progressFill);
      const actions = item.querySelector('.file-actions');
      actions.insertBefore(progressBar, actions.firstChild);
    });

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
    const fileItemsPost = [...document.querySelectorAll('.file-item')].reverse();
    let convertedCount = 0;

    for (let j = 0; j < keys.length; j++) {
      const key = keys[j];
      const file = loaded.files[key];
      const blob = await file.async("blob");
      if (!blob) continue;

      const i = unconvertedIndexes[j];
      convertedBlobs[i] = blob;
      convertedCount++;

      const item = fileItemsPost[i];
      const progress = item.querySelector('.progress-fill');
      if (progress) progress.style.width = "100%";

      setTimeout(() => {
        const btn = item.querySelector('.download-btn');
        btn.style.display = 'inline-flex';
        const progressBar = item.querySelector('.progress-bar');
        if (progressBar) progressBar.remove();
        btn.classList.add('fade-in');
      }, 400);
    }

    if (convertedCount > 0) {
      await updateUsage(window.db, window.userId, convertedCount, null);
      await window.updateUsageUI();
    }

    output.innerHTML = `✅ Conversion complete. ${convertedCount} image(s) converted.`;
    downloadZipContainer.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    output.textContent = "❌ Error: " + err.message;
  } finally {
    isConverting = false;
  }
});

downloadZipBtn.addEventListener('click', async () => {
  const zip = new JSZip();
const format = document.getElementById("formatSelect").value;

selectedFiles.forEach((file, index) => {
  const blob = convertedBlobs[index];
  if (blob instanceof Blob) {
    const filename = file.name.replace(/\.[^/.]+$/, "") + "." + format;
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
