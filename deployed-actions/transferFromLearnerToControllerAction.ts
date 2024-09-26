//ipfs://QmbHVUrSctDKuZqVc1U7MTVa1fgJN4tdVUK3PF5JzcMNjn
const transferFromLearnerToControllerAction =
async () => {
  try{
    const verifyDurationAndId = () => {
      // Encode the data
      const encodedData = ethers.utils.concat([
        ethers.utils.toUtf8Bytes(secureSessionId),
        ethers.utils.hexlify(ethers.BigNumber.from(sessionDuration))
      ]);

      // Hash the encoded data
      const message = ethers.utils.keccak256(encodedData);

      // Recover the addresses from the signatures
      const recoveredLearnerAddress = ethers.utils.verifyMessage(ethers.utils.arrayify(message), sessionDataLearnerSig);
      const recoveredTeacherAddress = ethers.utils.verifyMessage(ethers.utils.arrayify(message), sessionDataTeacherSig);

      // Hash the recovered addresses
      const hashedRecoveredLearnerAddress = ethers.utils.keccak256(recoveredLearnerAddress);
      const hashedRecoveredTeacherAddress = ethers.utils.keccak256(recoveredTeacherAddress);

      // Compare the hashed recovered addresses with the provided hashed addresses
      const learnerSignedDuration = hashedLearnerAddress === hashedRecoveredLearnerAddress;
      const teacherSignedDuration = hashedTeacherAddress === hashedRecoveredTeacherAddress;

      if (!learnerSignedDuration || !teacherSignedDuration) {
        Lit.Actions.setResponse({ response: JSON.stringify({ error: "Invalid signatures or addresses don't match" }) });
        throw new Error("Invalid signatures or addresses don't match");
      }
      console.log("verifyDurationAndId success")
    };
    verifyDurationAndId();

    const decryptedLearnerAddress = await Lit.Actions.decryptAndCombine
    ({
        ciphertext: learnerAddressCiphertext,
        dataToEncryptHash: learnerAddressEncryptHash,
        authSig: null,
        chain: "ethereum",
        accessControlConditions
      })

    if (decryptedLearnerAddress.length > 10) {
      console.log("Successfully Decrypted learner address");
    }

    Lit.Actions.setResponse({response: JSON.stringify({
      decryptedLearnerAddress: decryptedLearnerAddress,
      usdcContractAddress: usdcContractAddress,
      controllerAddress: controllerAddress,
      chain: chain,
      amount: amount
    })});

    console.log("decryptedLearnerAddress length", JSON.stringify(decryptedLearnerAddress.length));


    const rpcUrl = await Lit.Actions.getRpcUrl({ chain: chain });
    const latestNonce = await Lit.Actions.getLatestNonce({ address: controllerAddress, chain });

    const abi = [ "function transferFrom(address from, address to, uint256 value) returns (bool)" ];

    const contract = new ethers.Contract(usdcContractAddress, abi);
    const amountBigNumber = ethers.utils.parseUnits(amount, 6);

    const txData = contract.interface.encodeFunctionData("transferFrom", [decryptedLearnerAddress, controllerAddress, amountBigNumber]);

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    const feeData = await provider.getFeeData();
    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) throw new Error("feeData undefined")

    const txObject = {
      to: usdcContractAddress,
      from: controllerAddress,
      nonce: latestNonce,
      chainId,
      data: txData,
      type: 2,
      gasLimit: ethers.utils.hexlify(100000),
      maxPriorityFeePerGas: ethers.utils.hexlify(feeData.maxPriorityFeePerGas.mul(120).div(100)),
      maxFeePerGas: ethers.utils.hexlify(feeData.maxFeePerGas.mul(120).div(100))
    };

    const serializedTx = ethers.utils.serializeTransaction(txObject);
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(serializedTx));
    const toSign = ethers.utils.arrayify(hash);

    console.log("addresses", JSON.stringify({decryptedLearnerAddress, controllerAddress}));

    let signature;
    try {
      signature = await Lit.Actions.signAndCombineEcdsa({
        toSign,
        publicKey: controllerPubKey,
        sigName: "sign_transfer_from",
      });
      console.log("sign transferFrom success");

    } catch (error) {
      console.log("signAndCombineEcdsa Error: ", error)
      Lit.Actions.setResponse({ response: JSON.stringify({ error: "Failed to sign transaction.  Check logs for details" }) });
      return;
    }
    console.log("SIGN_AND_COMBINE_ECDSA_SUCCESS")
    throw new Error("SIGN_AND_COMBINE_ECDSA_SUCCESS")
    return;
    let txResponse;
    let linkData;
    try {
      txResponse = await Lit.Actions.runOnce({
        waitForResponse: true,
        name: "transferFromTxSender"
      }, async () => {
          const signedTx = ethers.utils.serializeTransaction(txObject, signature);
          const tx = await provider.sendTransaction(signedTx);
          await tx.wait(); // Wait for the transaction to be mined
          console.log("submit transferFrom tx success");

          return JSON.stringify({
            transactionHash: tx.hash,
            blockHash: tx.blockHash,
            blockNumber: tx.blockNumber
          });
        });

      txResponse = JSON.parse(txResponse);

      // Create IPFS link
      linkData = {
        originalTxHash: hash,
        relayedTxHash: txResponse.transactionHash,
        learnerAddress: decryptedLearnerAddress,
        controllerAddress: controllerAddress,
        amount: amount,
        usdcContractAddress: usdcContractAddress,
        sessionId: sessionId,
        blockHash: txResponse.blockHash,
        blockNumber: txResponse.blockNumber,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(error)
    }
    let ipfsHash;
    try {
      ipfsHash = await Lit.Actions.ipfsStore({ data: JSON.stringify(linkData) });
      console.log("store data to ipfs success");
      console.log('Data stored on IPFS:', ipfsHash);
    } catch (error) {
      console.error('Failed to store data on IPFS:', error);
    }

    Lit.Actions.setResponse({
      response: JSON.stringify({
        success: true,
        transactionHash: txResponse.transactionHash,
        blockHash: txResponse.blockHash,
        blockNumber: txResponse.blockNumber,
        ipfsHash: ipfsHash
      })
    });

  } catch (error) {
    console.error("Uncaught error in transferFromLearnerToControllerAction function:", error);
  }
};
transferFromLearnerToControllerAction();
