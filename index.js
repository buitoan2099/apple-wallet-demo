const express = require("express");
const { PKPass } = require("passkit-generator");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Load certs — từ env vars trên Render (inject lúc runtime)
function getCerts() {
  // Nếu có env vars thì dùng, không thì đọc từ file (local dev)
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
    signerKeyPassphrase: undefined,
  };
}

app.get("/pass", async (req, res) => {
  try {
    const {
      code = "DEMO30",
      discount = "Giảm 30%",
      expiry = "2025-12-31",
      title = "Ưu đãi đặc biệt",
    } = req.query;

    const pass = await PKPass.from({
      model: {
        // Pass model định nghĩa inline
        "pass.json": Buffer.from(
          JSON.stringify({
            formatVersion: 1,
            passTypeIdentifier:
              process.env.PASS_TYPE_ID || "pass.com.yourbrand.coupon",
            serialNumber: `coupon-${code}-${Date.now()}`,
            teamIdentifier: process.env.TEAM_ID || "XXXXXXXXXX",
            organizationName: "BrandName",
            description: title,
            logoText: "BrandName",
            foregroundColor: "rgb(255, 255, 255)",
            backgroundColor: "rgb(22, 100, 220)",
            labelColor: "rgb(200, 220, 255)",
            coupon: {
              primaryFields: [
                { key: "offer", label: "Ưu đãi", value: discount },
              ],
              auxiliaryFields: [
                { key: "code", label: "Mã giảm giá", value: code },
                { key: "expiry", label: "Hạn dùng", value: expiry },
              ],
              backFields: [
                {
                  key: "terms",
                  label: "Điều khoản",
                  value:
                    "Áp dụng cho đơn từ 500.000đ. Không kết hợp ưu đãi khác.",
                },
              ],
            },
            barcode: {
              message: code,
              format: "PKBarcodeFormatQR",
              messageEncoding: "iso-8859-1",
              altText: code,
            },
          }),
        ),
        // Ảnh — đọc từ thư mục assets/
        "icon.png": fs.readFileSync(path.join(__dirname, "assets/icon.png")),
        "icon@2x.png": fs.readFileSync(
          path.join(__dirname, "assets/icon@2x.png"),
        ),
        "logo.png": fs.readFileSync(path.join(__dirname, "assets/logo.png")),
      },
      certificates: getCerts(),
    });

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
