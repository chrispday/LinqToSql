export declare module LinqToSql {
    type Func<T, U> = (t: T) => U;
    interface IQueryable<T> {
        Select(f: Func<T, T>): IQueryable<T>;
        ToArray(): Promise<Array<T>>;
        toString(): string;
    }
    enum SqlType {
        Boolean = 0,
        String = 1,
        Number = 2,
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
        From = 0,
        Where = 1,
    }
    interface IDbSetStatement {
        statementType: StatementType;
        statement?: string;
        parsed?: any;
    }
    interface ISqlServerStatement {
        selectColumns?: string;
        fromTables?: string;
    }
    interface ISqlGenerator {
        Execute<T>(dbSet: DbSet<T>): Promise<Array<T>>;
    }
    class SqlServerGenerator implements ISqlGenerator {
        SelectGenerator<T>(dbSet: DbSet<T>, dbSetStatement: IDbSetStatement): ISqlServerStatement;
        WhereGenerator<T>(dbSet: DbSet<T>, dbSetStatement: IDbSetStatement): ISqlServerStatement;
        Execute<T>(dbSet: DbSet<T>): Promise<Array<T>>;
    }
    class DbSet<T> implements IQueryable<T> {
        dbSetConfiguration: IDbSetConfiguration;
        sqlGenerator: ISqlGenerator;
        statements: IDbSetStatement[];
        constructor(dbSetConfiguration: IDbSetConfiguration, sqlGenerator: ISqlGenerator);
        Select(f: Func<T, T>): IQueryable<T>;
        ToArray(): Promise<Array<T>>;
        toString(): string;
    }
}
