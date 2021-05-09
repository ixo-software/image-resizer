const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");

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

exports.saveToFile = saveToFile;
