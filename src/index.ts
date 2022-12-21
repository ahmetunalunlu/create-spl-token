/*
import { initializeKeypair } from "./initializeKeypair"
import * as web3 from "@solana/web3.js"
import * as token from "@solana/spl-token"
import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  findMetadataPda,
} from "@metaplex-foundation/js"
import {
  DataV2,
  createCreateMetadataAccountV2Instruction,
  createUpdateMetadataAccountV2Instruction,
} from "@metaplex-foundation/mpl-token-metadata"
import * as fs from "fs"

async function createNewMint(
    connection: web3.Connection,
    payer: web3.Keypair,
    mintAuthority: web3.PublicKey,
    freezeAuthority: web3.PublicKey,
    decimals: number
): Promise<web3.PublicKey> {

    const tokenMint = await token.createMint(
        connection,
        payer,
        mintAuthority,
        freezeAuthority,
        decimals
    );

    console.log(`The token mint account address is ${tokenMint}`)
    console.log(
        `Token Mint: https://explorer.solana.com/address/${tokenMint}?cluster=devnet`
    );

    return tokenMint;
}

async function createTokenAccount(
  connection: web3.Connection,
  payer: web3.Keypair,
  mint: web3.PublicKey,
  owner: web3.PublicKey
) {
  const tokenAccount = await token.getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      owner
  )
  
  console.log(
      `Token Account: https://explorer.solana.com/address/${tokenAccount.address}?cluster=devnet`
  )

  return tokenAccount
}

async function mintTokens(
  connection: web3.Connection,
  payer: web3.Keypair,
  mint: web3.PublicKey,
  destination: web3.PublicKey,
  authority: web3.Keypair,
  amount: number
) {
  const mintInfo = await token.getMint(connection, mint)

  const transactionSignature = await token.mintTo(
    connection,
    payer,
    mint,
    destination,
    authority,
    amount * 10 ** mintInfo.decimals
  )

  console.log(
    `Mint Token Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

async function createTokenMetadata(
  connection: web3.Connection,
  metaplex: Metaplex,
  mint: web3.PublicKey,
  user: web3.Keypair,
  name: string,
  symbol: string,
  description: string
) {
  // file to buffer
  const buffer = fs.readFileSync("assets/morty.png")

  // buffer to metaplex file
  const file = toMetaplexFile(buffer, "morty.png")

  // upload image and get image uri
  const imageUri = await metaplex.storage().upload(file)
  console.log("image uri:", imageUri)

  // upload metadata and get metadata uri (off chain metadata)
  const { uri } = await metaplex
    .nfts()
    .uploadMetadata({
      name: name,
      description: description,
      image: imageUri,
    })
 
  console.log("metadata uri:", uri)

  // get metadata account address
  const metadataPDA = await findMetadataPda(mint)

  // onchain metadata format
  const tokenMetadata = {
    name: name,
    symbol: symbol,
    uri: uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  } as DataV2

  // transaction to create metadata account
  const transaction = new web3.Transaction().add(
    createCreateMetadataAccountV2Instruction(
      {
        metadata: metadataPDA,
        mint: mint,
        mintAuthority: user.publicKey,
        payer: user.publicKey,
        updateAuthority: user.publicKey,
      },
      {
        createMetadataAccountArgsV2: {
          data: tokenMetadata,
          isMutable: true,
        },
      }
    )
  )

  // send transaction
  const transactionSignature = await web3.sendAndConfirmTransaction(
    connection,
    transaction,
    [user]
  )

  console.log(
    `Create Metadata Account: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
  )
}

async function main() {
  const connection = new web3.Connection(web3.clusterApiUrl("devnet"))
  const user = await initializeKeypair(connection)

  console.log("PublicKey:", user.publicKey.toBase58())
  const mint = await createNewMint(
    connection,
    user,           // We'll pay the fees
    user.publicKey, // We're the mint authority
    user.publicKey, // And the freeze authority >:)
    2               // Only two decimals!
  )

  const tokenAccount = await createTokenAccount(
    connection,     
    user,           
    mint,            
    user.publicKey   // Associating our address with the token account
  )
  
  // Mint 100 tokens to our address
  await mintTokens(connection, user, mint, tokenAccount.address, user, 100)

    // MAKE SURE YOU REPLACE THIS ADDRESS WITH YOURS!
    const MINT_ADDRESS = "4aSP7Vz6qRY3EyMPwr3UauzywXyMgSJ2venDpw5QXsFk"

    // metaplex setup
    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(user))
      .use(
        bundlrStorage({
          address: "https://devnet.bundlr.network",
          providerUrl: "https://api.devnet.solana.com",
          timeout: 60000,
        })
      )
    
    // Calling the token 
    await createTokenMetadata(
      connection,
      metaplex,
      new web3.PublicKey(MINT_ADDRESS),
      user,
      "Morty", // Token name - REPLACE THIS WITH YOURS
      "RM",     // Token symbol - REPLACE THIS WITH YOURS
      "Rick and Morty go to the Moon!" // Token description - REPLACE THIS WITH YOURS
    )
}

main()
  .then(() => {
    console.log("Finished successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })

  */
  import { initializeKeypair } from "./initializeKeypair"
  import {
    Connection,
    clusterApiUrl,
    Transaction,
    sendAndConfirmTransaction,
    Keypair,
    SystemProgram,
  } from "@solana/web3.js"
  import {
    createInitializeMintInstruction,
    getMinimumBalanceForRentExemptMint,
    getAssociatedTokenAddress,
    MINT_SIZE,
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    Account,
    TokenAccountNotFoundError,
    TokenInvalidAccountOwnerError,
    getAccount,
    createMintToInstruction,
  } from "@solana/spl-token"
  import {
    Metaplex,
    keypairIdentity,
    bundlrStorage,
    toMetaplexFile,
    findMetadataPda,
  } from "@metaplex-foundation/js"
  import {
    DataV2,
    createCreateMetadataAccountV2Instruction,
  } from "@metaplex-foundation/mpl-token-metadata"
  import * as fs from "fs"
  
  const tokenName = "Morty"
  const description = "Rick and Morty go to the Moon!"
  const symbol = "RM"
  const decimals = 2
  const amount = 1
  
  async function main() {
    const connection = new Connection(clusterApiUrl("devnet"))
    const user = await initializeKeypair(connection)
  
    console.log("PublicKey:", user.publicKey.toBase58())
  
    // rent for token mint
    const lamports = await getMinimumBalanceForRentExemptMint(connection)
  
    // keypair for new token mint
    const mintKeypair = Keypair.generate()
  
    // get metadata PDA for token mint
    const metadataPDA = await findMetadataPda(mintKeypair.publicKey)
  
    // get associated token account address for use
    const tokenATA = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      user.publicKey
    )
  
    // metaplex setup
    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(user))
      .use(
        bundlrStorage({
          address: "https://devnet.bundlr.network",
          providerUrl: "https://api.devnet.solana.com",
          timeout: 60000,
        })
      )
  
    // file to buffer
    const buffer = fs.readFileSync("assets/morty.png")
  
    // buffer to metaplex file
    const file = toMetaplexFile(buffer, "morty.png")
  
    // upload image and get image uri
    const imageUri = await metaplex.storage().upload(file)
    console.log("image uri:", imageUri)
  
    // upload metadata and get metadata uri (off chain metadata)
    const { uri } = await metaplex
      .nfts()
      .uploadMetadata({
        name: tokenName,
        description: description,
        image: imageUri,
      })
      
  
    console.log("metadata uri:", uri)
  
    // onchain metadata format
    const tokenMetadata = {
      name: tokenName,
      symbol: symbol,
      uri: uri,
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    } as DataV2
  
    // transaction to create metadata account
    const transaction = new Transaction().add(
      // create new account
      SystemProgram.createAccount({
        fromPubkey: user.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      // create new token mint
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        decimals,
        user.publicKey,
        user.publicKey,
        TOKEN_PROGRAM_ID
      ),
      // create metadata account
      createCreateMetadataAccountV2Instruction(
        {
          metadata: metadataPDA,
          mint: mintKeypair.publicKey,
          mintAuthority: user.publicKey,
          payer: user.publicKey,
          updateAuthority: user.publicKey,
        },
        {
          createMetadataAccountArgsV2: {
            data: tokenMetadata,
            isMutable: true,
          },
        }
      )
    )
  
    // instruction to create ATA
    const createTokenAccountInstruction = createAssociatedTokenAccountInstruction(
      user.publicKey, // payer
      tokenATA, // token address
      user.publicKey, // token owner
      mintKeypair.publicKey // token mint
    )
  
    let tokenAccount: Account
    try {
      // check if token account already exists
      tokenAccount = await getAccount(
        connection, // connection
        tokenATA // token address
      )
    } catch (error: unknown) {
      if (
        error instanceof TokenAccountNotFoundError ||
        error instanceof TokenInvalidAccountOwnerError
      ) {
        try {
          // add instruction to create token account if one does not exist
          transaction.add(createTokenAccountInstruction)
        } catch (error: unknown) {}
      } else {
        throw error
      }
    }
  
    transaction.add(
      // mint tokens to token account
      createMintToInstruction(
        mintKeypair.publicKey,
        tokenATA,
        user.publicKey,
        amount * Math.pow(10, decimals)
      )
    )
  
    // send transaction
    const transactionSignature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [user, mintKeypair]
    )
  
    console.log(
      `Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )
  }
  
  main()
    .then(() => {
      console.log("Finished successfully")
      process.exit(0)
    })
    .catch((error) => {
      console.log(error)
      process.exit(1)
    })
