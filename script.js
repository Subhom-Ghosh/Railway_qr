// Global array to store all QR entries
const qrDataSheet = [];

const prefixMap = {
  "Rail clips": "RC",
  "Rail liners": "RL",
  "Fish Plates": "FP",
  "Rail Anchors": "RA",
  "Rail Dowels": "RD"
};

window.onload = function () {
  
  const qrForm = document.getElementById("qrForm");
  const printBtn = document.getElementById("print-btn");
  const aiDiv = document.getElementById("aiResult");
  const toast = document.getElementById("toast");
  const darkToggle = document.getElementById("darkToggle");
  const langToggle = document.getElementById("langToggle");
  const title = document.getElementById("title");
  const resetTypeBtn = document.getElementById("resetType");
  const exportBtn = document.getElementById("export-btn");
  const typeSelect = document.getElementById("type");
  const qrIdInput = document.getElementById("qr_id");

  // Set today's date
  document.getElementById("supply_date").value = new Date().toISOString().split("T")[0];

  // Dark mode toggle
  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  function showToast(message) {
    toast.innerText = message;
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  // Generate next QR ID
  function getNextId(type) {
    const prefix = prefixMap[type];
    const key = `qr_counter_${prefix}`;
    let count = parseInt(localStorage.getItem(key)) || 1;
    const qrId = `${prefix}${String(count).padStart(4, "0")}`;
    return { qrId, nextCount: count + 1, key };
  }

  // Update QR ID when type is selected
  typeSelect.addEventListener("change", () => {
    const type = typeSelect.value;
    if (!type || !prefixMap[type]) {
      qrIdInput.value = "";
      return;
    }
    const { qrId } = getNextId(type);
    qrIdInput.value = qrId;
  });

  // Form submission
  qrForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const type = typeSelect.value;
    const vendor = document.getElementById("vendor").value.trim();
    const batch = document.getElementById("batch").value.trim();
    const supply_date = document.getElementById("supply_date").value;
    const warranty = parseInt(document.getElementById("warranty").value);

    if (!type || !vendor || !batch || isNaN(warranty) || warranty <= 0) {
      showToast("⚠️ Please fill all fields correctly.");
      return;
    }

    const { qrId, nextCount, key } = getNextId(type);
    qrIdInput.value = qrId;
    typeSelect.disabled = true;

    const qrData = `
QR_ID: ${qrId},
Type: ${type},
Vendor: ${vendor},
Batch: ${batch},
Supply Date: ${supply_date},
Warranty: ${warranty} Years
`;

    document.getElementById("qrcode").innerHTML = "";
    new QRCode(document.getElementById("qrcode"), {
      text: qrData,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    printBtn.style.display = "block";
    showToast(`✅ QR Code ${qrId} generated!`);

    const expiryYear = new Date(supply_date).getFullYear() + warranty;
    const currentYear = new Date().getFullYear();

    let aiMessage = "";
    if (currentYear > expiryYear) {
      aiMessage = "❌ Expired – Replace immediately.";
      aiDiv.style.color = "red";
    } else if (vendor === "Other") {
      aiMessage = "⚠️ Unverified Vendor – Extra inspection needed.";
      aiDiv.style.color = "orange";
    } else {
      aiMessage = "✅ Valid – No issue detected.";
      aiDiv.style.color = "green";
    }

    aiDiv.innerText = "AI Analysis: " + aiMessage;
    localStorage.setItem(key, nextCount);

    const entry = {
      QR_ID: qrId,
      Type: type,
      Vendor: vendor,
      Batch: batch,
      Supply_Date: supply_date,
      Warranty: warranty + " Years",
      Status: aiMessage,
      Timestamp: new Date().toLocaleString()
    };

    // Store entry in array
    qrDataSheet.push(entry);

    // Send to Google Sheets
    fetch("https://script.google.com/macros/s/AKfycbwq7LvTOKN3PDvGDIHTEONpEvAQN9KTq36L0NFxV-npDaoro6H9-AWLx-lt_ocDwY5n/exec", {
      method: "POST",
      body: JSON.stringify(entry),
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(res => res.text())
    .then(msg => showToast("📤 Data sent to Google Sheets"))
    .catch(err => showToast("❌ Failed to send to Sheets"));
  });

  // Print QR code
  printBtn.addEventListener("click", function () {
    const qrDiv = document.getElementById("qrcode").innerHTML;
    const printWindow = window.open("", "", "height=400,width=400");
    printWindow.document.write(`
      <html>
        <head><title>Print QR</title></head>
        <body style="text-align:center; font-family:Arial;">
          <h2>QR Code</h2>
          <div style="margin-top:20px;">${qrDiv}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  });

  // Reset for new entry
  resetTypeBtn.addEventListener("click", () => {
    typeSelect.disabled = false;
    typeSelect.value = "";
    qrIdInput.value = "";
    document.getElementById("qrcode").innerHTML = "";
    aiDiv.innerText = "";
    printBtn.style.display = "none";
    showToast("🔄 Ready for new entry.");
  });

  // Export all entries to Excel
  exportBtn.addEventListener("click", () => {
    if (qrDataSheet.length === 0) {
      showToast("⚠️ No data to export yet.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(qrDataSheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TrackFittingsQR");
    XLSX.writeFile(workbook, "TrackFittingsQR.xlsx");
  });
};
