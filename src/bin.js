#!/usr/bin/env node
const cli = require('./src/index');
const args = process.argv.slice(2);
cli.run(args);

process.title = ["hexa", ...args].join(" ");
