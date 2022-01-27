import { PoolClient, QueryResult } from 'pg';
import {
    commit,
    getTransaction,
    rollback,
    sqlExecMultipleRows,
    // sqlExecSingleRow,
    sqlToDB,
} from '../utils/dbUtil';
import { logger } from '../utils/logger';
const transactionSuccess = 'transaction success';

/**
 * sample query
 * @returns { Promise<QueryResult> }
 */
export const getUserModel = async (): Promise<QueryResult> => {
    const sql = 'SELECT * from users;';
    try {
        return await sqlToDB(sql);
    } catch (error) {
        throw new Error(error.message);
    }
};

/**
 * sample query using transactions
 * @returns { Promise<string> } transaction success
 */
export const createUser = async (data: any): Promise<string> => {
    // const singleSql = 'DELETE FROM TEST;';
    // const singleData = undefined;
    const multiSql = 'INSERT INTO USERS(user_id, full_name, phone_number) VALUES ($1, $2, $3);';
    const multiData: string[][] = [[data.id, data.name, data.phone]];
    const client: PoolClient = await getTransaction();
    try {
        // await sqlExecSingleRow(client, singleSql, singleData);
        await sqlExecMultipleRows(client, multiSql, multiData);
        await commit(client);
        return transactionSuccess;
    } catch (error) {
        await rollback(client);
        logger.error(`sampleTransactionModel error: ${error.message}`);
        throw new Error(error.message);
    }
};
