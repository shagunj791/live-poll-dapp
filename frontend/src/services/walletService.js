import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit'
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils'
import { FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit/modules/freighter'
import {
  getAddress,
  isConnected,
  requestAccess,
} from '@stellar/freighter-api'

const STORAGE_KEY = 'walletSession'

export const WALLET_TYPES = {
  FREIGHTER: 'freighter',
  KIT: 'kit',
}

export const WALLET_ERRORS = {
  NOT_INSTALLED: 'NOT_INSTALLED',
  USER_REJECTED: 'USER_REJECTED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
}

let kitInitialized = false

function initWalletKit() {
  if (kitInitialized) {
    return
  }

  StellarWalletsKit.init({
    network: Networks.TESTNET,
    authModal: {
      showInstallLabel: true,
    },
    modules: defaultModules({
      filterBy: (module) => module.productId !== FREIGHTER_ID,
    }),
  })

  kitInitialized = true
}

function createWalletError(type, message, originalError) {
  const error = new Error(message)
  error.type = type
  error.originalError = originalError
  return error
}

function isUserRejectedError(rawError) {
  const message = String(rawError?.message || rawError || '').toLowerCase()

  return (
    rawError?.code === 4001 ||
    message.includes('reject') ||
    message.includes('denied') ||
    message.includes('declin') ||
    message.includes('cancel')
  )
}

function isWalletNotInstalledError(rawError) {
  const message = String(rawError?.message || rawError || '').toLowerCase()

  return (
    message.includes('not installed') ||
    message.includes('not found') ||
    message.includes('no wallet') ||
    message.includes('unsupported')
  )
}

function normalizeWalletError(rawError, fallbackMessage) {
  if (isUserRejectedError(rawError)) {
    return createWalletError(
      WALLET_ERRORS.USER_REJECTED,
      'Wallet connection was rejected by the user.',
      rawError,
    )
  }

  if (isWalletNotInstalledError(rawError)) {
    return createWalletError(
      WALLET_ERRORS.NOT_INSTALLED,
      'Selected wallet is not installed or unavailable.',
      rawError,
    )
  }

  return createWalletError(
    WALLET_ERRORS.UNKNOWN_ERROR,
    rawError?.message || fallbackMessage || 'Unknown wallet error.',
    rawError,
  )
}

function persistWalletSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function getStoredWalletSession() {
  const rawSession = localStorage.getItem(STORAGE_KEY)

  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession)
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearStoredWalletSession() {
  localStorage.removeItem(STORAGE_KEY)
}

export async function connectFreighterWallet() {
  const { isConnected: connected, error: connectionError } = await isConnected()

  if (!connected || connectionError) {
    throw createWalletError(
      WALLET_ERRORS.NOT_INSTALLED,
      'Freighter is not installed. Please install the Freighter extension.',
      connectionError,
    )
  }

  const accessResult = await requestAccess()

  if (accessResult?.error) {
    throw normalizeWalletError(
      accessResult.error,
      'Failed to connect to Freighter wallet.',
    )
  }

  const addressResult = await getAddress()

  if (addressResult?.error || !addressResult?.address) {
    throw normalizeWalletError(
      addressResult?.error,
      'Failed to read Freighter wallet address.',
    )
  }

  const session = {
    address: addressResult.address,
    walletType: WALLET_TYPES.FREIGHTER,
  }

  persistWalletSession(session)

  return session
}

export async function connectKitWallet() {
  initWalletKit()

  try {
    const { address } = await StellarWalletsKit.authModal()

    if (!address) {
      throw createWalletError(
        WALLET_ERRORS.UNKNOWN_ERROR,
        'No wallet address was returned.',
      )
    }

    const session = {
      address,
      walletType: WALLET_TYPES.KIT,
    }

    persistWalletSession(session)

    return session
  } catch (error) {
    throw normalizeWalletError(error, 'Failed to connect using wallet kit.')
  }
}