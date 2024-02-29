import 'path';
// Update with your config settings.

module.exports = {

  development: {
    client: 'mysql',
    connection: {
      host : '127.0.0.1',
      port : 3306,
      user : 'user',
      password : 'password',
      database : 'mydb'
    },
    migrations: {
      tableName: 'knex_migrations'
    },
  },

};