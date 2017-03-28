/**
 * @fileOverview mysql
 * @author sunwei on 2017-3-28
 * @module mysql
 */
"use strict";
const mysql = require('mysql');
const then = require('thenjs');
const tools = smc.tools;

class dbHandle {
    constructor() {
        this.config = smc.config;
        this.connection = mysql.createConnection({
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
            password: this.config.password,
            database: this.config.database
        });
    }

    getTables() {
        let _this = this;
        _this.connection.connect();
        return this.tables()
            .then(function (cont, tables) {
                let task = [];
                tables.forEach(function (table) {
                    task.push(function (con) {
                        _this.tableInfo(table)
                            .then(function (c, columns) {
                                con(null, {
                                    friendlyTableName: tools.toLowerCamelCase(table),
                                    tableName: table,
                                    columns: columns
                                });
                            })
                            .fail(con);
                    })
                });
                then.parallel(task).fin(cont);
            })
            .then(function (cont, tables) {
                _this.connection.end();
                cont(null, tables);
            })
            .fail(function (cont, err) {
                cont(err);
            });
    }

    tables() {
        let _this = this;
        return then(function (cont) {
            let temp = {};
            let tables = [];
            _this.connection.query('show tables', function (err, data, fields) {
                if (err) {
                    cont(err);
                    return;
                }
                if (data.length > 0) {
                    data.forEach(function (table) {
                        for (let key in table) {
                            temp[table[key]] = table[key];
                        }
                    });
                    for (let name in temp) {
                        tables.push(name);
                    }
                }
                cont(null, tables);

            });
        });
    }

    tableInfo(tableName) {
        let _this = this;
        return then(function (cont) {
            var sql = 'desc ' + tableName;
            _this.connection.query(sql, function (err, data, fields) {
                if (err) {
                    cont(err);
                }
                else {
                    cont(null, _this.formatSchema(data));
                }
            });
        });
    }

    formatSchema(tableInfo) {
        var ret = [];
        tableInfo.forEach(function (row) {
            var col = {};
            col['name'] = row["Field"] || null;
            col["type"] = tools.typeHandle(row["Type"]);
            col["allowNull"] = row["Null"] ? row["Null"].toLocaleLowerCase() == 'yes' : false;
            col["primaryKey"] = row["Key"] ? row["Key"].toLocaleLowerCase() == 'pri' : false;
            col["autoIncrement"] = row["Extra"] ? row["Extra"].toLocaleLowerCase() == 'auto_increment' : false;
            col["defaultValue"] = row["Default"];
            col["friendlyName"] = tools.toLowerCamelCase(col['name']);
            ret.push(col);
        });

        return ret;
    }
}

module.exports = dbHandle;