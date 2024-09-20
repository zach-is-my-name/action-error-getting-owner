//ipfs://QmUExi6PorFUZmWzxQB9jV963vuQutcrdPZAVc6dmVj9Tq
const approveAction =

async () => {

  const verifySessionDurationAndSecureId = () => {
    const encodedData = ethers.utils.concat([
      ethers.utils.toUtf8Bytes(secureSessionId),
      ethers.utils.hexlify(ethers.BigNumber.from(duration))
    ]);

    const message = ethers.utils.keccak256(encodedData);
    const recoveredAddress = ethers.utils.verifyMessage(ethers.utils.arrayify(message), sessionIdAndDurationSig);

    const tx = ethers.utils.parseTransaction(signedTx);
    if (!tx.from) throw new Error('tx undefined')
    if (recoveredAddress.toLowerCase() !== tx.from.toLowerCase()) {
      throw new Error("Invalid session duration signature");
    }
  };

  // Verify the transaction
  const tx = ethers.utils.parseTransaction(signedTx);
  if (tx.data.slice(0, 10) !== ethers.utils.id("approve(address,uint256)").slice(0, 10)) {
    throw new Error("Invalid transaction: not an approve function");
  }

  // Verify session duration and secure ID signature
  verifySessionDurationAndSecureId();


  // Send the pre-signed transaction using runOnce
  let sendTransactionDidRun;
  try {
    sendTransactionDidRun = await Lit.Actions.runOnce(
      {
        waitForResponse: true,
        name: "approveTxSender",
      },
      async () => {
        try {
          const rpcUrl = await Lit.Actions.getRpcUrl({ chain: "sepolia" });
          const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
          console.log("RPC URL:", rpcUrl);
          const network = await provider.getNetwork();
          console.log("Connected to Network:", network);
          const tx = await provider.sendTransaction(signedTx);
          console.log("tx", tx)
          // Optionally modify or remove tx.wait()

          return tx.hash;
        } catch (error) {
          // Return error message to the main catch block
          throw new Error(`Transaction failed: ${error}`);
        }
      })
  } catch (error) {
    console.log(error);
  }
  Lit.Actions.setResponse({response: JSON.stringify(sendTransactionDidRun)})

}
approveAction();
