"use strict";

const path = require("path");
const fs = require("fs");
const Webdriver = require("selenium-webdriver");

const JasDriver = require("./JasDriver.js");
const log = require("./log.js");
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

function jasDriver(config, options) {
    config = Object.assign({
        closeDriverOnFinish: true,
        exitOnFinish: true,
        junitOutput: false,
        runnerDir: BUILD_DIR,
        runnerFilename: "_SpecRunner.html",
        specs: [],
        specFilter: function() { return true; },
        webdriver: null,
        webdriverBrowser: "chrome"
    }, config);
    options = Object.assign({
        singleConfig: true
    }, options || {});
    // webdriver setup
    let webdriver = config.webdriver;
    if (!webdriver) {
        try {
            let webdriverCapabilities = { browserName: config.webdriverBrowser };

            if (config.webdriverBrowser === "chrome") {
                webdriverCapabilities = Webdriver.Capabilities.chrome();
                webdriverCapabilities.set('chromeOptions', {
                    'args': ["--allow-file-access-from-files"]
                });
            }

            webdriver = (new Webdriver.Builder())
                .withCapabilities(webdriverCapabilities)
                .build();
        } catch (err) {
            console.error(err);
            throw err;
        }
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
    let browserName = config.webdriver ? "(provided)" : config.webdriverBrowser;
    log("info", `Starting tests with browser: ${browserName}`);
    let jd = new JasDriver(webdriver, config, options);
    jd.initialise(`file://${runnerPath}`);
    jd.watchLogs();
    return jd.waitForCompletion();
};

module.exports = function bootJasDriver(configs) {
    let configsArr = Array.isArray(configs) ? configs : [configs],
        numConfigs = configsArr.length,
        promChain = Promise.resolve(),
        singleConfig = configsArr.length === 1;
    configsArr.forEach(function(config, index) {
        let isLast = (index === configsArr.length - 1);
        promChain = promChain.then(function() {
            return jasDriver(
                    config,
                    {
                        isLast,
                        singleConfig
                    }
                );
        });
    });
    return promChain.then(function() {
            //console.log("\n-> All test configurations have completed.\n");
            if (numConfigs > 1) {
                log("info", `${numConfigs} test configurations have completed`);
            }
        })
        .catch(function(error) {
            log("error", error);
            process.exit(2);
        });
};
