const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'magnify.png');
const outputPath = path.join(__dirname, 'app', 'icon.png');

sharp(inputPath)
  .trim()
  .toFile(outputPath)
  .then(info => {
    console.log("Successfully cropped icon:", info);
  })
  .catch(err => {
    console.error("Error cropping icon:", err);
  });
