"use strict";

function renderLog(type, args) {
    console.log.apply(console, [`[${type.toUpperCase()}]`].concat(args));
}

class JasDriver {

    constructor(webdriverInstance, config) {
        this.driver = webdriverInstance;
        this.config = config;
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
        if (stats.failed > 0 && this.config.exitOnFinish) {
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

module.exports = JasDriver;
