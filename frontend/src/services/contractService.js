import {
  Account,
  Address,
  Contract,
  Networks,
  rpc as SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
  } from '@stellar/stellar-sdk'
  import { signTransaction } from '@stellar/freighter-api'
  
  const NETWORK_PASSPHRASE = Networks.TESTNET
  const RPC_URL = 'https://soroban-testnet.stellar.org:443'
  const CONTRACT_ID = 'CBQUA67LVRIKB74W4MIEG7UE2MXSZS6CAV26DSVZQMBKWAP4IQGH2UTU'
  
  const server = new SorobanRpc.Server(RPC_URL)
  const contract = new Contract(CONTRACT_ID)
  
  export const TX_STATUS = {
  IDLE: 'idle',
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
  }
  
  export const CONTRACT_ERRORS = {
  ALREADY_VOTED: 'ALREADY_VOTED',
  NOT_INITIALIZED: 'NOT_INITIALIZED',
  UNKNOWN: 'UNKNOWN',
  }
  
  // ---------------- ERROR HANDLING ----------------
  
  function normalizeContractError(error) {
  const message = String(error?.message || error || '').toLowerCase()
  
  if (message.includes('#4')) {
  return { type: CONTRACT_ERRORS.ALREADY_VOTED, message: 'You have already voted.' }
  }
  
  if (message.includes('#5')) {
  return { type: CONTRACT_ERRORS.NOT_INITIALIZED, message: 'Poll is not initialized.' }
  }
  
  if (message.includes('account') || message.includes('invalid')) {
  return { type: CONTRACT_ERRORS.UNKNOWN, message: 'Wallet address is invalid.' }
  }
  
  return {
  type: CONTRACT_ERRORS.UNKNOWN,
  message: error?.message || 'Unknown error',
  }
  }
  
  function createContractError(error) {
  const normalized = normalizeContractError(error)
  const wrapped = new Error(normalized.message)
  wrapped.type = normalized.type
  return wrapped
  }
  
  // ---------------- CORE TX FLOW ----------------
  
  async function runContractTx(functionName, args, sourceAddress) {
  if (!sourceAddress || sourceAddress.length !== 56) {
  throw new Error('Invalid wallet address')
  }
  
  const account = await server.getAccount(sourceAddress)
  
  const tx = new TransactionBuilder(account, {
  fee: '100',
  networkPassphrase: NETWORK_PASSPHRASE,
  })
  .addOperation(contract.call(functionName, ...args))
  .setTimeout(30)
  .build()
  
  const sim = await server.simulateTransaction(tx)
  
  if (SorobanRpc.Api.isSimulationError(sim)) {
  throw new Error(sim.error)
  }
  
  const assembled = SorobanRpc.assembleTransaction(tx, sim).build()
  
  const signed = await signTransaction(assembled.toXDR(), {
  accountToSign: sourceAddress,
  networkPassphrase: NETWORK_PASSPHRASE,
  })
  
  const txSigned = TransactionBuilder.fromXDR(
  signed.signedTxXdr,
  NETWORK_PASSPHRASE
  )
  
  const send = await server.sendTransaction(txSigned)
  console.log("TX HASH:", send.hash)
  return send.hash
  
  if (send.status === SorobanRpc.Api.SendTransactionStatus.ERROR) {
  throw new Error('Transaction failed')
  }
  
  // wait for confirmation
  for (let i = 0; i < 20; i++) {
  const result = await server.getTransaction(send.hash)
  
  if (result.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    return result
  }
  
  if (result.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
    throw new Error('Transaction failed')
  }
  
  await new Promise((r) => setTimeout(r, 1000))
  
  }
  
  throw new Error('Transaction timeout')
  }
  
  // ---------------- READ ----------------
  
  async function read(functionName, args = []) {
  try {
  const dummy = new Account(
  'GBAGY4BVPHAYWPY7JUVNVNDYZEAYDSJFRBYGXB2XW5M64WAK7CATXPIO',
  '0'
  )
  
  const tx = new TransactionBuilder(dummy, {
    fee: '100',
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(30)
    .build()
  
  const sim = await server.simulateTransaction(tx)
  
  if (SorobanRpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error)
  }
  
  return scValToNative(sim.result.retval)
  
  } catch (e) {
  throw createContractError(e)
  }
  }
  
  // ---------------- CONTRACT METHODS ----------------
  
  export async function initializePoll(question, options, sourceAddress) {
  try {
    const hash = await runContractTx(
  'initialize_poll',
  [
  nativeToScVal(question, { type: 'string' }),
  nativeToScVal(
  options.map((opt) => nativeToScVal(opt, { type: 'string' })),
  { type: 'vec' }
  ),
  ],
  sourceAddress
  )
  return hash
  } catch (e) {
  throw createContractError(e)
  }
  }
  
  export async function vote(index, sourceAddress) {
  try {
  const hash = await runContractTx(
  'vote',
  [
  nativeToScVal(index, { type: 'u32' }),
  Address.fromString(sourceAddress).toScVal(),
  ],
  sourceAddress
  )
  return hash
  } catch (e) {
  throw createContractError(e)
  }
  }
  
  export async function getResults() {
  const res = await read('get_results')
  return Array.isArray(res) ? res.map(Number) : []
  }
  
  export async function hasVoted(address) {
  const res = await read('has_voted', [
  Address.fromString(address).toScVal(),
  ])
  return Boolean(res)
  }