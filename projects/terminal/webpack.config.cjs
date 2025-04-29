const {SingleEntry} = require("../../webpack.cjs");
const path = require("path");

module.exports = SingleEntry({
    entry: path.join(__dirname, "index.ts"),
    output: {
        filename: "index.js",
        path: path.join(__dirname, "public")
    }
});