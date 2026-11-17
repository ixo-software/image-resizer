require("dotenv").config();
const express = require("express");
const fs = require("fs");
const { resize } = require("./services/resizer");

// envs
const hasToSavingThumb = process.env.SAVING_THUMB === "true";
const publicPath = process.env.PUBLIC_PATH;

// server
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const supportedDimensions = process.env.SUPPORTED_DIMENSIONS.split("|");

// Lưới an toàn cuối: Node >= 15 thoát process khi có Promise reject không được bắt.
// Ghi log thay vì sập để pm2 không restart liên tục.
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

app.use(express.static(publicPath || "public"));

app.get("/thumb_x:dimensions/*", function (req, res) {
  const pDimensions = req.params.dimensions;
  if (
    !supportedDimensions.includes("All") &&
    supportedDimensions.indexOf(pDimensions) === -1
  ) {
    return res.redirect(301, `/no-image.jpg`);
  }
  if (pDimensions && pDimensions.includes("x")) {
    const dimensions = pDimensions.split("x");
    if (dimensions.length !== 2) return res.send("Not found");
    try {
      const width = parseInt(dimensions[0]) || undefined;
      const height = parseInt(dimensions[1]) || undefined;
      const mediaPath = `${publicPath}${req.path}`.replace(
        `/thumb_x${pDimensions}`,
        ""
      );
      const cachedPath = `${publicPath}${req.path}`;

      if (!fs.existsSync(mediaPath)) {
        return res.redirect(301, `/no-image.jpg`);
      }

      return resize(
        mediaPath,
        width,
        height,
        cachedPath,
        hasToSavingThumb
      )
        .then((buffer) => {
          res.setHeader("Content-Type", "image/jpeg");
          res.send(buffer);
        })
        .catch((error) => {
          // File không phải ảnh hợp lệ (sharp reject) hoặc lỗi khác: trả về cho client,
          // không để Promise reject làm process thoát -> pm2 restart
          console.error(`[resize] ${mediaPath}:`, error.message);
          if (!res.headersSent) res.redirect(302, `/no-image.jpg`);
        });
    } catch (error) {
      console.log(error);
      return res.send("Not found");
    }
  }
  return res.send("Not found");
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
