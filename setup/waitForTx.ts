import {TransactionResponse, ethers} from 'ethers'
export async function waitForTransaction(provider: ethers.Provider, txHash: string, maxTotalTime: number = 15000): Promise<TransactionResponse> {
  const startTime = Date.now();
  const retryDelay = 1000; // 1 second between retries

  while (Date.now() - startTime < maxTotalTime) {
    const txResponse = await provider.getTransaction(txHash);
    
    if (txResponse !== null) {
      console.log("Transaction found. Waiting for confirmation...");
      try {
        await txResponse.wait(1);
        console.log("Transaction confirmed!");
        return txResponse;
      } catch (error) {
        console.error("Error waiting for transaction confirmation:", error);
        throw error;
      }
    }

    console.log(`Transaction not found. Retrying in ${retryDelay/1000} seconds...`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }

  throw new Error(`Transaction not found after ${maxTotalTime/1000} seconds`);
}
