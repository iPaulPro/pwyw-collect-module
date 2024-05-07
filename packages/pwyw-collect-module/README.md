# PayWhatYouWantCollectModule Helper Library

This library provides helper functions for interacting with the `PayWhatYouWantCollectModule`.

## Initialize

The `createOpenActionModuleInput` function takes care of the ABI encoding and creation of the `CollectPublicationAction` calldata:

```typescript
import type { OnchainPostRequest, OpenActionModuleInput } from "@lens-protocol/client";
import { createOpenActionModuleInput } from 'pwyw-collect-module';
import { ethers } from 'ethers';

const openActionInput: OpenActionModuleInput = createOpenActionModuleInput({
  amountFloor: ethers.utils.parseUnits('0.01', 18), // optional
  collectLimit: 10n, // optional
  currency: '0x3d2bD0e15829AA5C362a4144FdF4A1112fa29B5c', // optional
  referralFee: 1000, // optional
  followerOnly: false, // optional
  endTimestamp: 0n, // optional
  recipients: [
    {
      recipient: '0xdaA5EBe0d75cD16558baE6145644EDdFcbA1e868',
      share: 10000
    }
  ]
});

const postRequest: OnchainPostRequest = { contentURI };
postRequest.openActionModules= [{ unknownOpenAction: openActionInput }];
await lensClient.publication.postOnchain(postRequest);
```

## Collect

```typescript
import type { ActOnOpenActionRequest } from "@lens-protocol/client";
import { createOpenActionModuleInput } from 'pwyw-collect-module';
import { ethers } from 'ethers';

const actOnRequest: ActOnOpenActionRequest = createActOnOpenActionRequest(
  "0xd8-0x01", // publicationId
  {
    collectNftRecipient: "0xdaA5EBe0d75cD16558baE6145644EDdFcbA1e868",
    currency: "0x3d2bD0e15829AA5C362a4144FdF4A1112fa29B5c", // BONSAI
    amount: ethers.utils.parseUnits("1", 18).toString(), // 1 $BONSAI
  },
);
```