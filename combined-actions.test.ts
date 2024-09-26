import { LocalStorage } from "node-localstorage";
import {ethers, TransactionRequest, AddressLike, SignatureLike, toBeHex, TransactionResponse} from 'ethers'
import { expect, test, beforeAll, afterAll } from "bun:test";
import { LitNodeClient, encryptString, } from '@lit-protocol/lit-node-client';
import { LitContracts } from "@lit-protocol/contracts-sdk"
import { LitNetwork } from "@lit-protocol/constants";
import { AccessControlConditions, ExecuteJsResponse, SessionSigsMap } from "@lit-protocol/types";
import { learnerSessionId_DurationSigs, teacherSessionId_DurationSigs } from "./setup/sessionId_duration_sigs";
import { sessionSigsForDecryptInAction } from "./setup/sessionSigsForDecryptInAction";
import { condenseSignatures } from "./setup/condenseClaimKeySigs";
import { restoreSignatures } from "./setup//restoreClaimKeySigs";
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = "https://onhlhmondvxwwiwnruvo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uaGxobW9uZHZ4d3dpd25ydXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTc0ODg1ODUsImV4cCI6MjAxMzA2NDU4NX0.QjriFvDkfGR8-w_WdTIgMDgcH5EXvs5gyRBOEV880ic";
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);



let inputPublicKey: string;
let outputPublicKey: string;
let isPermittedAction: boolean;
let inputAddress: string;
let outputAddress: string;
let getControllerKeyClaimDataResponse: any;
let litNodeClient: LitNodeClient;
let learnerSessionSigs: SessionSigsMap | undefined;
let teacherSessionSigs: SessionSigsMap | undefined;

const approve_ipfsId = "QmUExi6PorFUZmWzxQB9jV963vuQutcrdPZAVc6dmVj9Tq"
const transferFromAction_ipfsId = "QmeLA4hgYNxbYPZsoYTgzqjpZWnghvdmBRB98bmypDJkqg";
let approveTx: TransactionRequest;
let signedApproveTx: string;
let learner_sessionIdAndDurationSig: string;
let approveTxResponse: TransactionResponse | null;
let mintPkpResponse: any;
const claimKeyIpfsId = "QmcAqoHwpC1gS59GQKgVXGhfhCqBYvF1PpzvZypv6XW6Xk"

let controllerAddress: AddressLike
let controllerPubKey: string;
let controllerClaimKeySigs: SignatureLike[];
let usdcContractAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
let chainId = 84532;
let chain = "sepolia";
let sessionDataLearnerSig: SignatureLike;
let sessionDataTeacherSig: SignatureLike;
let sessionDuration = 30;
let hashedLearnerAddress: AddressLike;
let hashedTeacherAddress: AddressLike;
let learnerAddressCiphertext: string;
let learnerAddressEncryptHash: string;
let accessControlConditions: AccessControlConditions;

let userId: string;
const amount = ".10";
const amountScaled = ethers.parseUnits(".10", 6)
let allowanceAmountParsed: string;
const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth_sepolia')

const teacherPrivateKey = Bun.env.TEACHER_PRIVATEKEY;
const learnerPrivateKey = Bun.env.LEARNER_PRIVATEKEY;
if (!learnerPrivateKey?.length || !teacherPrivateKey?.length) throw new Error('failed to import pk envs')
const learnerWallet = new ethers.Wallet(learnerPrivateKey, provider)
const teacherWallet = new ethers.Wallet(teacherPrivateKey, provider)
console.log("learnerWallet.address", learnerWallet.address);
console.log("teacherWallet.address", teacherWallet.address);
console.log("usdcContractAddress", usdcContractAddress);

const secureSessionId = ethers.hexlify(ethers.randomBytes(16))
const duration = BigInt(30); // mins
let approveActionResult: ExecuteJsResponse;

beforeAll(async () => {
  litNodeClient = new LitNodeClient({
    alertWhenUnauthorized: false,
    litNetwork: LitNetwork.DatilDev,
    checkNodeAttestation: false,
    debug: false,
    storageProvider: {
      provider: new LocalStorage("./lit_storage.db"),
    },
  });

  await litNodeClient.connect()

  const litContracts = new LitContracts({ signer: learnerWallet, network: LitNetwork.DatilDev });
  const learnerSignedData = await learnerSessionId_DurationSigs(secureSessionId, BigInt(duration), learnerWallet )
  learner_sessionIdAndDurationSig = learnerSignedData.learner_sessionIdAndDurationSig;

  sessionDataLearnerSig = learnerSignedData.learner_sessionIdAndDurationSig;
  const teacherSignedData = await teacherSessionId_DurationSigs(secureSessionId, duration, teacherWallet)
  sessionDataTeacherSig = teacherSignedData.teacher_sessionIdAndDurationSig;
  hashedTeacherAddress = ethers.keccak256(teacherWallet.address);
  hashedLearnerAddress = ethers.keccak256(learnerWallet.address);

  // encrypt learnerAddress

  accessControlConditions = [
    {
      contractAddress: '',
      standardContractType: '',
      chain: "ethereum",
      method: '',
      parameters: [
        ':userAddress',
      ],
      returnValueTest: {
        comparator: '=',
        value: teacherWallet.address
      }
    }
  ]
  const {ciphertext, dataToEncryptHash} =  await encryptString({dataToEncrypt: learnerWallet.address, accessControlConditions}, litNodeClient)
  learnerAddressCiphertext = ciphertext;
  learnerAddressEncryptHash = dataToEncryptHash;

  // sessionSigs

  learnerSessionSigs = await sessionSigsForDecryptInAction(learnerWallet, litNodeClient, accessControlConditions, learnerAddressEncryptHash);

  let nonce: number;

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
  } else {
    console.log("No nonce correction needed");
    // If no correction was needed, use the pending nonce
    nonce = pendingNonce;
  }
  // controllerData for mint
  const uniqueData = `ControllerPKP_${Date.now()}`;
  const bytes = ethers.toUtf8Bytes(uniqueData);
  userId = ethers.keccak256(bytes);
  const keyId = litNodeClient.computeHDKeyId(userId, claimKeyIpfsId, true);
 
  try {
  getControllerKeyClaimDataResponse = await supabaseClient.functions.invoke('get-controller-key-claim-data', {
    body: JSON.stringify({
      keyId
    })
  });

  } catch (error) {
    console.log(error)
  }

  // returned: data.[publicKey, claimAndMintResult];
  console.log("getControllerKeyClaimDataResponse ", getControllerKeyClaimDataResponse  )
  controllerPubKey = getControllerKeyClaimDataResponse.data[0];
  inputPublicKey = controllerPubKey;
  console.log("controllerPubKey", controllerPubKey)
  controllerAddress = ethers.computeAddress(controllerPubKey);
  inputAddress = controllerAddress;
  const derivedKeyId = getControllerKeyClaimDataResponse.data[1][keyId].derivedKeyId;
  const rawControllerClaimKeySigs = getControllerKeyClaimDataResponse.data[1][keyId].signatures;


  const condensedSigs = condenseSignatures(rawControllerClaimKeySigs);
  /*--Store Base64 Sigs in DB--*/
  // -- db put --
  /* Restore Signatures -- */
  controllerClaimKeySigs = restoreSignatures(condensedSigs);

  //mintClaimBurn
  let mintClaimResponse: any;
  try {
  mintClaimResponse = await supabaseClient.functions.invoke('mint-controller-pkp', {
    body: JSON.stringify({
      keyType: 2,
      derivedKeyId: derivedKeyId,
      signatures: controllerClaimKeySigs,
      env: "dev",
      ipfsIdsToRegister: [transferFromAction_ipfsId]

    })
  });
  } catch (error) {
    console.log(error);
  }

  console.log("mintClaimResponse", mintClaimResponse)
  outputPublicKey = mintClaimResponse.data.pkpInfo.publicKey;
  outputAddress = ethers.computeAddress(outputPublicKey);
  

  // approve test setup
  const feeData = await provider.getFeeData();
  if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) throw new Error("feeData undefined")

  approveTx = {
    to: usdcContractAddress,
    gasLimit: 65000,
    chainId: 11155111,
    maxPriorityFeePerGas: toBeHex((feeData?.maxPriorityFeePerGas * BigInt(120)) / BigInt(100)),
    maxFeePerGas: toBeHex((feeData?.maxFeePerGas * BigInt(120)) / BigInt(100)),
    nonce,
    data: new ethers.Interface(["function approve(address spender, uint256 amount)"]).encodeFunctionData("approve", [controllerAddress, amountScaled]),
  };

  signedApproveTx = await learnerWallet.signTransaction(approveTx);
})

test("approve", async () => {
  try {
    const jsParams = {
      signedTx: signedApproveTx,
      secureSessionId,
      sessionIdAndDurationSig: learner_sessionIdAndDurationSig,
      duration: String(sessionDuration)
    }

    console.log("jsParams", jsParams)
    approveActionResult = await litNodeClient.executeJs({
      ipfsId: approve_ipfsId,
      sessionSigs: learnerSessionSigs,
      jsParams
    })
    console.log("actionResult", approveActionResult)
    expect(true).toBe(true);
  } catch(error) {
    console.error("Error in executeJs:", error);
    expect(true).toBe(false);
  }

  const txHash = JSON.parse(approveActionResult.response as string);

  approveTxResponse = await provider.getTransaction(txHash);
  await approveTxResponse!.wait(1);
}, 30000);

test("transferFromLearnerToControllerAction", async () => {
  await litNodeClient.disconnect();
  (litNodeClient?.config?.storageProvider?.provider as LocalStorage).clear();
  await litNodeClient.connect();
  teacherSessionSigs = await sessionSigsForDecryptInAction(teacherWallet, litNodeClient, accessControlConditions, learnerAddressEncryptHash);
  const jsParams = {
    ipfsId: transferFromAction_ipfsId,
    userId,
    learnerAddressCiphertext,
    learnerAddressEncryptHash,
    controllerAddress,
    controllerPubKey: controllerPubKey.startsWith("0x") ? controllerPubKey.slice(2) : controllerPubKey,
    usdcContractAddress,
    chain,
    chainId,
    sessionDataLearnerSig,
    sessionDataTeacherSig,
    sessionDuration,
    secureSessionId,
    hashedLearnerAddress,
    hashedTeacherAddress,
    amount,
    accessControlConditions
  }
  console.log("jsParams", jsParams)
  try {

    const actionResult = await litNodeClient.executeJs({
      ipfsId: transferFromAction_ipfsId,
      sessionSigs: teacherSessionSigs,
      jsParams
    })
    console.log("actionResult", actionResult)
    expect(true).toBe(true);

  } catch (error) {
    console.error("Error in executeJs:", error);
    expect(true).toBe(false);
  }
}, 30000);
afterAll(async () => {
  console.log("inputPublicKey", inputPublicKey )
  console.log("outputPublicKey", outputPublicKey)
  console.log("inputAddress", inputAddress);
  console.log("outputAddress", outputAddress);
})

