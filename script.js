const qrDataSheet = [];

const prefixMap = {
  "Rail clips": "RC",
  "Rail liners": "RL",
  "Fish Plates": "FP",
  "Rail Anchors": "RA",
  "Rail Dowels": "RD",
};

window.onload = function () {
  const qrForm = document.getElementById("qrForm");
  const printBtn = document.getElementById("print-btn");
  const toast = document.getElementById("toast");
  const darkToggle = document.getElementById("darkToggle");
  const resetTypeBtn = document.getElementById("resetType");
  const typeSelect = document.getElementById("type");
  const qrIdInput = document.getElementById("qr_id");

  document.getElementById("supply_date").value = new Date()
    .toISOString()
    .split("T")[0];

  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

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
    const { qrId } = getNextId(type);
    qrIdInput.value = qrId;
  });

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

    // ✅ Generate QR code with inspection URL
    const qrData = `https://subhom-ghosh.github.io/inspection/?qr_id=${qrId}`;

    const qrContainer = document.getElementById("qrcode");
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
      text: qrData,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    printBtn.style.display = "block";
    showToast(`✅ QR Code ${qrId} generated!`);
    window.scrollTo({ top: 0, behavior: "smooth" });

    localStorage.setItem(key, nextCount);

    const entry = {
      QR_ID: qrId,
      Type: type,
      Vendor: vendor,
      Batch: batch,
      Supply_Date: supply_date,
      Warranty: warranty + " Years",
      Timestamp: new Date().toISOString(),
      QR_Image: "", // Will be filled after QR renders
    };

    qrDataSheet.push(entry);

    // Wait for QR image to render and extract Base64 PNG
    setTimeout(() => {
      const qrImg = qrContainer.querySelector("img");
      if (qrImg) {
        entry.QR_Image = qrImg.src;
        sendToSheet(entry);
      } else {
        showToast("⚠️ QR image not found.");
      }
    }, 500);
  });

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

  resetTypeBtn.addEventListener("click", () => {
    typeSelect.disabled = false;
    typeSelect.value = "";
    qrIdInput.value = "";
    document.getElementById("qrcode").innerHTML = "";
    printBtn.style.display = "none";
    showToast("🔄 Ready for new entry.");
  });
};

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

function sendToSheet(data) {
  const formData = new FormData();
  for (const key in data) {
    formData.append(`data[${key}]`, data[key]);
  }

  fetch("https://sheetdb.io/api/v1/0mhx24t0s867z", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then(() => {
      alert("✅ Submitted with QR image and inspection link!");
    })
    .catch(() => {
      showToast("❌ Submission failed.");
    });
}
