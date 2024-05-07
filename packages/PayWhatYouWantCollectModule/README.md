# Pay What You Want Collect Module

This module allows for collectors to name their price, in any supported token, for Lens NFTs. [Pay What You Want](https://en.m.wikipedia.org/wiki/Pay_what_you_want) is a pricing strategy that allows customers to pay any price for a product or service, including $0.

`PayWhatYouWantCollectModule` allows for specifying a token that must be used for bidding, as well as setting a reserve price.

## Table of Contents

- [Deployments](#deployments)
- [Usage](#usage)
  - [Initialization](#initialization)
  - [Collecting / Processing](#collecting--processing)
- [Example](#example)

## Deployments

The Collect Publication Action is deployed to Polygon mainnet and Amoy testnet. The latest contract addresses can be found [here](https://docs.lens.xyz/docs/deployed-contract-addresses). The addresses for the `PayWhatYouWantCollectModule` contracts are:

| Network | Chain ID | `PayWhatYouWantCollectModule` Contract Address                                                                                |
|---------|----------|-------------------------------------------------------------------------------------------------------------------------------|
| Polygon | 137      | [0x7fbD7496CaE2DAcad7a62350DA8488E31eC026eA](https://polygonscan.com/address/0x7fbD7496CaE2DAcad7a62350DA8488E31eC026eA)      |
| Amoy    | 80002    | [0x3d06AA6ca4FC7eE0D5581B85CB52CA7714175e43](https://amoy.polygonscan.com/address/0x3d06AA6ca4FC7eE0D5581B85CB52CA7714175e43) |

## Usage

Collect Modules **are not standalone Open Actions** (Publication Action Modules), but are meant to be used with the core [CollectPublicationAction](https://polygonscan.com/address/0x0D90C58cBe787CD70B5Effe94Ce58185D72143fB#code) contract, just like `SimpleFeeCollectModule` and `MultirecipientFeeCollectModule`.

### Initialization

There are two steps to initializing a Collect Module: initializing the Collect Module and then using that data to initialize the Open Action.

#### Initialize the Collect Module

The init calldata ABI for `PayWhatYouWantCollectModule` is:

```javascript
[
    { "type": "uint160", "name": "amountFloor" }, // The minimum amount that can be paid to collect. 0 for no floor.
    { "type": "uint96", "name": "collectLimit" }, // The maximum number of collects for this publication. 0 for no limit.
    { "type": "address", "name": "currency" }, // The optional currency to restrict collects to. address(0) for no restriction.
    { "type": "uint16", "name": "referralFee" }, // The referral fee associated with this publication. (10 for 10%)
    { "type": "bool", "name": "followerOnly" }, // True if only followers of publisher may collect the post.
    { "type": "uint72", "name": "endTimestamp" }, // The end timestamp after which collecting is impossible. 0 for no expiry.
    {
      "type": "tuple(address,uint16)[5]", // Array of RecipientData items to split collect fees across multiple recipients.
      "name": "recipients",
      "components": [
        { "type": "address", "name": "recipient" }, // The address of the recipient.
        { "type": "uint16", "name": "split" } // The percentage of the collect fee to split to the recipient.
      ]
    }
]
```

#### Initialize the Open Action

The init calldata ABI for `CollectPublicationAction` is:

```json
[
    { "type": "address", "name": "collectModule" },
    { "type": "bytes", "name": "collectModuleInitData" }
]
```

where `collectModule` is the address of the Collect Module and `collectModuleInitData` is the process data from the Collect Module.

### Collecting / Processing

Just like with Initialize, there are two steps to collecting: building the process data for the Collect Module and then calling the Open Action with that data.

#### Collect Module Process

The process (act) calldata ABI for `PayWhatYouWantCollectModule` is:

```json
[
  { "type": "address", "name": "currency" },
  { "type": "uint256", "name": "amount" },
]
```

#### Open Action Process

The process (act) calldata ABI for `CollectPublicationAction` is:

```json
[
  { "type": "address", "name": "collectNftRecipient" },
  { "type": "bytes", "name": "collectData" },
]
```

where `collectData` is the process data from the Collect Module.

## Example

Here's sample code to initialize a Collect Module and add it to an Open Action using the Lens Protocol SDK:

```javascript
import { encodeData } from '@lens-protocol/client';
import { ZeroAddress } from 'ethers';

const EMPTY_RECIPIENT = [ZeroAddress, '0'];

// First, create the PWYW Collect Module init data
const collectInitData = encodeData([
    { type: 'uint160', name: 'amountFloor' },
    { type: 'uint96', name: 'collectLimit' },
    { type: 'address', name: 'currency' },
    { type: 'uint16', name: 'referralFee' },
    { type: 'bool', name: 'followerOnly' },
    { type: 'uint72', name: 'endTimestamp' },
    {
        type: 'tuple(address,uint16)[5]',
        name: 'recipients',
        components: [
            { type: 'address', name: 'recipient' },
            { type: 'uint16', name: 'split' },
        ],
    },
], [
    '0', // amount floor, zero to allow free collects
    '10', // number of mints allowed, zero for unlimited
    ZeroAddress, // optionally limit to a specific token
    '10', // mirror referral percentage
    false, // minting only for followers
    '0', // optional end date, zero for no expiry
    [
        ['0x10E1DEB36F41b4Fad35d10d0aB870a4dc52Dbb2c', '10000'], // the recipient
        EMPTY_RECIPIENT, // can be up to 5 recipients
        EMPTY_RECIPIENT,
        EMPTY_RECIPIENT,
        EMPTY_RECIPIENT
    ],
]);

// Next, create the CollectPublicationAction init data
const data = encodeData(
    [
        { type: 'address', name: 'collectModule' },
        { type: 'bytes', name: 'collectModuleInitData' },
    ],
    [
       '0x7fbD7496CaE2DAcad7a62350DA8488E31eC026eA', // the PWYW Collect Module address
       collectInitData
    ],
);

// Add as an `unknownOpenAction` to the publication
openActionModules.push({
    unknownOpenAction: {
        address: '0x0D90C58cBe787CD70B5Effe94Ce58185D72143fB', // the CollectPublicationAction address
        data,
    },
});
```

And here's how to process a collect:

```javascript
import { ethers } from "ethers";
import { encodeData } from "@lens-protocol/client";

const processCollectData = encodeData([
  { type: "address", name: "currency" },
  { type: "uint256", name: "amount" },
], [
  "0x3d2bD0e15829AA5C362a4144FdF4A1112fa29B5c", // BONSAI
  ethers.utils.parseUnits("1", 18).toString(), // 1 $BONSAI
]);

const processActionData = encodeData(
  [
    { type: "address", name: "collectNftRecipient" },
    { type: "bytes", name: "collectData" },
  ],
  [RECIPIENT, processCollectData],
);
```