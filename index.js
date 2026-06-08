// const express = require("express");
// const { PKPass } = require("passkit-generator");
// const fs = require("fs");
// const path = require("path");

// const app = express();
// const PORT = process.env.PORT || 3000;

// function getCerts() {
//   if (process.env.CERT_PEM) {
//     return {
//       wwdr: Buffer.from(process.env.WWDR_PEM),
//       signerCert: Buffer.from(process.env.CERT_PEM),
//       signerKey: Buffer.from(process.env.KEY_PEM),
//       signerKeyPassphrase: process.env.KEY_PASSPHRASE || undefined,
//     };
//   }
//   return {
//     wwdr: fs.readFileSync(path.join(__dirname, "certs/wwdr.pem")),
//     signerCert: fs.readFileSync(path.join(__dirname, "certs/certificate.pem")),
//     signerKey: fs.readFileSync(path.join(__dirname, "certs/key.pem")),
//   };
// }

// app.get("/pass", async (req, res) => {
//   try {
//     const {
//       code = "DEMO30",
//       discount = "Giảm 30%",
//       expiry = "2025-12-31",
//       title = "Ưu đãi đặc biệt",
//     } = req.query;

//     const passJson = {
//       formatVersion: 1,
//       passTypeIdentifier: process.env.PASS_TYPE_ID,
//       serialNumber: `coupon-${code}-${Date.now()}`,
//       teamIdentifier: process.env.TEAM_ID,
//       organizationName: "BrandName",
//       description: title,
//       logoText: "BrandName",
//       foregroundColor: "rgb(255,255,255)",
//       backgroundColor: "rgb(22,100,220)",
//       labelColor: "rgb(200,220,255)",
//       coupon: {
//         primaryFields: [{ key: "offer", label: "Ưu đãi", value: discount }],
//         auxiliaryFields: [
//           { key: "code", label: "Mã giảm giá", value: code },
//           { key: "expiry", label: "Hạn dùng", value: expiry },
//         ],
//         backFields: [
//           {
//             key: "terms",
//             label: "Điều khoản",
//             value: "Áp dụng cho đơn từ 500.000đ.",
//           },
//         ],
//       },
//       barcode: {
//         message: code,
//         format: "PKBarcodeFormatQR",
//         messageEncoding: "iso-8859-1",
//         altText: code,
//       },
//     };

//     // v3 API: tạo pass từ buffers trực tiếp
//     const pass = new PKPass(
//       {
//         // Các file trong pass bundle
//         "pass.json": Buffer.from(JSON.stringify(passJson)),
//         "icon.png": fs.readFileSync(path.join(__dirname, "assets/icon.png")),
//         "icon@2x.png": fs.readFileSync(
//           path.join(__dirname, "assets/icon@2x.png"),
//         ),
//         "logo.png": fs.readFileSync(path.join(__dirname, "assets/logo.png")),
//       },
//       getCerts(),
//     );

//     const buffer = pass.getAsBuffer();

//     res.set({
//       "Content-Type": "application/vnd.apple.pkpass",
//       "Content-Disposition": `attachment; filename="${code}.pkpass"`,
//       "Content-Length": buffer.length,
//     });
//     res.send(buffer);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get("/health", (_, res) => res.json({ ok: true }));

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require("express");
const { PKPass } = require("passkit-generator");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

function getCerts() {
  if (process.env.CERT_PEM) {
    return {
      wwdr: Buffer.from(process.env.WWDR_PEM),
      signerCert: Buffer.from(process.env.CERT_PEM),
      signerKey: Buffer.from(process.env.KEY_PEM),
      signerKeyPassphrase: process.env.KEY_PASSPHRASE || undefined,
    };
  }
  return {
    wwdr: fs.readFileSync(path.join(__dirname, "certs/wwdr.pem")),
    signerCert: fs.readFileSync(path.join(__dirname, "certs/certificate.pem")),
    signerKey: fs.readFileSync(path.join(__dirname, "certs/key.pem")),
  };
}

// ✅ THÊM MỚI: Trang trung gian cho iOS/Zalo
app.get("/open-pass", (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).send("Missing url parameter");
  }

  // Chỉ check URL hợp lệ, không filter domain
  let decodedUrl;
  try {
    decodedUrl = decodeURIComponent(url);
    new URL(decodedUrl); // Validate format
  } catch {
    return res.status(400).send("Invalid url");
  }

  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Đang mở Apple Wallet...</title>
        <style>
          body {
            font-family: -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #f2f2f7;
            color: #1c1c1e;
          }
          .card {
            background: white;
            border-radius: 16px;
            padding: 32px 24px;
            text-align: center;
            box-shadow: 0 2px 16px rgba(0,0,0,0.1);
            max-width: 320px;
            width: 90%;
          }
          .icon { font-size: 48px; margin-bottom: 16px; }
          h2 { margin: 0 0 8px; font-size: 18px; }
          p { margin: 0 0 24px; color: #6e6e73; font-size: 14px; }
          a {
            display: inline-block;
            background: #000;
            color: white;
            padding: 14px 28px;
            border-radius: 12px;
            text-decoration: none;
            font-size: 15px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🎫</div>
          <h2>Thêm vào Apple Wallet</h2>
          <p>
            Vui lòng mở liên kết này bằng trình duyệt trên thiết bị Apple của bạn,
            sau đó nhấn nút bên dưới để thêm ưu đãi vào Apple Wallet.
          </p>
          <a href="${decodedUrl}">Mở Apple Wallet</a>
        </div>
        <script>
          setTimeout(() => {
            window.location.href = "${decodedUrl}";
          }, 1000);
        </script>
      </body>
    </html>
  `);
});

app.get("/pass", async (req, res) => {
  try {
    const {
      code = "DEMO30",
      discount = "Giảm 30%",
      expiry = "2025-12-31",
      title = "Ưu đãi đặc biệt",
    } = req.query;

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: process.env.PASS_TYPE_ID,
      serialNumber: `coupon-${code}-${Date.now()}`,
      teamIdentifier: process.env.TEAM_ID,
      organizationName: "BrandName",
      description: title,
      logoText: "BrandName",
      foregroundColor: "rgb(255,255,255)",
      backgroundColor: "rgb(22,100,220)",
      labelColor: "rgb(200,220,255)",
      coupon: {
        primaryFields: [{ key: "offer", label: "Ưu đãi", value: discount }],
        auxiliaryFields: [
          { key: "code", label: "Mã giảm giá", value: code },
          { key: "expiry", label: "Hạn dùng", value: expiry },
        ],
        backFields: [
          {
            key: "terms",
            label: "Điều khoản",
            value: "Áp dụng cho đơn từ 500.000đ.",
          },
        ],
      },
      barcode: {
        message: code,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: code,
      },
    };

    const pass = new PKPass(
      {
        "pass.json": Buffer.from(JSON.stringify(passJson)),
        "icon.png": fs.readFileSync(path.join(__dirname, "assets/icon.png")),
        "icon@2x.png": fs.readFileSync(
          path.join(__dirname, "assets/icon@2x.png"),
        ),
        "logo.png": fs.readFileSync(path.join(__dirname, "assets/logo.png")),
      },
      getCerts(),
    );

    const buffer = pass.getAsBuffer();

    res.set({
      "Content-Type": "application/vnd.apple.pkpass",
      "Content-Disposition": `attachment; filename="${code}.pkpass"`,
      "Content-Length": buffer.length,
    });
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
