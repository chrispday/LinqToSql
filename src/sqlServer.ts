import * as acorn from "acorn";
import * as tedious from "tedious";
import * as I from "./interfaces";

export interface ISqlServerStatement {
    selectColumns?: string,
    fromTables?: string,
}

export interface ISqlGenerator {
    Execute<T>(dbSet: DbSet<T>): Promise<Array<T>>;
}

export type StatementGenerator<T> = (dbSet: DbSet<T>, dbSetStatement: I.IDbSetStatement) => ISqlServerStatement;

export class SqlServerGenerator implements ISqlGenerator {
    SelectGenerator<T>(dbSet: DbSet<T>, dbSetStatement: I.IDbSetStatement): ISqlServerStatement {
        const selectColumns = dbSet.dbSetConfiguration.ColumnConfigurations
            .map(c => `[${c.Name}]`)
            .join(",");

        return { selectColumns };
    }

    WhereGenerator<T>(dbSet: DbSet<T>, dbSetStatement: I.IDbSetStatement): ISqlServerStatement {
        const fromTables = `[${dbSet.dbSetConfiguration.Database}].[${dbSet.dbSetConfiguration.Schema}].[${dbSet.dbSetConfiguration.Name}]`;

        return { fromTables };
    }

    GetGenerators<T>(): Map<I.StatementType, StatementGenerator<T>> {
        let generators = {} as Map<I.StatementType, StatementGenerator<T>>;
        generators[I.StatementType.Where] = this.WhereGenerator;
        generators[I.StatementType.From] = this.SelectGenerator;
        return generators;
    }

    async Execute<T>(dbSet: DbSet<T>): Promise<Array<T>> {
        const generators = this.GetGenerators<T>();
        const statement = dbSet.statements.map(s => generators[s.statementType](dbSet, s)) as ISqlServerStatement[];

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

export class DbSet<T> implements I.IQueryable<T> {
    public statements: I.IDbSetStatement[] = [{
        statementType: I.StatementType.From,
    }];

    constructor(public dbSetConfiguration: I.IDbSetConfiguration, public sqlGenerator: ISqlGenerator) {
    }

    Select(f: I.Func<T, T>): I.IQueryable<T> {
        this.statements = this.statements.concat([{
            statementType: I.StatementType.Where,
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