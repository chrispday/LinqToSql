"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const acorn = require("acorn");
const tedious = require("tedious");
var LinqToSql;
(function (LinqToSql) {
    (function (SqlType) {
        SqlType[SqlType["Boolean"] = 0] = "Boolean";
        SqlType[SqlType["String"] = 1] = "String";
        SqlType[SqlType["Number"] = 2] = "Number";
    })(LinqToSql.SqlType || (LinqToSql.SqlType = {}));
    var SqlType = LinqToSql.SqlType;
    (function (StatementType) {
        StatementType[StatementType["From"] = 0] = "From";
        StatementType[StatementType["Where"] = 1] = "Where";
    })(LinqToSql.StatementType || (LinqToSql.StatementType = {}));
    var StatementType = LinqToSql.StatementType;
    class SqlServerGenerator {
        SelectGenerator(dbSet, dbSetStatement) {
            return { selectColumns: dbSet.dbSetConfiguration.ColumnConfigurations.map(c => `[${c.Name}]`).join(",") };
        }
        WhereGenerator(dbSet, dbSetStatement) {
            return { fromTables: `[${dbSet.dbSetConfiguration.Database}].[${dbSet.dbSetConfiguration.Schema}].[${dbSet.dbSetConfiguration.Name}]` };
        }
        Execute(dbSet) {
            return __awaiter(this, void 0, void 0, function* () {
                let x = {};
                x[StatementType.Where] = this.WhereGenerator;
                x[StatementType.From] = this.SelectGenerator;
                const statement = dbSet.statements.map(s => x[s.statementType](dbSet, s));
                let sql = `select ${statement.map(s => s.selectColumns || "").filter(s => 0 !== s.length).join(",")}
from ${statement.map(s => s.fromTables || "").filter(s => 0 !== s.length).join("\r\n")}`;
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
    LinqToSql.SqlServerGenerator = SqlServerGenerator;
    class DbSet {
        constructor(dbSetConfiguration, sqlGenerator) {
            this.dbSetConfiguration = dbSetConfiguration;
            this.sqlGenerator = sqlGenerator;
            this.statements = [{
                    statementType: StatementType.From,
                }];
        }
        Select(f) {
            this.statements = this.statements.concat([{
                    statementType: StatementType.Where,
                    statement: '' + f,
                    parsed: acorn.parse('' + f)
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
    LinqToSql.DbSet = DbSet;
})(LinqToSql = exports.LinqToSql || (exports.LinqToSql = {}));
class Table1 {
}
class LinqToSqlContext {
    constructor() {
    }
    Table1() {
        return new LinqToSql.DbSet({
            Database: "LinqToSql",
            Schema: "dbo",
            Name: "Table1",
            ColumnConfigurations: [
                { Name: "Id", DataType: LinqToSql.SqlType.Number },
                { Name: "Number", DataType: LinqToSql.SqlType.Number },
                { Name: "String", DataType: LinqToSql.SqlType.String },
                { Name: "Boolean", DataType: LinqToSql.SqlType.Boolean },
                { Name: "Text", DataType: LinqToSql.SqlType.String },
            ]
        }, new LinqToSql.SqlServerGenerator());
    }
}
var context = new LinqToSqlContext();
var query = context.Table1().Select(t => t);
console.log(query.toString());
var rows = query.ToArray();
//rows.then(rs => console.log("rows " + JSON.stringify(rs))); 
//# sourceMappingURL=index.js.map