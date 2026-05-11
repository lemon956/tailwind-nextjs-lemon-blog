import assert from 'node:assert/strict'
import { test } from 'node:test'

import { formatDatabaseQuery } from './sqlFormatters.ts'

test('formats MySQL queries with uppercase keywords and configured indentation', async () => {
  const result = await formatDatabaseQuery(
    'select id,name from users where active=1 order by created_at desc',
    {
      dialect: 'mysql',
      keywordCase: 'upper',
      tabWidth: 2,
      linesBetweenQueries: 1,
    }
  )

  assert.equal(result.mode, 'sql')
  assert.match(result.output, /SELECT/)
  assert.match(result.output, /FROM/)
  assert.match(result.output, /ORDER BY/)
  assert.ok(result.output.includes('\n'))
})

test('formats Doris queries through the MySQL-compatible SQL formatter path', async () => {
  const result = await formatDatabaseQuery(
    'select user_id,count(*) from orders group by user_id limit 5',
    {
      dialect: 'doris',
      keywordCase: 'upper',
      tabWidth: 4,
      linesBetweenQueries: 1,
    }
  )

  assert.equal(result.mode, 'sql')
  assert.equal(result.dialectLabel, 'Doris (MySQL compatible)')
  assert.match(result.output, /GROUP BY/)
})

test('formats MongoDB shell-chain queries with Prettier', async () => {
  const result = await formatDatabaseQuery(
    'db.users.find({status:"active",age:{$gte:18}}).sort({created_at:-1}).limit(10)',
    {
      dialect: 'mongodb',
      keywordCase: 'preserve',
      tabWidth: 2,
      linesBetweenQueries: 1,
    }
  )

  assert.equal(result.mode, 'mongodb')
  assert.equal(result.dialectLabel, 'MongoDB Query')
  assert.match(result.output, /db\.users/)
  assert.match(result.output, /\.sort/)
  assert.match(result.output, /\.limit/)
  assert.ok(result.output.includes('\n'))
})

test('formats MongoDB object input as Extended JSON when possible', async () => {
  const result = await formatDatabaseQuery(
    '{"_id":{"$oid":"507f1f77bcf86cd799439011"},"active":true}',
    {
      dialect: 'mongodb',
      keywordCase: 'preserve',
      tabWidth: 2,
      linesBetweenQueries: 1,
    }
  )

  assert.equal(result.mode, 'mongodb')
  assert.match(result.output, /"\$oid"/)
  assert.match(result.output, /"active": true/)
  assert.ok(result.output.includes('\n'))
})
