require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const sharp = require("sharp");
const imagemin = require("imagemin");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminPngquant = require("imagemin-pngquant");
const imageminGiflossy = require("imagemin-giflossy");

const cwd = process.cwd();

function saveToFile(buffer, pathToFile) {
  if (fs.existsSync(pathToFile)) return;
  mkdirp(path.dirname(pathToFile)).then(() => {
    const stream = fs.createWriteStream(pathToFile);
    stream.once("open", function (fd) {
      stream.write(buffer);
      stream.end();
      console.log("Wrote file");
    });
  });
}

function resize(originalPath, width, height, urlPath) {
  const fullPath = cwd + `${urlPath.startsWith("/") ? "" : "/"}` + urlPath;

  const buffer = fs.readFileSync(originalPath);

  const isGiftFile = originalPath.endsWith(".gif");

  if (isGiftFile) {
    return imagemin
      .buffer(buffer, {
        plugins: [
          imageminGiflossy({
            lossy: 100,
            resize: `${width}x${height}`,
            resizeMethod: "sample",
          }),
        ],
      })
      .then((outputBuffer) => {
        // saveToFile(outputBuffer, fullPath)
        return outputBuffer;
      });
  }

  return sharp(buffer)
    .rotate()
    .resize(width, height)
    .toBuffer()
    .then((resizedBuffer) => {
      return imagemin.buffer(resizedBuffer, {
        plugins: [imageminJpegtran(), imageminPngquant({ quality: "80" })],
      });
    })
    .then((outputBuffer) => {
      saveToFile(outputBuffer, fullPath);
      return outputBuffer;
    });
}

// server
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const supportedDimensions = process.env.SUPPORTED_DIMENSIONS.split("|");

app.use(express.static(process.env.PUBLIC_PATH || "public"));

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
      const mediaPath = `public${req.path}`.replace(
        `/thumb_x${pDimensions}`,
        ""
      );
      const cachedPath = `public${req.path}`;

      if (!fs.existsSync(mediaPath)) {
        return res.redirect(301, `/no-image.jpg`);
      }

      return resize(mediaPath, width, height, cachedPath).then((buffer) => {
        res.setHeader("Content-Type", "image/jpeg");
        res.send(buffer);
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
