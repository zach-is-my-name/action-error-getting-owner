import { ethers } from "https://esm.sh/ethers@5.7.0";
import { LitContracts } from "https://esm.sh/@lit-protocol/contracts-sdk";
import * as LitNodeClient from "https://esm.sh/@lit-protocol/lit-node-client-nodejs";
import { AuthCallback, LitAbility } from "https://esm.sh/@lit-protocol/types";
import { LitActionResource, createSiweMessageWithRecaps } from "https://esm.sh/@lit-protocol/auth-helpers";
import { corsHeaders } from '../_shared/cors.ts';

const PRIVATE_KEY = Deno.env.get("PRIVATE_KEY_MINT_CONTROLLER_PKP") ?? "";
const LIT_NETWORK = Deno.env.get("LIT_NETWORK") ?? "datil-dev";


Deno.serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method === "POST") {
    try {
      const body = await req.text();
      let keyId;
      try {
        const json = JSON.parse(body);
        keyId = json.keyId;
      } catch (parseError) {
        console.error(parseError)
      }

      if (!keyId) {
        console.error("Missing keyId in request");
        return new Response(JSON.stringify({ error: "Missing keyId in request" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const provider = new ethers.providers.JsonRpcProvider("https://yellowstone-rpc.litprotocol.com");
      // if (!PRIVATE_KEY || PRIVATE_KEY.length < 1) throw new Error("private key not being sourced from secrets")
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      const litNodeClient = new LitNodeClient.LitNodeClientNodeJs({ litNetwork: LIT_NETWORK });
      await litNodeClient.connect();
      console.log("LitNodeClient connected");

      const sessionSigs = await getSessionSigs(litNodeClient, wallet);
      console.log("Session signatures obtained");

      const controllerKeyClaimData = await getControllerKeyClaimData(keyId, sessionSigs, litNodeClient, wallet);
      console.log("Key Claim Complete. Returning Key Claim Data", { result: controllerKeyClaimData });
      await litNodeClient.disconnect()

      return new Response(JSON.stringify(controllerKeyClaimData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Unexpected error", { error: error.message, stack: error.stack });

      return new Response(JSON.stringify({ error: "Unexpected error occurred", details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {

    console.log("Method not allowed", { method: req.method });
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getSessionSigs(litNodeClient: any, wallet: ethers.Wallet) {
  const authNeededCallback: AuthCallback = async ({
    uri,
    expiration,
    resourceAbilityRequests,
  }) => {
    if (!uri || !expiration || !resourceAbilityRequests) {
      await litNodeClient.disconnect()
      throw new Error("Missing required parameters");
    }

    const toSign = await createSiweMessageWithRecaps({
      uri: uri,
      expiration: expiration,
      resources: resourceAbilityRequests,
      walletAddress: wallet.address,
      nonce: await litNodeClient.getLatestBlockhash(),
      litNodeClient: litNodeClient,
    });

    const signature = await wallet.signMessage(toSign);

    return {
      sig: signature,
      derivedVia: "web3.eth.personal.sign",
      signedMessage: toSign,
      address: wallet.address,
    };
  };

  return await litNodeClient.getSessionSigs({
    chain: "ethereum",
    resourceAbilityRequests: [
      {
        resource: new LitActionResource("*"),
        ability: LitAbility.LitActionExecution,
      },
    ],
    authNeededCallback,
  });
}

async function getControllerKeyClaimData(keyId: string, sessionSigs: any, litNodeClient: any, wallet: ethers.Wallet) {
  try {
    const contractClient = new LitContracts({ signer: wallet, network: LIT_NETWORK });
    await contractClient.connect();

    const claimActionRes = await litNodeClient.executeJs({
      sessionSigs,
      code: `(async () => { Lit.Actions.claimKey({keyId}); })();`,
      jsParams: { keyId },
    });

    if (claimActionRes && claimActionRes.claims) {
      console.log({derivedKeyId: claimActionRes.claims[keyId].derivedKeyId,
        signatures: claimActionRes.claims[keyId].signatures })

      const claimAndMintResult = claimActionRes.claims;
      try {
        console.log('Before claimAndMint:', {
          derivedKeyId: claimActionRes.claims[keyId].derivedKeyId,
          signaturesLength: claimActionRes.claims[keyId].signatures.length
        });

        const publicKey = await contractClient.pubkeyRouterContract.read.getDerivedPubkey(
        contractClient.stakingContract.read.address,
        `0x${claimActionRes.claims![keyId].derivedKeyId}`
      );
      return [publicKey, claimAndMintResult];

      } catch (error) {
        console.error('Detailed error:', {
          message: error.message,
          name: error.name,
          cause: error.cause,
          stack: error.stack,
          ...error
        });
        throw error;
      }
    } else {
      await litNodeClient.disconnect()

      throw new Error("Claim action did not return expected results");
    }
  } catch (error) {
    console.log("Error in mintAndBurnPKP", { error: error.message, stack: error.stack });
    await litNodeClient.disconnect()

    throw error;
  }
}

