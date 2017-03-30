/**
 * @fileOverview index
 * @author sunwei on 2017-3-28
 * @module index
 */
"use strict";
const dialect = smc.config.dialect;
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const then = require('thenjs');
const tools = smc.tools;

/** 模板文件位置*/
const entityTempPath = 'template/entityTemplate.ejs';//entity文件模板
const partialDacTempPath = 'template/partialDacTemplate.ejs';//partial中的dac文件模板
const dacTempPath = 'template/dacTemplate.ejs';//dac文件模板
const logicTempPath = 'template/logicTemplate.ejs';//logic文件模板

/** 输出代码位置，需要提前建好文件夹*/
const entityPath = './codes/entity/';//entity文件生成位置
const partialDACPath = './codes/dac/partial/';//partial中的dac文件位置
const dacPath = './codes/dac/';//dac文件位置
const logicPath = './codes/logic/';//logic文件位置

class codegen {
    constructor() {
        this.dbHandle = null;
        switch (dialect) {
            case 'mysql':
                this.dbHandle = require('./mysql');
                break;
            default:
                this.dbHandle = require('./mysql');
                break;
        }
    }

    main() {
        let _this = this;
        let dbHandle = new this.dbHandle();
        let DBData = [];
        return dbHandle.getTables()
            .then(function (cont, tables) {
                DBData = tables;
                then.each([entityPath, dacPath, partialDACPath, logicPath], function (con, path) {
                    return _this.mkdirs(path).fin(con);
                }).fin(cont);
            })
            .then(function (cont) {
                /** 生成entity文件*/
                try {
                    then.each(DBData, function (con, table) {
                        _this.generateCodeFile(table, entityTempPath, entityPath + table.friendlyTableName + 'Model.js').fin(con);
                    }).fin(cont);
                }
                catch (e) {
                    cont(e);
                }
            })
            .then(function (cont) {
                /** 生成partialDac文件*/
                try {
                    then.each(DBData, function (con, table) {
                        _this.generateCodeFile(table, partialDacTempPath, partialDACPath + table.friendlyTableName + 'DAC.js').fin(con);
                    }).fin(cont);
                }
                catch (e) {
                    cont(e);
                }
            })
            .then(function (cont) {
                /** 生成dac文件*/
                try {
                    then.each(DBData, function (con, table) {
                        _this.generateCodeFile(table, dacTempPath, dacPath + table.friendlyTableName + 'DAC.js').fin(con);
                    }).fin(cont);
                }
                catch (e) {
                    cont(e);
                }
            })
            .then(function (cont) {
                /** 生成logic文件*/
                try {
                    then.each(DBData, function (con, table) {
                        _this.generateCodeFile(table, logicTempPath, logicPath + table.friendlyTableName + 'Logic.js').fin(con);
                    }).fin(cont);
                }
                catch (e) {
                    cont(e);
                }
            })
            .fail(function (cont, err) {
                cont(err);
            });
    }

    generateCodeFile(data, template, outpath) {
        return then(function (cont) {
            fs.readFile(template, {encoding: 'utf8'}, function (err, ejsT) {
                if (err) {
                    cont(err);
                    return;
                }
                let _data = Object.assign({}, data, {fnUpperName: tools.toUpperCamelCase});
                let fileContent = ejs.compile(ejsT, {filename: template})(_data);
                fs.writeFile(outpath, fileContent, {encoding: 'utf8'}, function (e) {
                    if (e) {
                        cont(err);
                        return;
                    }
                    cont(null, true);
                });
            });
        });
    }

    mkdirs(dir) {
        function mkdirs_loop(dirpath, callback) {
            fs.exists(dirpath, function (exists) {
                if (exists) {
                    callback(dirpath);
                } else {
                    mkdirs_loop(path.dirname(dirpath), function () {
                        fs.mkdir(dirpath, callback);
                    });
                }
            });
        }

        return then(function (cont) {
            mkdirs_loop(dir, function (path) {
                cont(null, path);
            });
        });
    }
}

module.exports = codegen;