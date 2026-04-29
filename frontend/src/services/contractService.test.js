import { getResults, hasVoted } from './contractService'

import { describe, test, expect } from 'vitest'

test('getResults returns array', async () => {
  const res = await getResults()
  expect(Array.isArray(res)).toBe(true)
})

test('hasVoted returns boolean', async () => {
  const res = await hasVoted('GBAGY4BVPHAYWPY7JUVNVNDYZEAYDSJFRBYGXB2XW5M64WAK7CATXPIO')
  expect(typeof res).toBe('boolean')
})

test('getResults returns numbers', async () => {
  const res = await getResults()
  res.forEach(val => {
    expect(typeof val).toBe('number')
  })
})