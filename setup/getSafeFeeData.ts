import { ethers, FeeData } from 'ethers';

export async function getSafeFeeData(provider: ethers.Provider): Promise<FeeData> {
  try {
    const feeData = await provider.getFeeData();
    if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
      return feeData;
    }
  } catch (error) {
    console.warn(`Failed to get fee data: ${(error as Error).message}`);
  }

  // If getFeeData() fails or returns undefined values, use a fallback method
  const block = await provider.getBlock('latest');
  const baseFee = block?.baseFeePerGas ?? ethers.parseUnits('20', 'gwei');
  const priorityFee = ethers.parseUnits('1', 'gwei');

  const fallbackFeeData: FeeData = {
    gasPrice: baseFee + priorityFee,
    maxFeePerGas: baseFee * BigInt(2) + priorityFee,
    maxPriorityFeePerGas: priorityFee,
    toJSON: () => ({
      gasPrice: fallbackFeeData.gasPrice?.toString(),
      maxFeePerGas: fallbackFeeData.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: fallbackFeeData.maxPriorityFeePerGas?.toString(),
    })
  };

  return fallbackFeeData;
}

