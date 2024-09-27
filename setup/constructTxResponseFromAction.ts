import {TransactionResponse} from 'ethers';
export const constructTxResponseFromAction = (approveTxResponse: TransactionResponse)=>{
  return {
    hash: approveTxResponse.hash,
    type: approveTxResponse.type,
    to: approveTxResponse.to,
    from: approveTxResponse.from,
    nonce: approveTxResponse.nonce,
    gasLimit: approveTxResponse.gasLimit,
    gasPrice: approveTxResponse.gasPrice,
    maxPriorityFeePerGas: approveTxResponse.maxPriorityFeePerGas,
    maxFeePerGas: approveTxResponse.maxFeePerGas,
  };
}
