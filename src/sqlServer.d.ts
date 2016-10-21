import * as I from "./interfaces";
export interface ISqlServerStatement {
    selectColumns?: string;
    fromTables?: string;
}
export interface ISqlGenerator {
    Execute<T>(dbSet: DbSet<T>): Promise<Array<T>>;
}
export declare type StatementGenerator<T> = (dbSet: DbSet<T>, dbSetStatement: I.IDbSetStatement) => ISqlServerStatement;
export declare class SqlServerGenerator implements ISqlGenerator {
    SelectGenerator<T>(dbSet: DbSet<T>, dbSetStatement: I.IDbSetStatement): ISqlServerStatement;
    WhereGenerator<T>(dbSet: DbSet<T>, dbSetStatement: I.IDbSetStatement): ISqlServerStatement;
    GetGenerators<T>(): Map<I.StatementType, StatementGenerator<T>>;
    Execute<T>(dbSet: DbSet<T>): Promise<Array<T>>;
}
export declare class DbSet<T> implements I.IQueryable<T> {
    dbSetConfiguration: I.IDbSetConfiguration;
    sqlGenerator: ISqlGenerator;
    statements: I.IDbSetStatement[];
    constructor(dbSetConfiguration: I.IDbSetConfiguration, sqlGenerator: ISqlGenerator);
    Select(f: I.Func<T, T>): I.IQueryable<T>;
    ToArray(): Promise<Array<T>>;
    toString(): string;
}
