import { useState } from 'react'
import {
  clearStoredWalletSession,
  connectFreighterWallet,
  connectKitWallet,
  getStoredWalletSession,
  WALLET_ERRORS,
  WALLET_TYPES,
} from '../services/walletService'
import PollPanel from './PollPanel'

function WalletConnector() {
  const storedSession = getStoredWalletSession()

  const [address, setAddress] = useState(storedSession?.address || '')
  const [walletType, setWalletType] = useState(storedSession?.walletType || '')
  const [errorMessage, setErrorMessage] = useState('')
  const [connectingWallet, setConnectingWallet] = useState('')

  // ---------------- WALLET CONNECT ----------------
  const handleConnect = async (wallet) => {
    setErrorMessage('')
    setConnectingWallet(wallet)

    try {
      const session =
        wallet === WALLET_TYPES.FREIGHTER
          ? await connectFreighterWallet()
          : await connectKitWallet()

      setAddress(session.address)
      setWalletType(session.walletType)
    } catch (error) {
      switch (error.type) {
        case WALLET_ERRORS.NOT_INSTALLED:
          setErrorMessage('Wallet not installed.')
          break
        case WALLET_ERRORS.USER_REJECTED:
          setErrorMessage('Connection rejected.')
          break
        default:
          setErrorMessage(error.message)
      }
    } finally {
      setConnectingWallet('')
    }
  }

  const handleDisconnect = () => {
    setAddress('')
    setWalletType('')
    setErrorMessage('')
    clearStoredWalletSession()
  }

  const canSignTransactions = walletType === WALLET_TYPES.FREIGHTER

  // ---------------- UI ----------------
  return (
    <section>
      <h1>Live Poll DApp</h1>

      {!address ? (
        <>
          <p>Connect your wallet</p>

          <button
            onClick={() => handleConnect(WALLET_TYPES.FREIGHTER)}
            disabled={Boolean(connectingWallet)}
          >
            Connect Freighter
          </button>

          <button
            onClick={() => handleConnect(WALLET_TYPES.KIT)}
            disabled={Boolean(connectingWallet)}
          >
            Connect Other Wallet
          </button>
        </>
      ) : (
        <>
          <p>Connected: {address.slice(0, 6)}...{address.slice(-4)}</p>
          <p>Wallet: {walletType}</p>
          <button onClick={handleDisconnect}>Disconnect</button>

          <PollPanel
            address={address}
            canSignTransactions={canSignTransactions}
          />
        </>
      )}

      {errorMessage && <p>{errorMessage}</p>}
    </section>
  )
}

export default WalletConnector