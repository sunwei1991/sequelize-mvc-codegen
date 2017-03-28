/**
 * @fileOverview index
 * @author sunwei on 2017-3-28
 * @module index
 */
"use strict";
const dialect = smc.config.dialect;
const then = require('thenjs');
const ejs = require('ejs');
const fs = require('fs');
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
        return dbHandle.getTables()
            .then(function (cont, tables) {
                _this.generateCodeFile(tables[0], entityTempPath, entityPath+'testModel.js').fin(cont);
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
                let fileContent = ejs.compile(ejsT, {filename: template})(data);
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
}

module.exports = codegen;


function setParamName_ejs(name) {
    var except = {"qq": 0, "id": 0, "ip": 0};
    if (name.length > 1 && except[name.toLocaleLowerCase()] != 0) {
        return name.substr(0, 1).toLocaleUpperCase() + name.substr(1);
    }
    else {
        return name.toLocaleUpperCase();
    }
}