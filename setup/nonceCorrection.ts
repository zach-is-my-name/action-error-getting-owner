import {ethers} from 'ethers'
export const nonceCorrection = async (learnerWallet: ethers.Wallet, provider: ethers.JsonRpcProvider  ) => {
  let nonce;
  const currentNonce = await provider.getTransactionCount(learnerWallet.address, "latest");
  const pendingNonce = await provider.getTransactionCount(learnerWallet.address, "pending");

  if (pendingNonce > currentNonce) {
    // Only send a corrective transaction if there's a discrepancy
    const cancelTx = {
      to: learnerWallet.address,
      value: 0,
      gasLimit: 21000,
      gasPrice: ethers.parseUnits("10", "gwei"),
      nonce: currentNonce,
    };
    const cancelTxResponse = await learnerWallet.sendTransaction(cancelTx);
    await cancelTxResponse.wait();
    console.log("Nonce corrected with transaction:", cancelTxResponse.hash);

    // After correction, the nonce should be the next one
    nonce = currentNonce + 1;
    return nonce;
  } else {
    console.log("No nonce correction needed");
    // If no correction was needed, use the pending nonce
    nonce = pendingNonce;
    return nonce;
  }
}
