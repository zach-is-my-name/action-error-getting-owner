# action-error-getting-owner

1.) Install dependencies:

```bash
bun install
```
2.) Create .env.test
```bash 
cp .env.example .env.test
```
3.) Edit .env.test to include two private keys with Lit Capacity Credit and Lit Tokens :
- TEACHER_PRIVATEKEY="<private-key>"
- LEARNER_PRIVATEKEY="<private-key>"


4.) Fund LEARNER_PRIVATEKEY:"<private-key>" 
  
  4a.) Add Sepolia USDC
  - Visit https://faucet.circle.com/  
  - enter address associated with LEARNER_PRIVATEKEY;

  4b.) Add Sepolia Eth  
  - Create an Issue with your Learner Address and I'll transfer Sepolia Eth to that address 
  OR
  - https://cloud.google.com/application/web3/faucet/ethereum/sepolia

5.) Run tests:

```bash
bun --env-file=.env.test test 
```

