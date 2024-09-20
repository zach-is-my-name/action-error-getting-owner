import {BigNumberish, ethers, HDNodeWallet} from "ethers";

export const learnerSessionId_DurationSigs = async (secureSessionId: string, duration: BigNumberish, learnerWallet: ethers.Wallet ) => {
  const sessionData = ethers.concat([
    ethers.toUtf8Bytes(secureSessionId),
    ethers.toBeHex(duration)
  ]);
  const message = ethers.keccak256(sessionData);
  const learner_sessionIdAndDurationSig = await learnerWallet.signMessage(ethers.getBytes(message));
  return {sessionData, learner_sessionIdAndDurationSig }
}

export const teacherSessionId_DurationSigs = async (secureSessionId: string, duration: BigNumberish, teacherWallet: ethers.Wallet) => {
  const sessionData = ethers.concat([
    ethers.toUtf8Bytes(secureSessionId),
    ethers.toBeHex(duration)
  ]);
  const message = ethers.keccak256(sessionData);
  const teacher_sessionIdAndDurationSig = await teacherWallet.signMessage(ethers.getBytes(message));
  return {sessionData, teacher_sessionIdAndDurationSig }
}
