const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    // Changes the cache location for Puppeteer to the project directory
    cacheDirectory: join(__dirname, '.puppeteer'),
};
