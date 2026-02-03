/* =========================
   🛡️ SAFE DATE FORMATTER
========================= */
function formatDateSafe(value) {
  if (!value || value === 0 || value === "0") return "";

  const d = new Date(value);
  if (isNaN(d.getTime())) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

/* =========================
   📅 STRONG DATE CONVERTER
========================= */
function toDate(value) {
  if (!value) return new Date(0);

  if (typeof value === "number") {
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }

  if (value instanceof Date) return value;

  if (typeof value === "string" && value.includes("-")) {
    const [dd, mm, yyyy] = value.split("-").map(Number);
    if (!isNaN(dd) && !isNaN(mm) && !isNaN(yyyy)) {
      return new Date(yyyy, mm - 1, dd);
    }
  }

  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

/* =========================
   📋 COPY EVENT ID (ONLY ONE ACTIVE)
========================= */
function copyEventId(id, el) {
  if (!id || !el) return;

  navigator.clipboard.writeText(String(id))
    .then(() => {

      // 🔄 RESET all other copied cells
      document.querySelectorAll("td[data-event-id]").forEach(td => {
        td.textContent = td.dataset.eventId;
        td.style.backgroundColor = "";
        td.style.color = "#2e7d32";
        td.style.fontWeight = "600";
        td.style.pointerEvents = "auto";
      });

      // ✅ SET current cell as COPIED
      el.textContent = "COPIED";
      el.style.backgroundColor = "#d1fae5";
      el.style.color = "#065f46";
      el.style.fontWeight = "700";
      el.style.pointerEvents = "none";
    })
    .catch(err => {
      console.error("Clipboard error:", err);
    });
}
/* =========================
   🌐 APPS SCRIPT URL
========================= */
const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbzQ9MSFphXkOFtAfIS2Y7WAL7cp0Oeekcn1RmJLk07RN6kGiGiGEmCKx0TEGdGxED8d/exec";

/* =========================
   📦 LOAD DATA
========================= */
async function loadData() {
  try {
    const res = await fetch(`${SHEET_URL}?action=getData&t=${Date.now()}`);
    const json = await res.json();

    const tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";

    json.data.sort((a, b) => toDate(a[0]) - toDate(b[0]));

    json.data.forEach(row => {
      const tr = document.createElement("tr");

      row.forEach((cell, index) => {
        const td = document.createElement("td");

      if (index === 1) {
  td.textContent = cell ?? "";
  td.dataset.eventId = cell ?? ""; // ⭐ store original ID
  td.style.cursor = "pointer";
  td.style.color = "#2e7d32";
  td.style.fontWeight = "600";
  td.title = "Click to copy Event ID";

  td.addEventListener("click", function () {
    copyEventId(cell, this);
  });
}
        else if ([0, 7, 8, 23].includes(index)) {
          td.textContent = formatDateSafe(cell);
        }
        else {
          td.textContent = cell ?? "";
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    document.getElementById("loading").style.display = "none";
  } catch (err) {
    document.getElementById("loading").innerText = "❌ Failed to load data";
    console.error(err);
  }
}

// Initial load
loadData();

// ⏱ Auto refresh (SAFE)
setInterval(loadData, 30000); // 30 seconds