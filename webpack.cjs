/** Main Webpack Config Options
 * 
 * @author Alex Malotky
 */
const fs = require("fs");
const path = require("path");
const json5 = require("json5");

/** Get Aliases
 * 
 * @param {string} configPath
 * @param {Record<string, string>} alias 
 * @returns {Record<string, string>}
 */
function getAliases(configPath, alias = {}){
    const {paths} = json5.parse(fs.readFileSync(configPath).toString()).compilerOptions;

    const dir = path.dirname(configPath, "..")

    for(const item in paths) {
        const key = item.replace("/*", "");
        const name = paths[item][0].replace("/*", "");
        
        alias[key] = path.resolve(dir, name);
    }

    return alias;
}

/** Single Entry
 * 
 * @param {{
 *      mode?: "development"|"production",
 *      entry: string,
 *      output: {
 *          filename: string,
 *          path: string
 *      },
 *      alias?: Record<string, string>
 *      assets?:string[]
 * }} opts 
 * @returns {import("webpack").Configuration}
 */
function SingleEntry(opts){
    const {mode = "development", entry, output, alias, assets} = opts

    const rules = [
        {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }
    ];

    if(assets) {
        rules.push({
            test: new RegExp(`\\.(${assets.join("|")})$`),
            use: "raw-loader"
        })
    }

    return {
        mode, entry, output,
        module: {
            rules
        },
        resolve: {
            extensions: [".ts", ".js"],
            alias: getAliases(path.join(__dirname, "tsconfig.json"), alias)
        }
    };
}

/** Multiple Entry
 * 
 * @param {{
*      mode: "development"|"production",
*      entry: string[]|string,
*      style?: string,
*      output: {
*          filename: string,
*          path: string
*      },
*      alias?: Record<string, string>,
*      assets?:string[]
* }} opts 
* @returns {import("webpack").Configuration}
*/
function MultipleEntry(opts){
   const {mode, entry, output, style, alias, assets} = opts
   const rules = [
        {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }
   ];

   if(style) {
        if(typeof entry === "string")
            entry = [entry];

        entry.push(style)
        rules.push({
            test: /\.scss$/,
            use: [
                {
                    loader: 'file-loader',
                    options: { name: 'style.css'}
                },
                'sass-loader'
            ]
        });
   }

   if(assets) {
    rules.push({
        test: new RegExp(`\\.(${assets.join("|")})$`),
        use: "raw-loader"
    })
}

   return {
       mode, output,
       entry: {
        index: entry
       },
       module: { rules },
       resolve: {
           extensions: [".ts", ".js"],
           alias: getAliases(path.join(__dirname, "tsconfig.json"), alias)
       }
   };
}

module.exports = {
    SingleEntry, getAliases, MultipleEntry
}