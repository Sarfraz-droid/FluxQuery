import type { TABLE_TYPE } from "shared";

export const getTableFlashCardPrompt = (table: TABLE_TYPE.TableInfo, foreignKeys: TABLE_TYPE.ForeignKeyEdge[]) => {
    return `
    Table Name: ${table.name}
    Columns:
    ${table.columns.map((column) => `- ${column.name} (${column.dataType}) - ${column.notNull ? "NOT NULL" : "NULL"} - ${column.pk ? "PRIMARY KEY" : "NOT PRIMARY KEY"}`).join("\n")}

    Keys:
    ${table.keys.map((key) => `- ${key.keyType} - ${key.name} - ${key.columns.join(", ")}`).join("\n")}

    Foreign Keys:
    ${foreignKeys.map((foreignKey) => `- ${foreignKey.fromTable} -> ${foreignKey.toTable}`).join("\n")}
    `
}

export const generateFixWithAiQueryPrompt = (query: string, tables: TABLE_TYPE.DbSchemaSummary[], userInstructions: string) => { 
    const tableFlashCardPrompts = tables.map((table) => getTableFlashCardPrompt(table.tables[0], table.foreignKeys));

    const tableFlashCardPrompt = tableFlashCardPrompts.join("\n ------------- \n");

    return `
        You are a helpful assistant that can help with fixing SQL queries.

        You have to fix the query based on the table details.

        User Input Query: ${query}

        Table Details:
        ${tableFlashCardPrompt}

        Here are user instructions: ${userInstructions}

        Return the fixed query in the following format:

        {
            "query": "{{fixed_query}}",
        }
    `
}

export const getQueryPrompt = (table: TABLE_TYPE.TableInfo, foreignKeys: TABLE_TYPE.ForeignKeyEdge[]) => {
    const tableFlashCardPrompt = getTableFlashCardPrompt(table, foreignKeys);

    return `
        Your job is to get queries to understand the table and the foreign keys. Make sure the queries are small and consise in order to reduce the cost of the query. Use as minimal number of queries as possible.

        Table Details:
        ${tableFlashCardPrompt}

        Return the query in the following format:

        {
            "query": [
                "{{query1}}",
                "{{query2}}",
                "{{query3}}",
            ],
        }
    `
}