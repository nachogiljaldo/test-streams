import knex, { Knex } from 'knex';

  
export const knexMaster : Knex<any, unknown> = knex({
  client: 'mysql',
  connection: {
    host : '127.0.0.1',
    port : 3306,
    user : 'root',
    password : 'rootpass',
    database : 'mydb'
  }
});

export async function withTransaction<Type>(callback : Function) : Promise<Type> {
  const trx = await knexMaster.transaction();
  try {
    const result : Type = await callback(trx);
    await trx.commit();
    return result;
  } catch (e) {
    await trx.rollback();
    throw e;
  }
};