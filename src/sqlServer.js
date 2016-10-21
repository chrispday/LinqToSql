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
const I = require("./interfaces");
class SqlServerGenerator {
    SelectGenerator(dbSet, dbSetStatement) {
        const selectColumns = dbSet.dbSetConfiguration.ColumnConfigurations
            .map(c => `[${c.Name}]`)
            .join(",");
        return { selectColumns };
    }
    WhereGenerator(dbSet, dbSetStatement) {
        const fromTables = `[${dbSet.dbSetConfiguration.Database}].[${dbSet.dbSetConfiguration.Schema}].[${dbSet.dbSetConfiguration.Name}]`;
        return { fromTables };
    }
    GetGenerators() {
        let generators = {};
        generators[I.StatementType.Where] = this.WhereGenerator;
        generators[I.StatementType.From] = this.SelectGenerator;
        return generators;
    }
    Execute(dbSet) {
        return __awaiter(this, void 0, void 0, function* () {
            const generators = this.GetGenerators();
            const statement = dbSet.statements.map(s => generators[s.statementType](dbSet, s));
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
exports.SqlServerGenerator = SqlServerGenerator;
class DbSet {
    constructor(dbSetConfiguration, sqlGenerator) {
        this.dbSetConfiguration = dbSetConfiguration;
        this.sqlGenerator = sqlGenerator;
        this.statements = [{
                statementType: I.StatementType.From,
            }];
    }
    Select(f) {
        this.statements = this.statements.concat([{
                statementType: I.StatementType.Where,
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
exports.DbSet = DbSet;
//# sourceMappingURL=sqlServer.js.map