import Head from "next/head"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import {
  CandyMachine,
  Metaplex,
  Nft,
  NftWithToken,
  PublicKey,
  Sft,
  SftWithToken,
  walletAdapterIdentity,
} from "@metaplex-foundation/js"
import { Keypair, Transaction } from "@solana/web3.js"

import {
  getRemainingAccountsForCandyGuard,
  mintV2Instruction,
} from "@/utils/mintV2"
import { fromTxError } from "@/utils/errors"
import {
  KeypairSigner,
  TransactionBuilder,
  publicKey,
  Umi,
  signAllTransactions,
} from "@metaplex-foundation/umi"
import base58 from "bs58"
import {
  createTokenMintTxs,
  createOpenMintTxs,
  createCouponMintTxs,
} from "@/utils/candymachine"
import {
  createSplAssociatedTokenProgram,
  createSplTokenProgram,
} from "@metaplex-foundation/mpl-toolbox"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import {
  fetchCandyMachine,
  getMplCandyMachineCoreProgram,
  mplCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine"
import { walletAdapterIdentity as Umidapter } from "@metaplex-foundation/umi-signer-wallet-adapters"
import ProgressBar from "@ramonak/react-progress-bar"

export default function Home() {
  const wallet = useWallet()
  const { publicKey } = wallet
  const { connection } = useConnection()
  const [metaplex, setMetaplex] = useState<Metaplex | null>(null)
  const [candyMachine, setCandyMachine] = useState<CandyMachine | null>(null)
  const [collection, setCollection] = useState<
    Sft | SftWithToken | Nft | NftWithToken | null
  >(null)
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    ;(async () => {
      if (wallet && connection && !collection && !candyMachine) {
        if (!process.env.NEXT_PUBLIC_CANDY_MACHINE_ID) {
          throw new Error("Please provide a candy machine id")
        }

        const umi = createUmi(connection.rpcEndpoint)
        umi.use(Umidapter(wallet))
        umi.use(mplCandyMachine())
        umi.programs.add(getMplCandyMachineCoreProgram(umi))
        umi.programs.add(createSplAssociatedTokenProgram())
        umi.programs.add(createSplTokenProgram())

        const metaplex = new Metaplex(connection).use(
          walletAdapterIdentity(wallet)
        )
        setMetaplex(metaplex)

        const candyMachine = await metaplex.candyMachines().findByAddress({
          address: new PublicKey(process.env.NEXT_PUBLIC_CANDY_MACHINE_ID),
        })

        setCandyMachine(candyMachine)

        const collection = await metaplex
          .nfts()
          .findByMint({ mintAddress: candyMachine.collectionMintAddress })

        setCollection(collection)

        console.log(collection)
      }
    })()
  }, [wallet, connection])

  /** Mints NFTs through a Candy Machine using Candy Guards */
  // const handleMintV2 = async () => {
  //   if (!metaplex || !candyMachine || !publicKey || !candyMachine.candyGuard) {
  //     if (!candyMachine?.candyGuard)
  //       throw new Error(
  //         "This app only works with Candy Guards. Please setup your Guards through Sugar."
  //       )

  //     throw new Error(
  //       "Couldn't find the Candy Machine or the connection is not defined."
  //     )
  //   }

  //   try {
  //     setIsLoading(true)

  //     const { remainingAccounts, additionalIxs } =
  //       getRemainingAccountsForCandyGuard(candyMachine, publicKey)

  //     const mint = Keypair.generate()
  //     const { instructions } = await mintV2Instruction(
  //       candyMachine.candyGuard?.address,
  //       candyMachine.address,
  //       publicKey,
  //       publicKey,
  //       mint,
  //       connection,
  //       metaplex,
  //       remainingAccounts
  //     )

  //     const tx = new Transaction()

  //     if (additionalIxs?.length) {
  //       tx.add(...additionalIxs)
  //     }

  //     tx.add(...instructions)

  //     tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

  //     const txid = await wallet.sendTransaction(tx, connection, {
  //       signers: [mint],
  //     })

  //     const latest = await connection.getLatestBlockhash()
  //     await connection.confirmTransaction({
  //       blockhash: latest.blockhash,
  //       lastValidBlockHeight: latest.lastValidBlockHeight,
  //       signature: txid,
  //     })

  //     setFormMessage("Minted successfully!  ")
  //   } catch (e: any) {
  //     const msg = fromTxError(e)

  //     if (msg) {
  //       setFormMessage(msg.message)
  //     } else {
  //       const msg = e.message || e.toString()
  //       setFormMessage(msg)
  //     }
  //   } finally {
  //     setIsLoading(false)

  //     setTimeout(() => {
  //       setFormMessage(null)
  //     }, 5000)
  //   }
  // }

  /** Mints NFTs through a Candy Machine using Candy Guards */
  const handleOpenMintV2 = async () => {
    // if (!metaplex || !candyMachine || !publicKey || !candyMachine.candyGuard) {
    //   if (!candyMachine?.candyGuard)
    //     throw new Error(
    //       "This app only works with Candy Guards. Please setup your Guards through Sugar."
    //     )

    //   throw new Error(
    //     "Couldn't find the Candy Machine or the connection is not defined."
    //   )
    // }

    try {
      setIsLoading(true)

      const umi = createUmi(connection.rpcEndpoint)
      umi.use(Umidapter(wallet))
      umi.use(mplCandyMachine())
      umi.programs.add(getMplCandyMachineCoreProgram(umi))
      umi.programs.add(createSplAssociatedTokenProgram())
      umi.programs.add(createSplTokenProgram())

      const transactions = await createOpenMintTxs(umi)

      const sigs = await sendTransactions(umi, transactions)

      await confirmTransactions(umi, sigs)

      console.log(base58Signature(sigs[0]))

      setFormMessage("Minted successfully!  ")
    } catch (e: any) {
      const msg = fromTxError(e)

      if (msg) {
        setFormMessage(msg.message)
      } else {
        const msg = e.message || e.toString()
        setFormMessage(msg)
      }
    } finally {
      setIsLoading(false)

      setTimeout(() => {
        setFormMessage(null)
      }, 5000)
    }
  }

  /** Mints NFTs through a Candy Machine using Candy Guards */
  const handleCouponMintV2 = async () => {
    // if (!metaplex || !candyMachine || !publicKey || !candyMachine.candyGuard) {
    //   if (!candyMachine?.candyGuard)
    //     throw new Error(
    //       "This app only works with Candy Guards. Please setup your Guards through Sugar."
    //     )

    //   throw new Error(
    //     "Couldn't find the Candy Machine or the connection is not defined."
    //   )
    // }

    try {
      setIsLoading(true)

      const umi = createUmi(connection.rpcEndpoint)
      umi.use(Umidapter(wallet))
      umi.use(mplCandyMachine())
      umi.programs.add(getMplCandyMachineCoreProgram(umi))
      umi.programs.add(createSplAssociatedTokenProgram())
      umi.programs.add(createSplTokenProgram())
      const transactions = await createCouponMintTxs(umi)
      const sigs = await sendTransactions(umi, transactions)

      await confirmTransactions(umi, sigs)

      console.log(base58Signature(sigs[0]))

      setFormMessage("Minted successfully!  ")
    } catch (e: any) {
      const msg = fromTxError(e)

      if (msg) {
        setFormMessage(msg.message)
      } else {
        const msg = e.message || e.toString()
        setFormMessage(msg)
      }
    } finally {
      setIsLoading(false)

      setTimeout(() => {
        setFormMessage(null)
      }, 5000)
    }
  }

  /** Mints NFTs through a Candy Machine using Candy Guards */
  const handleTokenMintV2 = async () => {
    // if (!metaplex || !candyMachine || !publicKey || !candyMachine.candyGuard) {
    //   if (!candyMachine?.candyGuard)
    //     throw new Error(
    //       "This app only works with Candy Guards. Please setup your Guards through Sugar."
    //     )

    //   throw new Error(
    //     "Couldn't find the Candy Machine or the connection is not defined."
    //   )
    // }

    try {
      setIsLoading(true)

      const umi = createUmi(connection.rpcEndpoint)
      umi.use(Umidapter(wallet))
      umi.use(mplCandyMachine())
      umi.programs.add(getMplCandyMachineCoreProgram(umi))
      umi.programs.add(createSplAssociatedTokenProgram())
      umi.programs.add(createSplTokenProgram())

      const transactions = await createTokenMintTxs(umi)
      await umi.rpc.getLatestBlockhash()
      console.log("TEST1")
      console.log(transactions[0])
      const sigs = await sendTransactions(umi, transactions)
      console.log(sigs[0])
      await confirmTransactions(umi, sigs)

      console.log(base58Signature(sigs[0]))

      setFormMessage("Minted successfully!  ")
    } catch (e: any) {
      const msg = fromTxError(e)

      if (msg) {
        setFormMessage(msg.message)
      } else {
        const msg = e.message || e.toString()
        setFormMessage(msg)
      }
    } finally {
      setIsLoading(false)

      setTimeout(() => {
        setFormMessage(null)
      }, 5000)
    }
  }

  const cost = candyMachine
    ? candyMachine.candyGuard?.guards.solPayment
      ? Number(candyMachine.candyGuard?.guards.solPayment?.amount.basisPoints) /
          1e9 +
        " SOL"
      : "Price: 2 SOL"
    : "..."

  // const { data } = candyMachine ? candyMachine : ;

  const itemsMinted = (candyMachine: any) => {
    if (!candyMachine) {
      return 0
    }

    const { itemsMinted } = candyMachine
    const { words } = itemsMinted
    const [total] = words

    return parseInt(total)
  }

  const totalItems = (candyMachine: any) => {
    if (!candyMachine) {
      return 0
    }

    const { itemsAvailable } = candyMachine
    const { words } = itemsAvailable
    const [total] = words

    return parseInt(total)
  }

  const minted = itemsMinted(candyMachine)
  const total = totalItems(candyMachine)

  const completed = (minted / total) * 100

  const label = `${minted} / ${total} Minted`
  return (
    <>
      <Head>
        <title>Rubians by Zen Republic</title>
        <meta
          name="description"
          content="Rubians are 720 fun and creative citizens of Ruby Planet, shaping the culture of web3"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "96px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column", // Updated to column for mobile
            gap: "32px",
            alignItems: "center", // Updated to center for mobile
          }}
        >
          <img
            style={{ maxWidth: "396px", borderRadius: "8px" }}
            // src={collection?.json?.image}
            src="/concept.png"
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              background: "#111",
              padding: "32px 24px",
              borderRadius: "16px",
              border: "1px solid #222",
              width: "320px",
            }}
          >
            <h1>{collection?.name}</h1>
            <p style={{ color: "#807a82", marginBottom: "32px" }}>
              {collection?.json?.description}
            </p>
            <p style={{ color: "#807a82", marginBottom: "32px" }}>
              More about Rubians{" "}
              <a
                href="https://www.bento.me/rubians"
                style={{ color: "#007bff", textDecoration: "underline" }}
              >
                here
              </a>
            </p>

            {/* <p style={{textAlign: "center"}}>
              {label}
            </p>
            <ProgressBar labelAlignment="center" customLabelStyles={{display: "none"}} completed={completed} /> */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#261727",
                padding: "16px 12px",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>{label}</span>
                <b>{cost}</b>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "11px" }}>
                  100% royalties, reduced to 4.2% after mint close
                </span>
                {/* <span style={{ fontSize: "11px" }}>512/1024</span> */}
              </div>
              <button
                disabled={!publicKey || isLoading}
                onClick={handleOpenMintV2}
              >
                {isLoading ? "Minting Rubian..." : "Mint"}
              </button>
              <br></br>
              <button
                disabled={!publicKey || isLoading}
                onClick={handleTokenMintV2}
              >
                {isLoading ? "Minting Rubian..." : "Use Voucher (Free)"}
              </button>
              <br></br>
              <button
                disabled={!publicKey || isLoading}
                onClick={handleCouponMintV2}
              >
                {isLoading ? "Minting Rubian..." : "Use 25% Off Coupon"}
              </button>

              <WalletMultiButton
                style={{
                  width: "100%",
                  height: "auto",
                  marginTop: "8px",
                  padding: "8px 0",
                  justifyContent: "center",
                  fontSize: "13px",
                  backgroundColor: "#111",
                  lineHeight: "1.45",
                }}
              />
              <p
                style={{
                  textAlign: "center",
                  marginTop: "4px",
                }}
              >
                {formMessage}
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export const sendTransactions = async (
  umi: Umi,
  transactions: { tx: TransactionBuilder; mint: KeypairSigner }[]
) => {
  const builtTxs = await Promise.all(
    transactions.map(async (tx) => {
      return {
        tx: await tx.tx.buildWithLatestBlockhash(umi),
        mint: tx.mint,
      }
    })
  )

  const signedTransactions = await signAllTransactions(
    builtTxs.map((tx) => ({
      transaction: tx.tx,
      signers: [umi.identity, tx.mint],
    }))
  )

  const sigs = await Promise.all(
    signedTransactions.map((tx) =>
      umi.rpc.sendTransaction(tx, { skipPreflight: true })
    )
  )

  return sigs
}

export const confirmTransactions = async (
  umi: Umi,
  signatures: Uint8Array[]
) => {
  const confirmations = await Promise.all(
    signatures.map(async (sig) =>
      umi.rpc.confirmTransaction(sig, {
        strategy: {
          type: "blockhash",
          ...(await umi.rpc.getLatestBlockhash()),
        },
        commitment: "finalized",
      })
    )
  )
  return confirmations
}

export const base58Signature = (sig: Uint8Array) => {
  return base58.encode(sig)
}

// export const confirmTransactions = async (
//   umi: Umi,
//   signatures: Uint8Array[]
// ) => {
//   console.log("Starting confirmTransactions function...");
//   try {
//     const confirmations = await Promise.all(
//       signatures.map(async (sig) => {
//         console.log("Processing signature:", sig);
//         const latestBlockhash = await umi.rpc.getLatestBlockhash();
//         console.log("Latest blockhash:", latestBlockhash);
//         const confirmation = await umi.rpc.confirmTransaction(sig, {
//           strategy: {
//             type: "blockhash",
//             ...latestBlockhash,
//           },
//           commitment: "finalized",
//         });
//         console.log("Confirmation:", confirmation);
//         return confirmation;
//       })
//     );
//     console.log("All transactions confirmed.");
//     return confirmations;
//   } catch (error) {
//     console.error("Error in confirmTransactions:", error);
//     throw error;
//   }
// };
