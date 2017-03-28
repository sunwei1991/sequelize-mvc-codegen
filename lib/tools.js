/**
 * @fileOverview tools
 * @author sunwei on 2017-3-28
 * @module tools
 */
"use strict";
module.exports = {
    toLowerCamelCase: function (str) {
        if (str == undefined || str == null || str == '') {
            return null;
        }
        let nameList = str.split('_');
        let except = {"qq": 0, "id": 0, "ip": 0};
        let ret = [];
        for (let i = 0; i < nameList.length; i++) {
            let temp = nameList[i];
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
    },
    toUpperCamelCase: function (str) {
        if (str == undefined || str == null || str == '') {
            return null;
        }
        let nameList = str.split('_');
        let except = {"qq": 0, "id": 0, "ip": 0};
        let ret = [];
        for (let i = 0; i < nameList.length; i++) {
            let temp = nameList[i];
            if (temp.length > 1 && except[temp.toLocaleLowerCase()] != 0) {
                ret.push(temp.substr(0, 1).toLocaleUpperCase() + temp.substr(1));
            }
            else {
                ret.push(temp.toLocaleUpperCase());
            }
        }
        return ret.join('');
    },
    typeHandle: function (str) {
        var type = "STRING";
        switch (str.replace(/\(\d{0,}\)/, '').toLocaleLowerCase()) {
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
};