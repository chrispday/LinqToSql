import * as acorn from "acorn";
import * as tedious from "tedious";

export module LinqToSql {

    export type Func<T, U> = (t: T) => U;

    export interface IQueryable<T> {
        Select(f: Func<T, T>): IQueryable<T>;
        ToArray(): Promise<Array<T>>;
        toString(): string;
    }

    export enum SqlType {
        Boolean,
        String,
        Number
    }

    export interface IDbColumnConfiguration {
        Name: string;
        DataType: SqlType;
    }

    export interface IDbSetConfiguration {
        Database: string;
        Schema: string;
        Name: string;
        ColumnConfigurations: IDbColumnConfiguration[];
    }

    export enum StatementType {
        From,
        Where
    }

    export interface IDbSetStatement {
        statementType: StatementType,
        statement?: string,
        parsed?: any
    }

    export interface ISqlServerStatement {
        selectColumns?: string,
        fromTables?: string,
    }

    export interface ISqlGenerator {
        Execute<T>(dbSet: DbSet<T>): Promise<Array<T>>;
    }

    export class SqlServerGenerator implements ISqlGenerator {
        SelectGenerator<T>(dbSet: DbSet<T>, dbSetStatement: IDbSetStatement): ISqlServerStatement {
            return { selectColumns:  dbSet.dbSetConfiguration.ColumnConfigurations.map(c => `[${c.Name}]`).join(",") }; 
        }

        WhereGenerator<T>(dbSet: DbSet<T>, dbSetStatement: IDbSetStatement): ISqlServerStatement {
            return { fromTables: `[${dbSet.dbSetConfiguration.Database}].[${dbSet.dbSetConfiguration.Schema}].[${dbSet.dbSetConfiguration.Name}]`};
        }

        async Execute<T>(dbSet: DbSet<T>): Promise<Array<T>> {
            let x = {};
            x[StatementType.Where] = this.WhereGenerator;
            x[StatementType.From] = this.SelectGenerator;

            const statement = dbSet.statements.map(s => x[s.statementType](dbSet, s)) as ISqlServerStatement[];

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
                return new Promise<Array<T>>((resolve, reject) => {
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
        }
    }

    export class DbSet<T> implements IQueryable<T> {
        public statements: IDbSetStatement[] = [ {
            statementType: StatementType.From,
        } ];

        constructor(public dbSetConfiguration: IDbSetConfiguration, public sqlGenerator: ISqlGenerator) {
        }

        Select(f: Func<T, T>): IQueryable<T> {
            this.statements = this.statements.concat([{
                statementType: StatementType.Where,
                statement: '' + f,
                parsed: acorn.parse('' + f)
            }]);
            return this;
        }

        async ToArray(): Promise<Array<T>> {
            return await this.sqlGenerator.Execute<T>(this);
        }

        toString(): string {
            return this.statements.map(s => "" + s.statementType + "->" + s.statement + "->" + JSON.stringify(s.parsed)).join("\\r\\n");
        }
    }
}

class Table1 {
    public Id: number;
    public String: string;
    public Boolean: boolean;
    public Text: string;
}

class LinqToSqlContext {
    constructor() {
    }

    Table1(): LinqToSql.IQueryable<Table1> {
        return new LinqToSql.DbSet<Table1>({
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