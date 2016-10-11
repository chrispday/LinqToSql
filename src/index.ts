import parseFunction = require("parse-function");
import tedious = require("tedious");

type Func<T, U> = (t: T) => U;

interface IQueryable<T> {
    Select(f: Func<T, T>): IQueryable<T>;
    ToArray(): Promise<Array<T>>;
    toString(): string;
}

enum SqlType {
    Boolean,
    String,
    Number
}

interface IDbColumnConfiguration {
    Name: string;
    DataType: SqlType;
}

interface IDbSetConfiguration {
    Database: string;
    Schema: string;
    Name: string;
    ColumnConfigurations: IDbColumnConfiguration[];
}

enum StatementType {
    Where
}

interface IDbSetStatement {
    statementType: StatementType,
    statement: string,
    parsed: any
}

interface ISqlGenerator {
    Execute<T>(dbSet: DbSet<T>): Promise<Array<T>>;
}

class SqlServerGenerator implements ISqlGenerator {
    async Execute<T>(dbSet: DbSet<T>): Promise<Array<T>> {
        const columns = dbSet.dbSetConfiguration.ColumnConfigurations.map(c => `[${c.Name}]`).join(",");
        const table = `[${dbSet.dbSetConfiguration.Database}].[${dbSet.dbSetConfiguration.Schema}].[${dbSet.dbSetConfiguration.Name}]`;
        const sql = `select ${columns} from ${table}`;
        console.log(sql);
        const conn = new tedious.Connection({ server: "localhost", userName: "testuser", password: "testpassword", options: { useColumnNames: true, rowCollectionOnRequestCompletion: true }});
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

class DbSet<T> implements IQueryable<T> {
    public statements: IDbSetStatement[] = [];

    constructor(public dbSetConfiguration: IDbSetConfiguration, public sqlGenerator: ISqlGenerator) {
    }

    Select(f: Func<T, T>): IQueryable<T> {
        this.statements = this.statements.concat([{ 
            statementType: StatementType.Where, 
            statement: '' + f,
            parsed: parseFunction(f) 
        }]);
        return this;
    }

    async ToArray(): Promise<Array<T>> {
        return await this.sqlGenerator.Execute<T>(this);
    }

    toString() : string {
        return this.statements.map(s => "" + s.statementType + "->" + s.statement + "->" + JSON.stringify(s.parsed)).join("\\r\\n");
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

    Table1(): IQueryable<Table1> {
        return new DbSet<Table1>({
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