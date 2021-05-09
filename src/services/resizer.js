const fs = require("fs");
const sharp = require("sharp");
const imagemin = require("imagemin");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminPngquant = require("imagemin-pngquant");
const imageminGiflossy = require("imagemin-giflossy");
const { saveToFile } = require("./file-io");

const cwd = process.cwd();

function resize(originalPath, width, height, urlPath, enableSaveFile = true) {
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
        if (enableSaveFile) {
          saveToFile(outputBuffer, fullPath);
        }
        return outputBuffer;
      });
  }

  return sharp(buffer)
    .rotate()
    .resize(width, height)
    .toBuffer()
    .then((resizedBuffer) => {
      return imagemin.buffer(resizedBuffer, {
        plugins: [imageminJpegtran(), imageminPngquant({ quality: [0.3, 1] })],
      });
    })
    .then((outputBuffer) => {
      if (enableSaveFile) {
        saveToFile(outputBuffer, fullPath);
      }
      return outputBuffer;
    });
}

exports.resize = resize;
