import type { AGENT, TABLE_TYPE } from "shared";
import { getTableFlashCardPrompt } from "../service/Prompt.service";

export class AgentPromptService {
    public static getIntentPrompt(prompt: string, schema: TABLE_TYPE.DbSchemaSummary, queries: string[], query_result: TABLE_TYPE.TableRow[][]) {

        const tableFlashCardPrompts = schema.tables.map((table: TABLE_TYPE.TableInfo) => {
            const tableInfo = table;
            const foreignKeys = schema.foreignKeys.filter((foreignKey) => foreignKey.fromTable === tableInfo.name);
            return getTableFlashCardPrompt(tableInfo, foreignKeys);
        });

        return `
        You are a focused SQL planning assistant for SQLite.
        Task: Decide the next SMALL helper SQL query (or stop) to progress the user's request.

        Constraints and best practices:
        - Never repeat an identical query already present in Queries.
        - Prefer lightweight exploration first (DISTINCT values, COUNTs) before heavy joins.
        - Always add LIMIT 50 unless the query is an aggregate with a single row.
        - Avoid SELECT *; project only necessary columns.
        - Avoid ORDER BY unless explicitly requested.
        - Only use tables present in Table Details.

        Stopping rule:
        - If enough information has been gathered to write the final answer query, set is_query_required to false.
        - If the user's prompt is not about the database, set query to "not_relevant", is_query_required to false, and required_tables to [].

        Example flow:
        - Initial: SELECT DISTINCT category FROM flashcards LIMIT 50;
        - Follow-up: SELECT question, answer FROM flashcards WHERE category = 'Data Science' LIMIT 50;

        User Prompt: ${prompt}

        Table Details:
        ${tableFlashCardPrompts.join("\n ------------- \n")}

        Queries:
        ${queries.join("\n ------------- \n")}
        
        Query Results (JSON rows):
        ${query_result.map((result) => result.map((row) => JSON.stringify(row)).join("\n -- \n")).join("\n --------------- \n")}

        Return STRICTLY this JSON (and nothing else):
        {
            "query": "...",               // SQL text or "not_relevant"
            "is_query_required": true|false,
            "required_tables": ["table_a", "table_b"]
        }
        `;
    }

    public static getQueryExecutionPrompt(data: AGENT.AgentCacheStoreData) {

        const tableFlashCardPrompts = data.schema.tables.filter((table: TABLE_TYPE.TableInfo) => data.required_tables?.includes(table.name)).map((table: TABLE_TYPE.TableInfo) => {
            const tableInfo = table;
            const foreignKeys = data.schema.foreignKeys.filter((foreignKey) => foreignKey.fromTable === tableInfo.name);
            return getTableFlashCardPrompt(tableInfo, foreignKeys);
        });

        return `
        You are a SQLite expert.
        Task: Produce ONE final SQL query that directly answers the user's prompt, leveraging insights from helper queries and results.

        Requirements:
        - Only use the tables listed below.
        - Prefer simple, efficient SQL. Avoid unnecessary SELECT * and ORDER BY.
        - Include LIMIT 50 if the query can return many rows.
        - If the problem is not relevant to the database, set query to "not_relevant".

        User Prompt: ${data.prompt}

        Table Details:
        ${tableFlashCardPrompts.join("\n ------------- \n")}

        Helper Queries:
        ${data.query?.join("\n ------------- \n")}
 
        Helper Query Results (JSON rows):
        ${data.query_result?.map((result) => result.map((row) => JSON.stringify(row)).join("\n -- \n")).join("\n --------------- \n")}


        Return STRICTLY this JSON (and nothing else):
        {
            "query": "..."
        }
        `;
    }
}