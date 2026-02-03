/* =========================
   🌐 GOOGLE SHEET URL
========================= */
const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbwbXAy0GOlepXD3W_6cE6QS8H0cW3nIcSNvbSSpF1f_An6lk4DYlPpaQ33-Q72TxYHg/exec";

/* =========================
   🛡️ DATE FORMAT
========================= */
function formatDateSafe(value) {
  if (!value) return "";

  if (typeof value === "number") {
    return formatDate(new Date((value - 25569) * 86400 * 1000));
  }

  const d = new Date(value);
  return isNaN(d.getTime()) ? "" : formatDate(d);
}

function formatDate(d) {
  return `${String(d.getDate()).padStart(2, "0")}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${d.getFullYear()}`;
}

/* =========================
   📋 COPY EVENT ID (ONE AT A TIME)
========================= */
let copiedEl = null;

function copyEventId(id, el) {
  if (!id) return;

  if (copiedEl && copiedEl !== el) {
    copiedEl.textContent = copiedEl.dataset.original;
    copiedEl.classList.remove("copied");
  }

  if (!el.dataset.original) {
    el.dataset.original = el.textContent;
  }

  navigator.clipboard.writeText(id).then(() => {
    el.textContent = "Copied!";
    el.classList.add("copied");
    copiedEl = el;
  });
}

/* =========================
   💾 CACHE
========================= */
const CACHE_KEY = "bookedEvents";

function getCachedEvents() {
  return JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
}

function saveCachedEvents(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

/* =========================
   🧱 RENDER TABLE
========================= */
function renderEvents(data) {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  data.forEach(item => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${formatDateSafe(item.eventDate)}</td>
      <td class="event-id" title="Click to copy"
          onclick="copyEventId('${item.eventId}', this)">
        ${item.eventId || ""}
      </td>
      <td>${item.customerName || ""}</td>
      <td>${item.eventType || ""}</td>
    `;

    tbody.appendChild(tr);
  });
}

/* =========================
   ⚡ LOAD CACHE INSTANTLY
========================= */
function loadFromCacheInstantly() {
  const cached = getCachedEvents();
  if (cached.length > 0) {
    renderEvents(cached);
    return true;
  }
  return false;
}

/* =========================
   🔄 GOOGLE SYNC (FAST + SAFE)
========================= */
let retryCount = 0;

async function syncWithGoogle() {
  const loading = document.getElementById("loading");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const res = await fetch(
      `${SHEET_URL}?action=getBookedEvents&t=${Date.now()}`,
      { signal: controller.signal }
    );

    const json = await res.json();
    if (json.status !== "success") throw new Error("Invalid response");

    const activeEvents = json.data
      .filter(e => !e.attended)
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

    const cached = getCachedEvents();

    if (JSON.stringify(cached) !== JSON.stringify(activeEvents)) {
      saveCachedEvents(activeEvents);
      renderEvents(activeEvents);
    }

    retryCount = 0;
    loading.style.display = "none";
  } catch (err) {
    if (err.name !== "AbortError") {
      retryCount++;
      if (retryCount <= 3) {
        setTimeout(syncWithGoogle, 4000);
      } else {
        loading.textContent = "❌ Unable to load events";
      }
      console.error(err);
    }
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================
   🚀 INIT (NO MANUAL REFRESH)
========================= */
function loadBookedEvents() {
  const loading = document.getElementById("loading");

  const hasCache = loadFromCacheInstantly();
  loading.style.display = hasCache ? "none" : "block";

  syncWithGoogle();
}

loadBookedEvents();

/* =========================
   👀 TAB ACTIVE REFRESH
========================= */
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) syncWithGoogle();
});

/* =========================
   🔁 AUTO REFRESH (30s)
========================= */
setInterval(() => {
  if (!document.hidden) syncWithGoogle();
}, 1000);