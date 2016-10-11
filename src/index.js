"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const parseFunction = require("parse-function");
const tedious = require("tedious");
var SqlType;
(function (SqlType) {
    SqlType[SqlType["Boolean"] = 0] = "Boolean";
    SqlType[SqlType["String"] = 1] = "String";
    SqlType[SqlType["Number"] = 2] = "Number";
})(SqlType || (SqlType = {}));
var StatementType;
(function (StatementType) {
    StatementType[StatementType["Where"] = 0] = "Where";
})(StatementType || (StatementType = {}));
class SqlServerGenerator {
    Execute(dbSet) {
        return __awaiter(this, void 0, void 0, function* () {
            const columns = dbSet.dbSetConfiguration.ColumnConfigurations.map(c => `[${c.Name}]`).join(",");
            const table = `[${dbSet.dbSetConfiguration.Database}].[${dbSet.dbSetConfiguration.Schema}].[${dbSet.dbSetConfiguration.Name}]`;
            const sql = `select ${columns} from ${table}`;
            console.log(sql);
            const conn = new tedious.Connection({ server: "localhost", userName: "testuser", password: "testpassword", options: { useColumnNames: true, rowCollectionOnRequestCompletion: true } });
            let connPromise = new Promise((resolve, reject) => {
                conn.on("connect", err => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            });
            let requestPromise = connPromise.then(() => {
                return new Promise((resolve, reject) => {
                    const request = new tedious.Request(sql, (err, rowCount, rows) => {
                        if (err) {
                            reject(err);
                        }
                        conn.close();
                        resolve(rows);
                    });
                    request.on("row", columns => { });
                    conn.execSql(request);
                });
            });
            return requestPromise;
        });
    }
}
class DbSet {
    constructor(dbSetConfiguration, sqlGenerator) {
        this.dbSetConfiguration = dbSetConfiguration;
        this.sqlGenerator = sqlGenerator;
        this.statements = [];
    }
    Select(f) {
        this.statements = this.statements.concat([{
                statementType: StatementType.Where,
                statement: '' + f,
                parsed: parseFunction(f)
            }]);
        return this;
    }
    ToArray() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.sqlGenerator.Execute(this);
        });
    }
    toString() {
        return this.statements.map(s => "" + s.statementType + "->" + s.statement + "->" + JSON.stringify(s.parsed)).join("\\r\\n");
    }
}
class Table1 {
}
class LinqToSqlContext {
    constructor() {
    }
    Table1() {
        return new DbSet({
            Database: "LinqToSql",
            Schema: "dbo",
            Name: "Table1",
            ColumnConfigurations: [
                { Name: "Id", DataType: SqlType.Number },
                { Name: "Number", DataType: SqlType.Number },
                { Name: "String", DataType: SqlType.String },
                { Name: "Boolean", DataType: SqlType.Boolean },
                { Name: "Text", DataType: SqlType.String },
            ]
        }, new SqlServerGenerator());
    }
}
var context = new LinqToSqlContext();
var rows = context.Table1().Select(t => t).ToArray();
rows.then(rs => console.log("rows " + JSON.stringify(rs)));
//# sourceMappingURL=index.js.map