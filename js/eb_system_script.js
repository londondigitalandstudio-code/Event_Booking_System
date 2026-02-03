// ===== ELEMENT REFERENCES =====
const custName = document.getElementById("custName");
const fatherName = document.getElementById("fatherName");
const mobile = document.getElementById("mobile");
const address = document.getElementById("address");

const eventId = document.getElementById("eventId");
const eventType = document.getElementById("eventType");
const eventPlacedDate = document.getElementById("eventPlacedDate");
const eventDate = document.getElementById("eventDate");
const eventSpot = document.getElementById("eventSpot");
const eventLocation = document.getElementById("eventLocation");

const rollCost = document.getElementById("rollCost");
const rollCount = document.getElementById("rollCount");
const rollTotal = document.getElementById("rollTotal");

const requirement = document.getElementById("requirement");
const albumSize = document.getElementById("albumSize");

const total = document.getElementById("total");
const advance = document.getElementById("advance");
const balance = document.getElementById("balance");

const spotPayment = document.getElementById("spotPayment");
const partPayment = document.getElementById("partPayment");
const partPaymentDate = document.getElementById("partPaymentDate");

const SHEET_URL = "https://script.google.com/macros/s/AKfycbzQ9MSFphXkOFtAfIS2Y7WAL7cp0Oeekcn1RmJLk07RN6kGiGiGEmCKx0TEGdGxED8d/exec";

/* =========================
   🧹 HELPERS
========================= */
function formatINR(num) {
  return Number(num).toLocaleString("en-IN");
}

function getNumber(val) {
  if (!val) return 0;
  return Number(String(val).replace(/,/g, "")) || 0;
}

/* =========================
   ✍️ TEXT ONLY FIELDS
========================= */
function allowOnlyText(el) {
  el.addEventListener("input", () => {
    el.value = el.value.replace(/[0-9]/g, "");
  });
}

allowOnlyText(custName);
allowOnlyText(fatherName);

/* =========================
   🎞️ ROLL TOGGLE
========================= */
function toggleRoll(show) {
  const box = document.getElementById("rollBox");
  box.classList.toggle("hidden", !show);

  if (show) {
    total.readOnly = true;
    total.classList.add("readonly");
    total.value = "";
  } else {
    total.readOnly = false;
    total.classList.remove("readonly");
    rollCost.value = "";
    rollCount.value = "";
    rollTotal.value = "";
  }

  calculatePayment();
}

/* =========================
   💰 PAYMENT CALCULATION
========================= */
function calculatePayment() {
  const t = getNumber(total.value);
  const a = getNumber(advance.value);
  const s = getNumber(spotPayment.value);
  const p = getNumber(partPayment.value);

  const paid = a + s + p;
  const bal = t - paid;

  if (total.value !== "") total.value = formatINR(t);
  if (advance.value !== "") advance.value = formatINR(a);
  if (spotPayment.value !== "") spotPayment.value = formatINR(s);
  if (partPayment.value !== "") partPayment.value = formatINR(p);

  balance.value = formatINR(Math.max(bal, 0));

  if (t > 0 && bal === 0 && !partPaymentDate.value) {
    partPaymentDate.value = new Date().toISOString().split("T")[0];
  }
}

/* =========================
   🎞️ ROLL CALCULATION
========================= */
function calculateRollTotal() {
  const cost = getNumber(rollCost.value);
  const count = Number(rollCount.value) || 0;

  const totalRoll = cost * count;

  if (rollCost.value !== "") rollCost.value = formatINR(cost);
  rollTotal.value = totalRoll ? formatINR(totalRoll) : "";
  total.value = totalRoll ? formatINR(totalRoll) : "";

  calculatePayment();
}

/* =========================
   🔄 LISTENERS
========================= */
total.addEventListener("input", calculatePayment);
advance.addEventListener("input", calculatePayment);
spotPayment.addEventListener("input", calculatePayment);
partPayment.addEventListener("input", calculatePayment);

rollCost.addEventListener("input", calculateRollTotal);
rollCount.addEventListener("input", calculateRollTotal);

/* =========================
   📅 DATE AVAILABILITY
========================= */
async function isDateAlreadyBooked(date) {
  const res = await fetch(`${SHEET_URL}?checkDate=${encodeURIComponent(date)}`);
  const data = await res.json();
  return data.booked === true;
}

/* =========================
   📦 BOOK ORDER
========================= */
async function bookOrder() {

  if (!custName.value.trim()) return alert("Enter Customer Name");
  if (!fatherName.value.trim()) return alert("Enter Father Name");
  if (!/^\d{10}$/.test(mobile.value)) return alert("Enter valid Mobile Number");
  if (!address.value.trim()) return alert("Enter Address");

  if (!eventType.value) return alert("Select Event Type");
  if (!eventPlacedDate.value) return alert("Select Event Placed Date");
  if (!eventDate.value) return alert("Select Event Date");
  if (!eventSpot.value) return alert("Select Event Spot");
  if (!eventLocation.value.trim()) return alert("Enter Event Location");

  const bookingType = document.querySelector('input[name="type"]:checked');
  if (!bookingType) return alert("Select Booking Type");

  if (bookingType.parentElement.innerText.includes("Roll")) {
    if (!getNumber(rollCost.value)) return alert("Enter Cost Per Roll");
    if (!(Number(rollCount.value) > 0)) return alert("Enter Number of Rolls");
  }

  if (!requirement.value) return alert("Select Customer Requirement");
  if (!document.querySelector('input[name="pad"]:checked')) return alert("Select Album Pad");
  if (!albumSize.value) return alert("Select Album Size");

  if (!getNumber(total.value)) return alert("Enter Order Value");
  // ✅ Advance is mandatory
if (getNumber(advance.value) <= 0) {
  alert("Enter Advance Amount");
  advance.focus();
  return;
}

// ❌ Stop if date already exists
const alreadyBooked = await isDateAlreadyBooked(eventDate.value);
if (alreadyBooked) {
  showErrorPopup("This Event Date is already booked. Please choose another date.");
  eventDate.focus();
  return;

}


  calculatePayment();

  const bookingData = {
    eventId: eventId.value,
    custName: custName.value,
    fatherName: fatherName.value,
    mobile: mobile.value,
    address: address.value,

    eventType: eventType.value,
    eventPlacedDate: eventPlacedDate.value,
    eventDate: eventDate.value,
    eventSpot: eventSpot.value,
    eventLocation: eventLocation.value,

    bookingType: bookingType.parentElement.innerText.trim(),

    rollCost: rollCost.value,
    rollCount: rollCount.value,
    rollTotal: rollTotal.value,

    requirement: requirement.value,
    albumPad: document.querySelector('input[name="pad"]:checked').parentElement.innerText.trim(),
    albumSize: albumSize.value,

    total: total.value,
    advance: advance.value,
    spotPayment: spotPayment.value,
    partPayment: partPayment.value,
    balance: balance.value,
    partPaymentDate: partPaymentDate.value,
    eventStatus: "Event Booked" // ✅ IMPORTANT LINE
  };

// 🔥 FORCE popup to render instantly (no delay)
requestAnimationFrame(() => {
  showSuccessPopup();
});

// 🚀 send data AFTER UI paint
setTimeout(() => {
  fetch(SHEET_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(bookingData)
  });
}, 0);

  showSuccessPopup();

  function showSuccessPopup() {
  // prevent showing again after refresh
  if (sessionStorage.getItem("orderSuccessShown")) return;

  document.getElementById("successPopup").style.display = "flex";
  sessionStorage.setItem("orderSuccessShown", "yes");
};
}

/* =========================
   🔄 RESET FORM
========================= */
function resetForm() {
  custName.value = "";
  fatherName.value = "";
  mobile.value = "";
  address.value = "";

  eventType.value = "";
  eventDate.value = "";
  eventSpot.value = "";
  eventLocation.value = "";

  document.querySelectorAll('input[name="type"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="pad"]').forEach(r => r.checked = false);

  requirement.value = "";
  albumSize.value = "";

  rollCost.value = "";
  rollCount.value = "";
  rollTotal.value = "";
  document.getElementById("rollBox").classList.add("hidden");

  total.value = "";
  advance.value = "";
  spotPayment.value = "";
  partPayment.value = "";
  balance.value = "";
  partPaymentDate.value = "";

  total.readOnly = false;
  total.classList.remove("readonly");

  closeSuccessPopup();
  generateEventId();
  setEventPlacedDate();
}

/* =========================
   🆔 EVENT ID
========================= */
function generateEventId() {
  const d = new Date();

  const date =
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");

  const rand = Math.floor(100 + Math.random() * 900); // 3 digits

  eventId.value = `EVT-${date}-${rand}`;
}
generateEventId();


/* =========================
   📅 EVENT PLACED DATE
========================= */
function setEventPlacedDate() {
  const today = new Date().toISOString().split("T")[0];
  eventPlacedDate.value = today;
  eventPlacedDate.readOnly = true;
  eventPlacedDate.style.pointerEvents = "none";
}

setEventPlacedDate();

/* =========================
   ⚙️ SERVICE WORKER
========================= */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

// ===== SUCCESS POPUP FUNCTIONS =====
function showSuccessPopup() {
  document.getElementById("successPopup").style.display = "flex";
}

function closeSuccessPopup() {
  document.getElementById("successPopup").style.display = "none";
}



showSuccessPopup();
resetForm();

function closeSuccessPopup() {
  document.getElementById("successPopup").style.display = "none";
  sessionStorage.removeItem("orderSuccessShown");
}

window.addEventListener("load", () => {
  document.getElementById("successPopup").style.display = "none";
  sessionStorage.removeItem("orderSuccessShown");
});

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("successPopup");
  if (popup) popup.style.display = "none";
});

function handlePopupOk() {
  closeSuccessPopup();
  resetForm();
}

function showErrorPopup(message) {
  document.getElementById("errorMsg").innerText = message;
  document.getElementById("errorPopup").style.display = "flex";
}

function closeErrorPopup() {
  document.getElementById("errorPopup").style.display = "none";
}
