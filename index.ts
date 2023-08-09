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

const selectString = `
fn get_salary_and_hire_date() {
    select first_name, salary, hire_date from employees;
}
`;

const nameToColumn = new Map<string, { type: string, notNull: boolean }>();

try {
    const parsedSqls = parser.parseAll(sqlString);

    for (let parsedSql of parsedSqls) {
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

                    nameToColumn.set(column.name, { type: column.data_type?.name ?? "", notNull })
                }
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

const getType = (type: string) => {
    const stringRegex = /^(varchar|text)/i;
    const numberRegex = /^(integer|number|decimal)/i;
    const dateRegex = /^(date)/i;
    if (stringRegex.test(type)) {
        return "string"
    } else if (numberRegex.test(type)) {
        return "number"
    } else if (dateRegex.test(type)) {
        return "Date | number"
    }
    return "unknown"
}

try {
    const selectParsed = parser.parse(selectString);
    if ("columns" in selectParsed) {
        let type = "export type Select = {"
        if (Array.isArray(selectParsed.columns)) {
            for (let column of selectParsed.columns) {
                if (typeof column === "string") {
                    type += `\n${column}: ${getType(nameToColumn.get(column)?.type ?? "")};`
                } else if (column.expr.type === "column_ref") {
                    type += `\n\t${column.expr.column}: ${getType(nameToColumn.get(column.expr.column)?.type ?? "")}`
                }
            }

            type += "\n}"

            console.log(type)
        }

    }
} catch (e) {
    const error = e as ParseError;
    console.log(
        error.message,
        addUnderline(selectString, error.location.start, error.location.end)
    );
}

