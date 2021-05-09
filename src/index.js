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
      ).then((buffer) => {
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
