"use strict";
const I = require("./interfaces");
const S = require("./sqlServer");
class Table1 {
}
class LinqToSqlContext {
    constructor() {
    }
    Table1() {
        return new S.DbSet({
            Database: "LinqToSql",
            Schema: "dbo",
            Name: "Table1",
            ColumnConfigurations: [
                { Name: "Id", DataType: I.SqlType.Number },
                { Name: "Number", DataType: I.SqlType.Number },
                { Name: "String", DataType: I.SqlType.String },
                { Name: "Boolean", DataType: I.SqlType.Boolean },
                { Name: "Text", DataType: I.SqlType.String },
            ]
        }, new S.SqlServerGenerator());
    }
}
var context = new LinqToSqlContext();
var query = context.Table1().Select(t => t);
console.log(query.toString());
var rows = query.ToArray();
//rows.then(rs => console.log("rows " + JSON.stringify(rs))); 
//# sourceMappingURL=index.js.map