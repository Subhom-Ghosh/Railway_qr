window.onload = function () {
  const qrForm = document.getElementById("qrForm");
  const printBtn = document.getElementById("print-btn");
  const aiDiv = document.getElementById("aiResult");
  const toast = document.getElementById("toast");
  const darkToggle = document.getElementById("darkToggle");
  const langToggle = document.getElementById("langToggle");
  const title = document.getElementById("title");
  const resetTypeBtn = document.getElementById("resetType");

  const typeSelect = document.getElementById("type");
  const qrIdInput = document.getElementById("qr_id");

  // Prefix mapping for QR ID
  const prefixMap = {
    "Rail clips": "RC",
    "Rail liners": "RL",
    "Fish Plates": "FP",
    "Rail Anchors": "RA",
    "Rail Dowels": "RD"
  };

  // Set today's date
  document.getElementById("supply_date").value = new Date().toISOString().split("T")[0];

  // Dark mode toggle
  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  // Language toggle
  let isBengali = false;
  langToggle.addEventListener("click", () => {
    isBengali = !isBengali;
    title.innerText = isBengali
      ? "ট্র্যাক ফিটিংসের জন্য QR কোড জেনারেটর"
      : "QR Code Generator for Track Fittings";
    langToggle.innerText = isBengali ? "🌐 English" : "🌐 বাংলা";
  });

  // Toast notification
  function showToast(message) {
    toast.innerText = message;
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  // Get next QR ID based on fitting type
  function getNextId(type) {
    const prefix = prefixMap[type];
    const key = `qr_counter_${prefix}`;
    let count = parseInt(localStorage.getItem(key)) || 1;
    const qrId = `${prefix}${String(count).padStart(4, "0")}`;
    return { qrId, nextCount: count + 1, key };
  }
  typeSelect.addEventListener("change", () => {
  const type = typeSelect.value;
  if (!type || !prefixMap[type]) {
    qrIdInput.value = "";
    return;
  }

  const prefix = prefixMap[type];
  const key = `qr_counter_${prefix}`;
  const count = parseInt(localStorage.getItem(key)) || 1;
  const qrId = `${prefix}${String(count).padStart(4, "0")}`;
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

    // Generate QR ID
    const { qrId, nextCount, key } = getNextId(type);
    qrIdInput.value = qrId;

    // Lock fitting type
    typeSelect.disabled = true;

    // Prepare QR data
    const data = `
QR_ID: ${qrId},
Type: ${type},
Vendor: ${vendor},
Batch: ${batch},
Supply Date: ${supply_date},
Warranty: ${warranty} Years
`;

    // Clear old QR
    document.getElementById("qrcode").innerHTML = "";

    // Generate new QR
    new QRCode(document.getElementById("qrcode"), {
      text: data,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    // Show print button
    printBtn.style.display = "block";
    showToast(`✅ QR Code ${qrId} generated!`);

    // AI Analysis
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

    // Save updated counter
    localStorage.setItem(key, nextCount);
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

  // Reset type for new entry
  resetTypeBtn.addEventListener("click", () => {
    typeSelect.disabled = false;
    typeSelect.value = "";
    qrIdInput.value = "";
    document.getElementById("qrcode").innerHTML = "";
    aiDiv.innerText = "";
    printBtn.style.display = "none";
    showToast("🔄 Ready for new entry.");
  });
};