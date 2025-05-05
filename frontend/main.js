// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { updateUsage, getUsageInfo } from "./usage.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window.db = db;

let userId = null;

function getAnonymousId() {
  let id = localStorage.getItem("anon_id");
  if (!id) {
    id = "guest_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("anon_id", id);
  }
  return id;
}

async function updateUsageUI() {
  const usage = await getUsageInfo(db, userId);
  if (!usage) return;

  const max = usage.plan === "Pro" ? 100 : 10;
  const bar = document.getElementById("usageProgress");
  const text = document.getElementById("usageText");
  const container = document.getElementById("usageProgressContainer");

  bar.max = max;
  bar.value = usage.count;
  text.textContent = `📊 Used: ${usage.count} / ${max} (${usage.plan})`;
  container.classList.remove("hidden");
}

window.updateUsageUI = updateUsageUI;

onAuthStateChanged(auth, async (user) => {
  userId = user ? user.uid : getAnonymousId();
  window.userId = userId;
  await updateUsageUI();
});


