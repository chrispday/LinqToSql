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