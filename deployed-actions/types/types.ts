declare namespace Lit {
  export namespace Actions {
    /**
     * Check if a given IPFS ID is permitted to sign using a given PKP tokenId
     * @function isPermittedAction
     * @param {Object} params
     * @param {string} params.tokenId The tokenId to check
     * @param {string} params.ipfsId The IPFS ID of some JS code (a lit action)
     * @returns {Promise<boolean>} A boolean indicating whether the IPFS ID is permitted to sign using the PKP tokenId
     */
    function isPermittedAction({
      tokenId,
      ipfsId,
    }: {
      tokenId: string;
      ipfsId: string;
    }): Promise<boolean>;

    /**
     * Check if a given wallet address is permitted to sign using a given PKP tokenId
     * @function isPermittedAddress
     * @param {Object} params
     * @param {string} params.tokenId The tokenId to check
     * @param {string} params.address The wallet address to check
     * @returns {Promise<boolean>} A boolean indicating whether the wallet address is permitted to sign using the PKP tokenId
     */
    function isPermittedAddress({
      tokenId,
      address,
    }: {
      tokenId: string;
      address: string;
    }): Promise<boolean>;

    /**
     * Check if a given auth method is permitted to sign using a given PKP tokenId
     * @function isPermittedAuthMethod
     * @param {Object} params
     * @param {string} params.tokenId The tokenId to check
     * @param {number} params.authMethodType The auth method type.  This is an integer.  This mapping shows the initial set but this set may be expanded over time without updating this contract: https://github.com/LIT-Protocol/LitNodeContracts/blob/main/contracts/PKPPermissions.sol#L25
     * @param {Uint8Array} params.userId The id of the auth method to check expressed as an array of unsigned 8-bit integers (a Uint8Array)
     * @returns {Promise<boolean>} A boolean indicating whether the auth method is permitted to sign using the PKP tokenId
     */
    function isPermittedAuthMethod({
      tokenId,
      authMethodType,
      userId,
    }: {
      tokenId: string;
      authMethodType: number;
      userId: Uint8Array;
    }): Promise<boolean>;

    /**
     * Get the full list of actions that are permitted to sign using a given PKP tokenId
     * @function getPermittedActions
     * @param {Object} params
     * @param {string} params.tokenId The tokenId to check
     * @returns {Promise<Array<string>>} An array of IPFS IDs of lit actions that are permitted to sign using the PKP tokenId
     */
    function getPermittedActions({
      tokenId,
    }: {
      tokenId: string;
    }): Promise<Array<string>>;

    /**
     * Get the full list of addresses that are permitted to sign using a given PKP tokenId
     * @function getPermittedAddresses
     * @param {Object} params
     * @param {string} params.tokenId The tokenId to check
     * @returns {Promise<Array<string>>} An array of addresses that are permitted to sign using the PKP tokenId
     */
    function getPermittedAddresses({
      tokenId,
    }: {
      tokenId: string;
    }): Promise<Array<string>>;

    /**
     * Get the full list of auth methods that are permitted to sign using a given PKP tokenId
     * @function getPermittedAuthMethods
     * @param {Object} params
     * @param {string} params.tokenId The tokenId to check
     * @returns {Promise<Array<Object>>} An array of auth methods that are permitted to sign using the PKP tokenId.  Each auth method is an object with the following properties: auth_method_type, id, and user_pubkey (used for web authn, this is the pubkey of the user's authentication keypair)
     */
    function getPermittedAuthMethods({ tokenId }: { tokenId: string }): Promise<
      Array<{
        auth_method_type: number;
        id: string;
        user_pubkey: string;
      }>
    >;

    /**
     * Get the permitted auth method scopes for a given PKP tokenId and auth method type + id
     * @function getPermittedAuthMethodScopes
     * @param {Object} params
     * @param {string} params.tokenId The tokenId to check
     * @param {number} params.authMethodType The auth method type to look up
     * @param {Uint8Array} params.userId The id of the auth method to check expressed as an array of unsigned 8-bit integers (a Uint8Array)
     * @param {number} params.maxScopeId The maximum scope id to check.  This is an integer.
     * @returns {Promise<Array<boolean>>} An array of booleans that define if a given scope id is turned on.  The index of the array is the scope id.  For example, if the array is [true, false, true], then scope ids 0 and 2 are turned on, but scope id 1 is turned off.
     */
    function getPermittedAuthMethodScopes({
      tokenId,
      authMethodType,
      userId,
      maxScopeId,
    }: {
      tokenId: string;
      authMethodType: number;
      userId: Uint8Array;
      maxScopeId: number;
    }): Promise<Array<boolean>>;

    /**
     * Converts a PKP public key to a PKP token ID by hashing it with keccak256
     * @function pubkeyToTokenId
     * @param {Object} params
     * @param {string} params.publicKey The public key to convert
     * @returns {Promise<string>} The token ID as a string
     */
    function pubkeyToTokenId({
      publicKey,
    }: {
      publicKey: string;
    }): Promise<string>;

    /**
     * Gets latest nonce for the given address on a supported chain
     * @function getLatestNonce
     * @param {Object} params
     * @param {string} params.address The wallet address for getting the nonce
     * @param {string} params.chain The chain of which the nonce is fetched
     * @returns {Promise<string>} The token ID as a string
     */
    function getLatestNonce({
      address,
      chain,
    }: {
      address: string;
      chain: string;
    }): Promise<string>;

    /**
     * Ask the Lit Node to sign any data using the ECDSA Algorithm with it's private key share.  The resulting signature share will be returned to the Lit JS SDK which will automatically combine the shares and give you the full signature to use.
     * @function signEcdsa
     * @param {Object} params
     * @param {Uint8Array} params.toSign The data to sign.  Should be an array of 8-bit integers.
     * @param {string} params.publicKey The public key of the PKP you wish to sign with
     * @param {string} params.sigName You can put any string here.  This is used to identify the signature in the response by the Lit JS SDK.  This is useful if you are signing multiple messages at once.  When you get the final signature out, it will be in an object with this signature name as the key.
     * @returns {Promise<string>} This function will return the string "success" if it works.  The signature share is returned behind the scenes to the Lit JS SDK which will automatically combine the shares and give you the full signature to use.
     */
    function signEcdsa({
      toSign,
      publicKey,
      sigName,
    }: {
      toSign: Uint8Array;
      publicKey: string;
      sigName: string;
    }): Promise<string>;

    /**
     * Ask the Lit Node to sign a message using the eth_personalSign algorithm.  The resulting signature share will be returned to the Lit JS SDK which will automatically combine the shares and give you the full signature to use.
     * @function ethPersonalSignMessageEcdsa
     * @param {Object} params
     * @param {string} params.message The message to sign.  Should be a string.
     * @param {string} params.publicKey The public key of the PKP you wish to sign with
     * @param {string} params.sigName You can put any string here.  This is used to identify the signature in the response by the Lit JS SDK.  This is useful if you are signing multiple messages at once.  When you get the final signature out, it will be in an object with this signature name as the key.
     * @returns {Promise<string>} This function will return the string "success" if it works.  The signature share is returned behind the scenes to the Lit JS SDK which will automatically combine the shares and give you the full signature to use.
     */
    function ethPersonalSignMessageEcdsa({
      message,
      publicKey,
      sigName,
    }: {
      message: string;
      publicKey: string;
      sigName: string;
    }): Promise<string>;

    /**
     * Checks a condition using the Lit condition checking engine.  This is the same engine that powers our Access Control product.  You can use this to check any condition that you can express in our condition language.  This is a powerful tool that allows you to build complex conditions that can be checked in a decentralized way.  Visit https://developer.litprotocol.com and click on the "Access Control" section to learn more.
     * @function checkConditions
     * @param {Object} params
     * @param {Array<Object>} params.conditions An array of access control condition objects
     * @param {Object} params.authSig The AuthSig to use for the condition check.  For example, if you were checking for NFT ownership, this AuthSig would be the signature from the NFT owner's wallet.
     * @param {string} params.chain The chain this AuthSig comes from
     * @returns {Promise<boolean>} A boolean indicating whether the condition check passed or failed
     */
    function checkConditions({
      conditions,
      authSig,
      chain,
    }: {
      conditions: Array<any>;
      authSig: any;
      chain: string;
    }): Promise<boolean>;

    /**
     * Set the response returned to the client
     * @function setResponse
     * @param {Object} params
     * @param {string} params.response The response to send to the client.  You can put any string here, like you could use JSON.stringify on a JS object and send it here.
     */
    function setResponse({ response }: { response: string }): void;

    /**
     * Call a child Lit Action
     * @function call
     * @param {Object} params
     * @param {string} params.ipfsId The IPFS ID of the Lit Action to call
     * @param {Object=} params.params Optional parameters to pass to the child Lit Action
     * @returns {Promise<string>} The response from the child Lit Action.  Note that any signatures performed by the child Lit Action will be automatically combined and returned with the parent Lit Action to the Lit JS SDK client.
     */
    function call({
      ipfsId,
      params,
    }: {
      ipfsId: string;
      params?: any;
    }): Promise<string>;

    /**
     * Call a smart contract
     * @function callContract
     * @param {Object} params
     * @param {string} params.chain The name of the chain to use.  Check out the lit docs "Supported Blockchains" page to find the name.  For example, "ethereum"
     * @param {string} params.txn The RLP Encoded txn, as a hex string
     * @returns {Promise<string>} The response from calling the contract
     */
    function callContract({
      chain,
      txn,
    }: {
      chain: string;
      txn: string;
    }): Promise<string>;

    /**
     * Convert a Uint8Array to a string.  This is a re-export of this function: https://www.npmjs.com/package/Uint8Arrays#tostringarray-encoding--utf8
     * @function Uint8ArrayToString
     * @param {Uint8Array} array The Uint8Array to convert
     * @param {string} encoding The encoding to use.  Defaults to "utf8"
     * @returns {string} The string representation of the Uint8Array
     */
    function Uint8ArrayToString(array: Uint8Array, encoding?: string): string;

    /**
     * Convert a string to a Uint8Array.  This is a re-export of this function: https://www.npmjs.com/package/Uint8Arrays#fromstringstring-encoding--utf8
     * @function Uint8ArrayFromString
     * @param {string} string The string to convert
     * @param {string} encoding The encoding to use.  Defaults to "utf8"
     * @returns {Uint8Array} The Uint8Array representation of the string
     */
    function Uint8ArrayFromString(
      string: string,
      encoding?: string
    ): Uint8Array;

    function aesDecrypt({
      symmetricKey,
      ciphertext,
    }: {
      symmetricKey: any;
      ciphertext: any;
    }): any;

    /**
     * Claim a key through a key identifier, the result of the claim will be added to `claim_id`
     * under the `keyId` given.
     * @param {Object} params
     * @param {string} params.keyId user id of the claim
     */
    function claimKey({ keyId }: { keyId: string }): any;

    /**
     * Broadcast a message to all connected clients and collect their responses
     * @param {Object} params
     * @param {string} params.name The name of the broadcast
     * @param {string} params.value The value to broadcast
     * @returns {Promise<string>} The collected responses as a json array
     */
    function broadcastAndCollect({
      name,
      value,
    }: {
      name: string;
      value: string;
    }): Promise<string>;

    /**
     * Decrypt and combine the provided
     * @param {Object} params
     * @param {string} params.accessControlConditions The access control conditions
     * @param {string} params.ciphertext The ciphertext to decrypt
     * @param {string} params.dataToEncryptHash The hash of the data to encrypt
     * @param {string} params.authSig The auth signature
     * @param {string} params.chain The chain
     * @returns {Promise<string>} The combined data
     */
    function decryptAndCombine({
      accessControlConditions,
      ciphertext,
      dataToEncryptHash,
      authSig,
      chain,
    }: {
      accessControlConditions: string;
      ciphertext: string;
      dataToEncryptHash: string;
      authSig: string;
      chain: string;
    }): Promise<string>;

    /**
     * Decrypt to a single node.
     * @param {Object} params
     * @param {string} params.accessControlConditions The access control conditions
     * @param {string} params.ciphertext The ciphertext to decrypt
     * @param {string} params.dataToEncryptHash The hash of the data to encrypt
     * @param {string} params.authSig The auth signature
     * @param {string} params.chain The chain
     * @returns {Promise<string>} The combined data
     */
    function decryptToSingleNode({
      accessControlConditions,
      ciphertext,
      dataToEncryptHash,
      authSig,
      chain,
    }: {
      accessControlConditions: string;
      ciphertext: string;
      dataToEncryptHash: string;
      authSig: string;
      chain: string;
    }): Promise<string>;

    /**
     * Sign and combine ECDSA signatures
     * @param {Object} params
     * @param {Uint8Array} params.toSign the message to sign
     * @param {string} params.publicKey the public key of the PKP
     * @param {string} params.sigName the name of the signature
     * @returns {Promise<Uint8Array>} The resulting signature
     */
    function signAndCombineEcdsa({
      toSign,
      publicKey,
      sigName,
    }: {
      toSign: Uint8Array;
      publicKey: string;
      sigName: string;
    }): Promise<Uint8Array>;

    /**
     * Run a function once
     * @param {Object} params
     * @param {boolean} params.waitForResponse Whether to wait for a response or not - if false, the function will return immediately.
     * @param {string} params.name A unique name for this run
     * @param {Function} async_fn The async function to run
     * @returns {Promise<boolean>} Whether the node can run the code in the next block or not.
     */
    function runOnce(
      {
        waitForResponse,
        name,
      }: {
        waitForResponse: boolean;
        name: string;
      },
      async_fn: () => Promise<any>
    ): Promise<boolean>;

    /**
     * Get the RPC URL for a chain
     * @param {Object} params
     * @param {string} params.chain The chain to get the RPC URL for
     * @returns {Promise<string>} The RPC URL for the chain
     */
    function getRpcUrl({ chain }: { chain: string }): Promise<string>;

    /**
     * Encrypt data
     * @param {Object} params
     * @param {string} params.accessControlConditions The access control conditions
     * @param {string} params.to_encrypt The message to encrypt
     * @returns {Promise<{ciphertext: string; dataToEncryptHash: string}>} Contains two items: The ciphertext result after encryption, named "ciphertext" and the dataToEncryptHash, named "dataToEncryptHash"
     */
    function encrypt({
      accessControlConditions,
      to_encrypt,
    }: {
      accessControlConditions: string;
      to_encrypt: string;
    }): Promise<{
      ciphertext: string;
      dataToEncryptHash: string;
    }>;
  }
}
