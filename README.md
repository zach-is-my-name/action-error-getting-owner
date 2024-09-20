# action-error-getting-owner

1.) Install dependencies:

```bash
bun install
```
2.) Create .env.test
```bash 
cp .env.example .env.test
```
3.) Edit .env.test to include two private keys with Lit Capacity Credit and Lit Tokens

4.) Fund LEARNER_PRIVATEKEY: 
  - Visit https://faucet.circle.com/  
  - enter address associated with LEARNER_PRIVATEKEY;

5.) Run tests:

```bash
bun --env-file=.env.test test 
```

