const SHEET_URL = "https://script.google.com/macros/s/AKfycbwbXAy0GOlepXD3W_6cE6QS8H0cW3nIcSNvbSSpF1f_An6lk4DYlPpaQ33-Q72TxYHg/exec";

let rowIndex = null;

/* =====================
   🔢 NUMBER HELPERS
===================== */
function getNumber(val) {
  return Number(String(val || "").replace(/,/g, "")) || 0;
}

function formatINR(val) {
  if (val === "" || val === null || isNaN(val)) return "";
  return Number(val).toLocaleString("en-IN");
}

/* =====================
   💰 BALANCE CALC
===================== */
function calculateBalance(trigger = "") {
  const orderValue = getNumber(total.value);
  const advanceAmt = getNumber(advance.value);
  const spotAmt = getNumber(spotPayment.value);
  const partAmt = getNumber(partPayment.value);

  const paidSoFar = advanceAmt + spotAmt + partAmt;
  const balanceAmt = orderValue - paidSoFar; // 🔥 allow negative

  /* 🚨 VALIDATION */
  if (paidSoFar > orderValue) {

   showCenterAlert(
  "❌ Payment exceeds Order Value!\n\n" +
  "Order Value: ₹" + formatINR(orderValue) + "\n" +
  "Total Paid: ₹" + formatINR(paidSoFar) + "\n" +
  "Over Amount: ₹" + formatINR(Math.abs(balanceAmt))
);

    // clear only edited field
    if (trigger === "spot") {
      spotPayment.value = "";
    }
    if (trigger === "part") {
      partPayment.value = "";
    }

    // 🔁 recalc AFTER clearing
    const newSpot = getNumber(spotPayment.value);
    const newPart = getNumber(partPayment.value);
    const newPaid = advanceAmt + newSpot + newPart;

    balance.value = formatINR(orderValue - newPaid);
    return;
  }

  /* ✅ NORMAL CALCULATION */
  balance.value = formatINR(balanceAmt);

  spotPayment.value = spotAmt > 0 ? formatINR(spotAmt) : "";
  partPayment.value = partAmt > 0 ? formatINR(partAmt) : "";

  /* ✅ Auto date */
  if (orderValue > 0 && balanceAmt === 0 && !partPaymentDate.value) {
    partPaymentDate.value = new Date().toISOString().split("T")[0];
  }
}
/* =====================
   🎞 ROLL CALC
===================== */
function calculateRollTotal() {
  const cost = getNumber(rollCost.value);
  const count = Number(rollCount.value) || 0;

  const sum = cost * count;
  rollTotal.value = sum ? formatINR(sum) : "";
  total.value = sum ? formatINR(sum) : "";

  calculateBalance();
}

/* =====================
   📦 BOOKING TYPE
===================== */
function setBookingType(type) {
  const isRoll = type === "Roll";
  rollBox.classList.toggle("hidden", !isRoll);

  rollCost.disabled = !isRoll;
  rollCount.disabled = !isRoll;

  if (!isRoll) {
    rollCost.value = "";
    rollCount.value = "";
    rollTotal.value = "";
  }

  calculateBalance();
}

/* =====================
   🔍 SEARCH BOOKING
===================== */
function searchBooking() {
  const key = searchKey.value.trim();
  if (!key) return showCenterAlert("❌ Enter Event ID or Mobile");

  fetch(`${SHEET_URL}?action=search&key=${encodeURIComponent(key)}`)
    .then(r => r.json())
    .then(res => {
      if (!res || res.status !== "success") {
        showCenterAlert("❌ No booking found");
        return;
      }

      rowIndex = res.rowIndex;
      const d = res.record;

      custName.value = d.custName || "";
      fatherName.value = d.fatherName || "";
      mobile.value = d.mobile || "";
      address.value = d.address || "";

      eventId.value = d.eventId || "";
      eventPlacedDate.value = d.eventPlacedDate || "";
      eventDate.value = d.eventDate || "";
      eventSpot.value = d.eventSpot || "";
      eventLocation.value = d.eventLocation || "";

      rollCost.value = formatINR(getNumber(d.rollCost));
      rollCount.value = d.rollCount || "";
      rollTotal.value = formatINR(getNumber(d.rollTotal));

      total.value = formatINR(getNumber(d.total));
      advance.value = formatINR(getNumber(d.advance));
      spotPayment.value = formatINR(getNumber(d.spotPayment));
      partPayment.value = formatINR(getNumber(d.partPayment));
      balance.value = formatINR(getNumber(d.balance));
      partPaymentDate.value = d.partPaymentDate || "";

      lockFields();
      calculateBalance();

      showCenterAlert("✅ Record loaded successfully");
    })
    .catch(err => {
      console.error("FETCH ERROR:", err);
      showCenterAlert("❌ Server error. Check deployment & permissions.");
    });
}
/* =====================
   🔒 LOCK FIELDS
===================== */
function lockFields() {
  document.querySelectorAll("input, textarea, select").forEach(el => {
    el.disabled = true;
  });

  searchKey.disabled = false;
  total.disabled = false;

  advance.disabled = true;
  spotPayment.disabled = false;
  partPayment.disabled = false;
  partPaymentDate.disabled = false;

  document.querySelectorAll('input[name="type"]').forEach(r => {
    r.disabled = false;
  });
}

/* =====================
   ✏️ UPDATE BOOKING
===================== */
function bookOrder() {

  if (getNumber(spotPayment.value) + getNumber(advance.value) + getNumber(partPayment.value) > getNumber(total.value)) {
  return showCenterAlert("❌ Cannot update. Payment exceeds Order Value.");
}
  if (rowIndex === null) return showCenterAlert("❌ Search booking first");

  calculateBalance();

  const payload = {
    action: "update",
    rowIndex: rowIndex,
    rollCost: rollCost.value,
    rollCount: rollCount.value,
    rollTotal: rollTotal.value,
    total: total.value,
    spotPayment: spotPayment.value,
    partPayment: partPayment.value,
    balance: balance.value,
    partPaymentDate: partPaymentDate.value,
    eventStatus: "Event Attend"
  };

  fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  showCenterAlert("✅ Updated Successfully");
  resetForm();
}

/* =====================
   🗑 DELETE BOOKING
===================== */
function deleteBooking() {
  if (rowIndex === null) return showCenterAlert("❌ Search booking first");

  if (!confirm ("⚠️ Are you sure you want to delete this booking?")) return;

  fetch(SHEET_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      rowIndex: rowIndex
    })
  });

  showCenterAlert("✅ Booking deleted");
  resetForm();
}

/* =====================
   🔄 RESET
===================== */
function resetForm() {
  document.querySelectorAll("input, textarea, select").forEach(el => {
    el.value = "";
    el.disabled = false;
  });

  balance.readOnly = true;
  rollTotal.readOnly = true;
  eventId.readOnly = true;

  rowIndex = null;
  searchKey.value = "";
  searchKey.focus();
}

/* =====================
   ⌨️ LIVE INPUT
===================== */
spotPayment.addEventListener("input", calculateBalance);
partPayment.addEventListener("input", calculateBalance);
total.addEventListener("input", calculateBalance);
rollCost.addEventListener("input", calculateRollTotal);
rollCount.addEventListener("input", calculateRollTotal);

function showCenterAlert(msg) {
  document.getElementById("centerAlertMsg").innerText = msg;
  document.getElementById("centerAlert").classList.remove("hidden");
}

function closeCenterAlert() {
  document.getElementById("centerAlert").classList.add("hidden");
}


