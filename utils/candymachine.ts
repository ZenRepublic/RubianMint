import {
  generateSigner,
  Umi,
  TransactionBuilder,
  publicKey,
  KeypairSigner,
  sol,
  some,
  assertSolAmount,
} from "@metaplex-foundation/umi"
import {
  fetchCandyGuard,
  fetchCandyMachine,
  mintV2,
} from "@metaplex-foundation/mpl-candy-machine"
import {
  createMintWithAssociatedToken,
  transferSol,
  setComputeUnitLimit,
  setComputeUnitPrice,
} from "@metaplex-foundation/mpl-toolbox"
import { TokenStandard } from "@metaplex-foundation/mpl-token-metadata"
import bs58 from "bs58"

const candyMachine = publicKey(
  "CiAnxgxAtM1pTdNoeZ8nqeTYBM5mPEdQHdwhXfqeS3Th"
  // "EPDMTLPBkidL1fXamZUXG9Yp4ZSVsg4QpWdPsKuVUx32"
)

const tokenMint = publicKey(
  "ESyHCUfKeT1ffLNRfCsjyHzNL4qN22kruVr8vYkPDR5r"
  // "devKak33fTumfvB547eEpGn2HYZstHZ9HjpFoLSELVH"
)

const couponMint = publicKey("2jVEPco6pMAzKG4RijGyarXZcJGuDNZ2ATAjve9dbKc1")

const fundReceiver = publicKey("rbyDXhzsM2xXtV3t9aayYR3md9rY6gyBxbQBeLThtSC")

export const createOpenMintTxs = async (umi: Umi) => {
  const cm = await fetchCandyMachine(umi, candyMachine)
  const guard = await fetchCandyGuard(umi, cm.mintAuthority)
  console.log(cm.mintAuthority)
  const txBuilders: { tx: TransactionBuilder; mint: KeypairSigner }[] = []

  const nftMint = generateSigner(umi)
  const txBuilder = new TransactionBuilder()
    .add(setComputeUnitPrice(umi, { lamports: sol(0.005) }))
    .add(setComputeUnitLimit(umi, { units: 30000000 }))
    // .add(
    //   createMintWithAssociatedToken(umi, {
    //     mint: nftMint,
    //     owner: umi.identity.publicKey,
    //   })
    // )
    .add(
      mintV2(umi, {
        candyMachine: cm.publicKey,
        candyGuard: guard.publicKey,
        collectionMint: cm.collectionMint,
        collectionUpdateAuthority: fundReceiver,
        nftMint: nftMint,
        tokenStandard: TokenStandard.ProgrammableNonFungible,
        group: some("open"),
        mintArgs: {
          solPayment: {
            destination: fundReceiver,
          },
        },
      })
    )

  txBuilders.push({
    tx: txBuilder,
    mint: nftMint,
  })

  return txBuilders
}

export const createTokenMintTxs = async (umi: Umi) => {
  const cm = await fetchCandyMachine(umi, candyMachine)
  const guard = await fetchCandyGuard(umi, cm.mintAuthority)
  console.log(cm.mintAuthority)

  const txBuilders: { tx: TransactionBuilder; mint: KeypairSigner }[] = []

  const nftMint = generateSigner(umi)

  const txBuilder = new TransactionBuilder()
    .add(setComputeUnitPrice(umi, { lamports: sol(0.005) }))
    .add(setComputeUnitLimit(umi, { units: 30000000 }))
    // .add(
    //   createMintWithAssociatedToken(umi, {
    //     mint: nftMint,
    //     owner: umi.identity.publicKey,
    //   })
    // )
    .add(
      mintV2(umi, {
        candyMachine: cm.publicKey,
        candyGuard: guard.publicKey,
        collectionMint: cm.collectionMint,
        collectionUpdateAuthority: fundReceiver,
        nftMint: nftMint,
        tokenStandard: TokenStandard.ProgrammableNonFungible,
        group: some("token"),
        mintArgs: {
          tokenBurn: some({ mint: tokenMint }),
        },
      })
    )

  txBuilders.push({
    tx: txBuilder,
    mint: nftMint,
  })

  return txBuilders
}

export const createCouponMintTxs = async (umi: Umi) => {
  const cm = await fetchCandyMachine(umi, candyMachine)
  const guard = await fetchCandyGuard(umi, cm.mintAuthority)
  console.log(cm.mintAuthority)

  const txBuilders: { tx: TransactionBuilder; mint: KeypairSigner }[] = []

  const nftMint = generateSigner(umi)

  const txBuilder = new TransactionBuilder()
    .add(setComputeUnitPrice(umi, { lamports: sol(0.005) }))
    .add(setComputeUnitLimit(umi, { units: 30000000 }))
    // .add(
    //   createMintWithAssociatedToken(umi, {
    //     mint: nftMint,
    //     owner: umi.identity.publicKey,
    //   })
    // )
    .add(
      mintV2(umi, {
        candyMachine: cm.publicKey,
        candyGuard: guard.publicKey,
        collectionMint: cm.collectionMint,
        collectionUpdateAuthority: fundReceiver,
        nftMint: nftMint,
        tokenStandard: TokenStandard.ProgrammableNonFungible,
        group: some("coupon"),
        mintArgs: {
          solPayment: {
            destination: fundReceiver,
          },
          tokenBurn: some({ mint: couponMint }),
        },
      })
    )

  txBuilders.push({
    tx: txBuilder,
    mint: nftMint,
  })

  return txBuilders
}
