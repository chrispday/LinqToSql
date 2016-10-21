export declare type Func<T, U> = (t: T) => U;
export interface IQueryable<T> {
    Select(f: Func<T, T>): IQueryable<T>;
    ToArray(): Promise<Array<T>>;
    toString(): string;
}
export declare enum SqlType {
    Boolean = 0,
    String = 1,
    Number = 2,
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
export declare enum StatementType {
    From = 0,
    Where = 1,
}
export interface IDbSetStatement {
    statementType: StatementType;
    statement?: string;
    parsed?: any;
}
