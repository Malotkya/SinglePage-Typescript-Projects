const {MultipleEntry} = require("../../webpack.cjs");
const path = require("path");

const prod = process.argv.includes('prod');
const source = path.join(__dirname, "src");

module.exports = MultipleEntry({
    mode: prod? "production": "development",
    entry: [path.join(source, "index.ts")],
    style: path.join(source, "style.scss"),
    output: { 
        filename: '[name].js',
        path: path.join(__dirname, "public")
    }
});