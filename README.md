# JasDriver
Testing framework integration for Jasmine and Webdriver.

[![Node compatibility](https://img.shields.io/badge/node-%3E%3D%205.0.0-green.svg?style=flat)](https://github.com/nodejs/node/blob/v5.0.0/CHANGELOG.md) [![Build Status](https://travis-ci.org/perry-mitchell/jasdriver.svg?branch=master)](https://travis-ci.org/perry-mitchell/jasdriver) [![license](https://img.shields.io/npm/l/jasdriver.svg?maxAge=2592000)](https://www.npmjs.com/package/jasdriver)

## About
Jasmine is an amazing testing framework, just as Webdriver is a fantastic browser automation tool. These two pieces of software haven't worked so amazingly well together, until now.

Injecting tests etc. into a Webdriver session is not an amazingly complicated task, but why do all that work for a single project? **JasDriver** takes care of that mess for you, by proving a simple interface to configure your testing needs (specs, webdriver config).

## Configuration
JasDriver needs a simple configuration file, called `jasdriver.config.js`:

```
module.exports = {
    closeDriverOnFinish: true,
    exitOnFinish: true,
    junitOutput: "./junit-report.xml",
    runnerDir: ".",
    runnerFilename: "_SpecRunner.html",
    specs: [],
    specFilter: function(filename) { return /\.spec\.js$/.test(filename); },
    webdriver: null,
    webdriverBrowser: "chrome"
};
```

Most of the configuration can be left alone in any normal situation. JasDriver _will automatically_ create a webdriver session for you, with Chrome, if you don't configure a thing.

To get off the ground, simply pass in your spec filenames (absolute paths).

_You can also use a different name for the config file, providing you pass its path into the jasdriver cli command. JasDriver looks for the config file in the current directory._

### closeDriverOnFinish
Close the webdriver instance upon finishing the tests. Runs `webdriver.quit()` under the hood.

### exitOnFinish
Allow JasDriver to run `process.exit()` when finished (used for returning non-zero exit codes for failures).

### junitOutput
Output results to a JUnit XML file - the path for the output file.

### runnerDir
The directory to place the spec-runner in.

### runnerFilename
The filename of the spec-runner.

### specs
An array of absolute paths to the spec files you want to include. These do not only have to contain tests, they can be helpers and assets also. These are executed in order.

Paths can also be directories, which are scanned recursively.

### specFilter
Provide a filtering function to filter each spec by its filename. The default filter function is `function() { return true; }`.

### webdriver
Provide a webdriver instance for JasDriver to use. This is set to `null` by default, so that JasDriver will build its own instance using `webdriverBrowser` as the browser type.

### webdriverBrowser
If JasDriver builds its own instance of webdriver, it will use this setting as the `browserName` value when initialising.

## Setting it up in your project
With a few easy steps, it's easy to use JasDriver in your project.

**Firstly**, install JasDriver:

```
npm install jasdriver --save-dev
```

Jump into your `package.json` and add a test script:

```
{
    "name": "MyApp",
    "scripts": {
        "test": "jasdriver"
    }
}
```

Create a `tests` folder - you'll place your jasmine test files in here.

Next, add a JasDriver config file to the root directory of your project:

```
const path = require("path");

module.exports = {
    specs: [
        path.resolve(__dirname, "tests")
    ]
};
```

Once you've added a test to your `tests` directory, simply run `npm test` in your project root to see the tests run!
