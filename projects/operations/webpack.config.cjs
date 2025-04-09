const {SingleEntry} = require("../../webpack.cjs");
const path = require("path");

const dev = process.argv.includes('-d');

module.exports = SingleEntry({
    mode: dev? "development": "production",
    entry: path.join(__dirname, "src", "index.ts"),
    output: {
        filename: "index.js",
        path: path.join(__dirname, "public")
    }
});