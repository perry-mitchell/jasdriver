#! /usr/local/bin/node

"use strict";

const jasdriver = require("./index.js");
const path = require("path");

let cwd = process.cwd(),
    potentialConfig = path.resolve(cwd, "jasdriver.config.js"),
    args = process.argv;

let configPath = (args.length > 2) ? args[2] : potentialConfig,
    isAbsolute = (path.resolve(configPath) === path.normalize(configPath));
if (!isAbsolute) {
    configPath = path.resolve(cwd, configPath);
}

console.log(`
    ___          ______      _
   |_  |         |  _  \\    (_)
     | | __ _ ___| | | |_ __ ___   _____ _ __
     | |/ _` / __| | | | '__| \\ \\ / / _ \\ '__|
 /\\__/ / (_| \\__ \\ |/ /| |  | |\\ V /  __/ |
 \\____/ \\__,_|___/___/ |_|  |_| \\_/ \\___|_|

`);
