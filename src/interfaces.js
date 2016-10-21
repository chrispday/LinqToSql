"use strict";
(function (SqlType) {
    SqlType[SqlType["Boolean"] = 0] = "Boolean";
    SqlType[SqlType["String"] = 1] = "String";
    SqlType[SqlType["Number"] = 2] = "Number";
})(exports.SqlType || (exports.SqlType = {}));
var SqlType = exports.SqlType;
(function (StatementType) {
    StatementType[StatementType["From"] = 0] = "From";
    StatementType[StatementType["Where"] = 1] = "Where";
})(exports.StatementType || (exports.StatementType = {}));
var StatementType = exports.StatementType;
//# sourceMappingURL=interfaces.js.map