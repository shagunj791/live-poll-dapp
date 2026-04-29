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
  const CONTRACT_ID = 'CAQOXMWXRVFEOCJNVBCEZQTS446DXAEIRS6QVH3RKCR5SA5PSX2C5IKI'
  
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

  let pollCache = {
    results: null,
    voted: {},
    votedTimestamp: {},
    lastFetch: 0,
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
    throw createContractError('Transaction failed')
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
  
  if (send.status === SorobanRpc.Api.SendTransactionStatus.ERROR) {
    throw createContractError('Transaction failed')
  }
  
  // wait for confirmation
  for (let i = 0; i < 20; i++) {
    const result = await server.getTransaction(send.hash)
  
    if (result.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      return send.hash
  }
  
  if (result.status === SorobanRpc.Api.GetTransactionStatus.FAILED) {
    throw createContractError('Transaction failed')
  }
  
  await new Promise((r) => setTimeout(r, 1000))
  
  }
  
  throw new Error('Transaction timeout')
  }
  
  // ---------------- READ ----------------
  
  async function read(functionName, args = []) {
  try {

    console.log("BLOCKCHAIN CALL:", functionName)

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
    throw createContractError('Transaction failed')
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

  pollCache.results = null
  pollCache.voted = {}

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

  pollCache.results = null
  pollCache.voted = {}

  return hash
  } catch (e) {
  throw createContractError(e)
  }
  }
  
  export async function getResults() {
    const now = Date.now()
  
    // cache valid for 5 sec
    if (pollCache.results && now - pollCache.lastFetch < 5000) {
      return pollCache.results
    }
  
    const res = await read('get_results')
    const formatted = Array.isArray(res) ? res.map(Number) : []
  
    pollCache.results = formatted
    pollCache.lastFetch = now
  
    return formatted
  }

  export async function hasVoted(address) {
    const now = Date.now()
  
    if (
      pollCache.voted[address] !== undefined &&
      now - pollCache.lastFetch < 5000
    ) {
      return pollCache.voted[address]
    }
  
    const res = await read('has_voted', [
      Address.fromString(address).toScVal(),
    ])
  
    const voted = Boolean(res)
  
    pollCache.voted[address] = voted
    pollCache.lastFetch = now   // ✅ SAME timestamp
  
    return voted
  }