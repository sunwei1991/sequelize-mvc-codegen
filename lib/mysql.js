/**
 * @fileOverview mysql
 * @author sunwei on 2017-3-28
 * @module mysql
 */
"use strict";

var mysql = require('mysql');
var then = require('thenjs');
var ejs = require('ejs');
var fs = require('fs');
var read = require('fs').readFileSync;
/** 模板文件位置*/
var entityTempPath = 'template/entityTemplate.ejs';//entity文件模板
var partialDacTempPath = 'template/partialDacTemplate.ejs';//partial中的dac文件模板
var dacTempPath = 'template/dacTemplate.ejs';//dac文件模板
var logicTempPath = 'template/logicTemplate.ejs';//logic文件模板

/** 输出代码位置，需要提前建好文件夹*/
var entityPath = './codes/entity/';//entity文件生成位置
var partialDACPath = './codes/dac/partial/';//partial中的dac文件位置
var dacPath = './codes/dac/';//dac文件位置
var logicPath = './codes/logic/';//logic文件位置

/** mysql 数据库配置*/
var config = {
    host: '192.168.31.144',
    port:33061,
    user: 'mopit',
    password: 'mopit123!',
    database: 'mopit_university'
};

/**
 * @description 获取数据库中所有的表的名称
 * @author sunwei 2016.4.14
 * @returns {Array} 返回数据库中所有表的名称
 */
function getAllTableName() {
    return then(function (cont) {
        var connection = mysql.createConnection(config);
        var _t = {};
        var tn = [];
        connection.connect();
        connection.query('show tables', function (err, data, fields) {
            if (err) {
                cont(err);
            }
            else {
                if (data.length > 0) {
                    data.forEach(function (table) {
                        for (var k in table) {
                            _t[table[k]] = table[k];
                        }
                    });
                    for (var i in _t) {
                        tn.push(i);
                    }
                }
                cont(null, tn);
            }
        });
        connection.end();
    });
}

/**
 * @description 获取表的结构信息
 * @author sunwei 2016.4.14
 * @param {String} tableName 表名称
 * @returns {Array} 返回表的每一列的结构信息
 */
function getTableSchema(tableName) {
    return then(function (cont) {
        var connection = mysql.createConnection(config);
        connection.connect();
        var sql = 'desc ' + tableName;
        connection.query(sql, function (err, data, fields) {
            if (err) {
                cont(err);
            }
            else {
                cont(null, data);
            }
        });
    });
}

/**
 * @description 返回小驼峰法名称，eg:adminInfo
 * @author sunwei 2016.4.14
 * @param {String} name 输入
 * @returns {String} 输出，如adminInfo
 */
function getFormatName(name) {
    if (name == undefined || name == null || name == '') {
        return null;
    }
    var nameList = name.split('_');
    var except = {"qq": 0, "id": 0, "ip": 0};
    var ret = [];
    for (var i = 0; i < nameList.length; i++) {
        var temp = nameList[i];
        if (i == 0) {
            if (temp.length > 1 && except[temp.toLocaleLowerCase()] != 0) {
                ret.push(temp.substr(0, 1).toLocaleLowerCase() + temp.substr(1));
            }
            else {
                ret.push(temp.toLocaleLowerCase());
            }
        }
        else {
            if (temp.length > 1 && except[temp.toLocaleLowerCase()] != 0) {
                ret.push(temp.substr(0, 1).toLocaleUpperCase() + temp.substr(1));
            }
            else {
                ret.push(temp.toLocaleUpperCase());
            }
        }
    }
    return ret.join('');
}

function setParamName_ejs(name) {
    var except = {"qq": 0, "id": 0, "ip": 0};
    if (name.length > 1 && except[name.toLocaleLowerCase()] != 0) {
        return name.substr(0, 1).toLocaleUpperCase() + name.substr(1);
    }
    else {
        return name.toLocaleUpperCase();
    }
}

/**
 * @description 格式化数据库中返回的表的结构信息
 * @author sunwei 2016.4.14
 * @param {Array} table 表的每一列的结构信息
 * @returns {Array} 返回格式化后的表的每一列的结构信息
 */
function formatTableSchema(table) {
    var ret = [];
    table.forEach(function (schema) {
        var col = {};
        col['name'] = schema["Field"] || null;
        col["type"] = getColumnType(schema["Type"]);
        col["allowNull"] = schema["Null"] ? schema["Null"].toLocaleLowerCase() == 'yes' : false;
        col["primaryKey"] = schema["Key"] ? schema["Key"].toLocaleLowerCase() == 'pri' : false;
        col["autoIncrement"] = schema["Extra"] ? schema["Extra"].toLocaleLowerCase() == 'auto_increment' : false;
        col["defaultValue"] = schema["Default"];
        col["friendlyName"] = getFormatName(col['name']);
        ret.push(col);
    });

    return ret;
}

/**
 * @description 根据mysql数据类型返回sequelize对应的类型
 * @author sunwei 2016.4.14
 * @param {String} t mysql数据类型
 * @returns {string} sequelize对应的类型
 */
function getColumnType(t) {
    var type = "STRING";
    switch (t.replace(/\(\d{0,}\)/, '').toLocaleLowerCase()) {
        case "int":
            type = "INTEGER";
            break;
        case "bigint":
            type = "BIGINT";
            break;
        case "char":
            type = "CHAR";
            break;
        case "varchar":
            type = "STRING";
            break;
        case "datetime":
            type = "DATE";
            break;
        case "text":
            type = "TEXT";
            break;
        case "float":
            type = "FLOAT";
            break;
        case "bigint":
            type = "BIGINT";
            break;
        case "double":
            type = "DOUBLE";
            break;
        case "decimal":
            type = "DECIMAL";
            break;
        default:
            type = "STRING";
            break;
    }
    return type;
}

/**
 * @description 创建每一个表的entity、dac、logic文件
 * @author sunwei 2016.4.14
 * @param tableName 表名
 * @returns {Boolean} 是否创建成功
 */
function createTableSchema(tableName) {
    return getTableSchema(tableName).then(function (cont, table) {
        var columns = formatTableSchema(table);
        var templateDate = {
            friendlyTableName: getFormatName(tableName),
            tableName: tableName,
            columns: columns,
            fnUpperName: setParamName_ejs
        };
        try {
            var entityText = ejs.compile(read(entityTempPath, 'utf8'), {filename: entityTempPath})(templateDate);
            var partDacText = ejs.compile(read(partialDacTempPath, 'utf8'), {filename: partialDacTempPath})(templateDate);
            var dacText = ejs.compile(read(dacTempPath, 'utf8'), {filename: dacTempPath})(templateDate);
            var logicText = ejs.compile(read(logicTempPath, 'utf8'), {filename: logicTempPath})(templateDate);
            fs.writeFileSync(entityPath + getFormatName(tableName) + 'Model.js', entityText, {encoding: 'utf8'});
            fs.writeFileSync(partialDACPath + getFormatName(tableName) + 'DAC.js', partDacText, {encoding: 'utf8'});
            fs.writeFileSync(dacPath + getFormatName(tableName) + 'DAC.js', dacText, {encoding: 'utf8'});
            fs.writeFileSync(logicPath + getFormatName(tableName) + 'Logic.js', logicText, {encoding: 'utf8'});
            cont(null, true);
        }
        catch (e) {
            cont(e);
        }

    }).fail(function (cont, err) {
        cont(err);
    });
}

/**
 * @description 程序运行入口，读取数据库信息，创建每个表的entity、dac、logic文件
 */
function work() {
    getAllTableName()
        .then(function (cont, tables) {
            if (tables.length <= 0) {
                cont('当前数据库中还没有表');
            }
            else {
                cont(null, tables);
            }
        })
        .then(function (cont, tables) {
            var task = [];
            tables.forEach(function (table) {
                task.push(function (con) {
                    createTableSchema(table).fin(con);
                });
            });
            then.parallelLimit(task, 1)
                .then(function (cont1, data) {
                    var r = false;
                    data.forEach(function (d) {
                        r = r || d;
                    });
                    console.log('代码自动生成工具运行完毕');
                    console.log(r);
                    process.exit(1);
                })
                .fail(cont);
        })
        .fail(function (cont, err) {
            console.log('代码自动生成工具运行出错');
            console.error(err);
            process.exit(1);
        });
}

/** 运行主函数*/
work();