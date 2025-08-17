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
        You are a helpful assistant that can help with a wide range of tasks.
        Your role is to identify the intent of the user's prompt and generate query to get more information about the table.
        You should get the table schema from the table details and generate the query based on the user's prompt.
        If user is not asking about the table, you should return "not_relevant".

        Query should be small and should have at max 50 rows. (Limit max rows to 50 for each query when generating the query. whenever it is necessary)

        User Prompt: ${prompt}

        Table Details:
        ${tableFlashCardPrompts.join("\n ------------- \n")}

        Queries:
        ${queries.join("\n ------------- \n")}
        
        Query Result:
        ${query_result.map((result) => result.map((row) => JSON.stringify(row)).join("\n ------------- \n")).join("\n ------------- \n")}


        Return the query in the following format:

        {
            "query": "{{query}}",
            "is_query_required": true/false,
            "required_tables": [...table_names]
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
        You are a helpful assistant that can help with a wide range of tasks.
        Your role is to execute the query and return the result.
        Create an SQL query to get the result from the database.

        User Prompt: ${data.prompt}
        
        You have been given a user prompt and a list of helper queries and their results.

        You have to use the helper queries and their results to generate the final query.

        Table Details:
        ${tableFlashCardPrompts.join("\n ------------- \n")}

        Helper Queries:
        ${data.query?.join("\n ------------- \n")}

        Helper Query Results:
        ${data.query_result?.join("\n ------------- \n")}

        Return the query in the following format:

        {
            "query": "{{query}}",
        }

        If the query is not relevant, return "not_relevant".
        `;
    }
}