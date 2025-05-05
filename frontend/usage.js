// usage.js
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

/**
 * Обновляет лимит использования (по количеству файлов)
 * @param {Firestore} db - Firestore instance
 * @param {string} userId - UID пользователя или гость
 * @param {number} countDelta - сколько файлов сейчас
 * @param {HTMLElement} outputEl - элемент для вывода сообщения
 * @returns {Promise<boolean>} - можно ли продолжать
 */
export async function updateUsage(db, userId, countDelta = 1, outputEl = null) {
  const userRef = doc(db, "usage", userId);
  const today = new Date().toDateString();
  const docSnap = await getDoc(userRef);

  let data = {
    count: 0,
    lastUsed: today,
    plan: "Free",
    userId,
  };

  if (docSnap.exists()) {
    data = docSnap.data();
    if (data.lastUsed !== today) {
      data.count = 0;
      data.lastUsed = today;
    }
  }

  const max = data.plan === "Pro" ? 100 : 10;
  const nextTotal = data.count + countDelta;

  if (nextTotal > max) {
    if (outputEl) {
      outputEl.textContent = `❌ Daily limit reached (${data.count}/${max}).`;
    }
    return false;
  }

  await setDoc(userRef, {
    ...data,
    count: nextTotal,
  });

  return true;
}

/**
 * Получает информацию об использовании по ID
 * @param {Firestore} db
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export async function getUsageInfo(db, userId) {
  const userRef = doc(db, "usage", userId);
  const docSnap = await getDoc(userRef);
  return docSnap.exists() ? docSnap.data() : null;
}
