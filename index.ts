import {knexMaster} from './database';
import express from 'express';
import {default as bodyParser} from 'body-parser';
import { Transform } from 'stream';
import { JsonStreamStringify } from 'json-stream-stringify';
import { collectDefaultMetrics, register } from 'prom-client';

const app = express();
const port = 3000;
app.use(bodyParser.json());

collectDefaultMetrics({
  prefix: 'node_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  register
});

app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/users', async (req, res) => {
  const result = await knexMaster('users')
    .select()
    .limit(2_000_000);
  const mappedToModel = result.map((r) => {
    return createModel(r);
  })
  res.json(formatUsers(mappedToModel));
});

app.get('/users-stream', (req, res) => {
  res.type('json');
  const stream = knexMaster('users')
  .select()
  .limit(2_000_000)
  .stream({
    highWaterMark: 10
  });
  let count = 0;
  const toModelsStream = stream.pipe(new Transform({
    objectMode: true,
    transform: (user, encoding, callback) => {
      count++;
      if (count % 100 === 0) {
        setTimeout(() => {
          callback(null, createModel(user));
        }, 1);
      } else {
        callback(null, createModel(user));
      }
    }
  }));
  const formattedUsers = toModelsStream.pipe(
    new Transform({
      objectMode: true,
      transform: (user, encoding, callback) => {
        callback(null, formatUser(user));
      }
    })
  );
  new JsonStreamStringify({
    items: formattedUsers
    }, undefined, undefined, false, 4_096).pipe(res);
});

function formatUsers(users: any[]) {
  return users.map((user) => {return {
    ...user,
    transformed: true,
  }});
}

function createModel(model: any) {
  return {
    ...model,
    modeled: true,
  };
}

function formatUser(user: any) {
  return {
    ...user,
    transformed: true,
  };
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
