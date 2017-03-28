/**
 * @fileOverview start
 * @author sunwei on 2017-3-28
 * @module start
 */
"use strict";
global.smc = global.smc || {};
smc.config = require('./config');
smc.tools = require('./lib/tools');

const codegen = require('./lib');
new codegen().main();