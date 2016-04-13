"use strict";

const path = require("path");
const fs = require("fs");

const JasDriver = require("./JasDriver.js");
const specResolver = require("./specResolver.js");

const BUILD_DIR = path.resolve(__dirname, "../build");
const RUNNER_TEMPLATE_PATH = path.resolve(__dirname, "../resources/template.html");

function filePathToElement(path, elType) {
    if (elType === "script") {
        return `<script type="text/javascript" src="${path}"></script>`;
    } else if (elType === "link") {
        return `<link rel="stylesheet" href="${path}" />`;
    }
    throw new Error("Unrecognised element type: "+ elType);
}

module.exports = function jasDriver(config, webdriver) {
    config = Object.assign({
        closeDriverOnFinish: true,
        exitOnFinish: true,
        runnerDir: BUILD_DIR,
        runnerFilename: "_SpecRunner.html",
        specs: [],
        specFilter: function() { return true; },
        webdriverBrowser: "chrome"
    }, config);
    // webdriver setup
    if (!webdriver) {
        let Webdriver = require("selenium-webdriver");
        webdriver = (new Webdriver.Builder())
            .withCapabilities({ browserName: config.webdriverBrowser })
            .build();
    }
    // post-processing
    let specs = config.specs;
    config.specs = [];
    specs.forEach(function(specID) {
        let newSpecs = specResolver(specID, config.specFilter);
        if (newSpecs.length > 0) {
            config.specs = config.specs.concat(newSpecs);
        }
    });
    // runner construction
    let runnerContent = fs.readFileSync(RUNNER_TEMPLATE_PATH).toString("utf8"),
        runnerPath = path.resolve(config.runnerDir, config.runnerFilename),
        headerEls = [
                "lib/jasmine-core/jasmine.js",
                "lib/jasmine-core/jasmine-html.js",
                "lib/jasmine-core/boot.js"
            ]
            .map((filename) => `file://${path.resolve(__dirname + "/../node_modules/jasmine-core", filename)}`)
            .map((url) => filePathToElement(url, "script"))
            .concat([
                filePathToElement(`file://${path.resolve(__dirname +
                    "/../node_modules/jasmine-core/lib/jasmine-core", "jasmine.css")}`, "link")
            ]),
        specEls = config.specs
            .map((filename) => `file://${filename}`)
            .map((url) => filePathToElement(url, "script"));
    runnerContent = runnerContent
        .replace("<!-- JASMINE_SETUP -->", headerEls.join("\n") + "\n")
        .replace("<!-- JASMINE_SPECS -->", specEls.join("\n") + "\n");
    fs.writeFileSync(runnerPath, runnerContent);
    // create the JasDriver
    let jd = new JasDriver(webdriver, config);
    jd.initialise(`file://${runnerPath}`);
    jd.watchLogs();
};
