import chalk from "chalk";
import parser, { type ParseError } from "@joe-re/sql-parser/index";

interface Position {
    offset: number;
    line: number;
    column: number;
}

function addUnderline(
    originalString: string,
    start: Position,
    end: Position
): string {
    return (
        originalString.slice(0, start.offset) +
        chalk.red.underline.bold(
            originalString.slice(start.offset, end.offset)
        ) +
        originalString.slice(end.offset)
    );
}

const sqlString = `
CREATE TABLE employees (
    employee_id INT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    birth_date DATE,
    hire_date DATE,
    department_id INT,
    salary DECIMAL(10, 2),
    email VARCHAR(100),
    phone_number VARCHAR(20)
);
`;
try {
    const parsedSql = parser.parse(sqlString);

    if ("column_definitions" in parsedSql) {
        const columns = parsedSql.column_definitions;
        for (let column of columns) {
            if ("data_type" in column) {
                const notNull = column.constraints.some(
                    (c) =>
                        c.type === "constraint_not_null" ||
                        c.type === "constraint_primary_key" ||
                        c.type === "constraint_default"
                );
                console.log(
                    `${column.name}: ${column.data_type?.name}, not-null: ${
                        notNull ? "true" : "false"
                    }`
                );
            }
        }
    }
} catch (e) {
    const error = e as ParseError;
    console.log(
        error.message,
        addUnderline(sqlString, error.location.start, error.location.end)
    );
}
