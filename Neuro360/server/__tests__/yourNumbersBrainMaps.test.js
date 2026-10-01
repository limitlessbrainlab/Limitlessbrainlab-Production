const assert = require('assert');
const path = require('path');

const { extractPageImage } = require('../services/pdf/yourNumbersPage');

extractPageImage(path.join(__dirname, '../uploads/eyesClosed-1765440593871-741407982.pdf')).then((image) => {
  assert(Buffer.isBuffer(image));
  assert(image.length > 0);

  console.log('yourNumbersBrainMaps: ok');
});
