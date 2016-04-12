"use strict";

const fs = require("fs");
const path = require("path");

module.exports = function resolveSpec(identifier, filterFn) {
    let stat = fs.lstatSync(identifier);
    if (stat) {
        if (stat.isFile() && filterFn(identifier)) {
            return [path.normalize(identifier)];
        } else if (stat.isDirectory()) {
            let items = fs.readdirSync(identifier),
                results = [];
            items.forEach(function(item) {
                let subPath = path.resolve(identifier, item),
                    subRes = resolveSpec(subPath, filterFn);
                if (subRes.length > 0) {
                    results = results.concat(subRes);
                }
            });
            return results;
        }
    }
    return [];
    //throw new Error("Invalid spec location: " + identifier);
};
