"use strict";

var fs = require("fs"),
    path = require("path"),
    webdriver = require("selenium-webdriver");

GLOBAL.driver = (new webdriver.Builder())
    .withCapabilities({ browserName: "chrome" })
    .build();

function renderLog(type, args) {
    console.log.apply(console, [`[${type.toUpperCase()}]`].concat(args));
}

class JasDriver {

    constructor(webdriverInstance) {
        this.driver = webdriverInstance;
    }

    checkStatus() {
        this.driver.executeScript(function() {
            return window.testCompleted;
        })
        .then((completed) => {
            if (completed) {
                clearInterval(this.logWatch);
                return this.driver.executeScript(function() {
                    return window.getStats();
                })
                .then((stats) => {
                    this.finish(stats)
                });
            }
        })
        .catch(function(err) {
            console.error(err);
        })
    }

    finish(stats) {
        console.log("\n");
        console.log("Tests finished");
        console.log("  Passed: ", stats.passed);
        console.log("  Failed: ", stats.failed);
        console.log("  Skipped: ", stats.skipped);
        if (stats.failed > 0) {
            process.exit(1);
        }
    }

    initialise(url) {
        this.driver.get(url);
    }

    watchLogs() {
        this.logWatch = setInterval(() => {
            this.driver.executeScript(function() {
                return window.fetchLogs();
            })
            .then(function(logs) {
                logs.forEach(function(log) {
                    renderLog(log.type, log.args);
                })
            })
            .then(() => {
                return this.checkStatus();
            })
            .catch(function(err) {
                console.error("Logging error:", err);
            })
        }, 500);
    }

}

var content = fs.readFileSync(__dirname + "/resources/template.html").toString("utf8");
var jasmineScripts = [
        "lib/jasmine-core/jasmine.js",
        "lib/jasmine-core/jasmine-html.js",
        "lib/jasmine-core/boot.js"
    ]
    .map((jasmineFilePath) => `file://${path.resolve(__dirname + "/node_modules/jasmine-core", jasmineFilePath)}`)
    .map((fileURL) => `<script type="text/javascript" src="${fileURL}"></script>`)
    .concat([
        `<link rel="stylesheet" href="file://${path.resolve(__dirname + "/node_modules/jasmine-core/lib/jasmine-core", "jasmine.css")}" />`
    ]);
content = content.replace('<!-- JASMINE_SETUP -->', jasmineScripts.join("\n"));
var specScripts = [
        `file://${path.resolve(__dirname, "tests/main.js")}`
    ]
    .map((fileURL) => `<script type="text/javascript" src="${fileURL}"></script>`);
content = content.replace('<!-- JASMINE_SPECS -->', specScripts.join("\n"));
fs.writeFileSync(__dirname + "/build/runner.html", content);

var url = "file://" + path.resolve(__dirname, "build/runner.html");

var jd = new JasDriver(GLOBAL.driver);
jd.initialise(url);
jd.watchLogs();

GLOBAL.driver.getTitle().then(function(title) { console.log("TITLE!!!", title); });
