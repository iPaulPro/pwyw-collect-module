import { ActOnOpenActionRequest, OpenActionModuleInput, encodeData } from "@lens-protocol/client";

export const ADDRESS_MAINNET = "0x7fbD7496CaE2DAcad7a62350DA8488E31eC026eA";
export const ADDRESS_TESTNET = "0x3d06AA6ca4FC7eE0D5581B85CB52CA7714175e43";
export const INIT_ABI = [
  { type: "uint160", name: "amountFloor" },
  { type: "uint96", name: "collectLimit" },
  { type: "address", name: "currency" },
  { type: "uint16", name: "referralFee" },
  { type: "bool", name: "followerOnly" },
  { type: "uint72", name: "endTimestamp" },
  {
    type: "tuple(address,uint16)[5]",
    name: "recipients",
    components: [
      { type: "address", name: "recipient" },
      { type: "uint16", name: "split" },
    ],
  },
];
export const PROCESS_ABI = [
  { type: "address", name: "currency" },
  { type: "uint256", name: "amount" },
];

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ADDRESS_ACTION_MAINNET = "0x0D90C58cBe787CD70B5Effe94Ce58185D72143fB";
const ADDRESS_ACTION_TESTNET = "0x34A437A91415C36712B0D912c171c74595Be437d";

/**
 * A recipient that receives a split of the payment
 */
export type PWYWRecipient = {
  /**
   * The address of the recipient
   */
  recipient: string;

  /**
   * The split of the payment the recipient will receive in basis points (0-10000)
   */
  split: number;
};

/**
 * Input for creating a PWYW Collect
 */
export type PWYWCollectModuleInitInput = {
  /**
   * The minimum amount that can be collected. Free is allowed if 0 or not provided.
   */
  amountFloor?: bigint;

  /**
   * The maximum number of Collects. Unlimited if 0 or not provided.
   */
  collectLimit?: bigint;

  /**
   * The currency to collect in. Any token can be used if zero address or not provided.
   */
  currency?: string;

  /**
   * The referral fee to pay to collects from mirrors. 0 if not provided.
   */
  referralFee?: number;

  /**
   * If only followers can collect. False if not provided.
   */
  followerOnly?: boolean;

  /**
   * The end timestamp for collecting. Open-ended if 0 or not provided.
   */
  endTimestamp?: bigint;

  /**
   * The recipients of the payment. Minimum of 1 and maximum of 5.
   */
  recipients: PWYWRecipient[];
};

/**
 * Input for processing a CollectPublicationAction with the PWYW Collect Module
 */
export type PWYWCollectModuleProcessInput = {
  /**
   * The recipient of the Collect NFT
   */
  collectNftRecipient: string;

  /**
   * The currency to collect in. May be omitted for free collect.
   */
  currency?: string;

  /**
   * The amount to pay for the collect. May be omitted for free collect.
   */
  amount?: bigint;
};

/**
 * Creates an OpenActionModuleInput for CollectPublicationAction with the PWYW Collect Module
 *
 * @param input The input for the PWYW Collect Module
 * @param isMainnet Running on mainnet (Polygon) or testnet (Amoy)
 */
export const createOpenActionModuleInput = (
  input: PWYWCollectModuleInitInput,
  isMainnet: boolean = true,
): OpenActionModuleInput => {
  if (input.recipients.length === 0) {
    throw new Error("At least one recipient is required");
  }

  if (input.recipients.length > 5) {
    throw new Error("Maximum of 5 recipients allowed");
  }

  if (input.recipients.some(recipient => recipient.split < 0 || recipient.split > 10000)) {
    throw new Error("Recipient split must be between 0 and 10000");
  }

  if (input.referralFee && (input.referralFee < 0 || input.referralFee > 10000)) {
    throw new Error("Referral fee must be between 0 and 10000");
  }

  if (input.amountFloor && input.amountFloor < 0) {
    throw new Error("Amount floor must be greater than or equal to 0");
  }

  if (input.collectLimit && input.collectLimit < 0) {
    throw new Error("Collect limit must be greater than or equal to 0");
  }

  if (input.endTimestamp && input.endTimestamp < 0) {
    throw new Error("End timestamp must be greater than or equal to 0");
  }

  if (input.amountFloor && input.currency && input.amountFloor > 0 && input.currency === ZERO_ADDRESS) {
    throw new Error("Currency address must be provided if amount floor is greater than 0");
  }

  // First create the init data for the collect module
  const collectInitData = encodeData(INIT_ABI, [
    input.amountFloor?.toString() ?? "0",
    input.collectLimit?.toString() ?? "0",
    input.currency ?? ZERO_ADDRESS,
    input.referralFee?.toString() ?? "0",
    input.followerOnly ?? false,
    input.endTimestamp?.toString() ?? "0",
    [...input.recipients.map(recipient => [recipient.recipient, recipient.split.toString()])],
  ]);

  // Then create the init data for the action module
  const actionInitData = encodeData(
    [
      { type: "address", name: "collectModule" },
      { type: "bytes", name: "collectModuleInitData" },
    ],
    [isMainnet ? ADDRESS_MAINNET : ADDRESS_TESTNET, collectInitData],
  );

  return {
    unknownOpenAction: {
      address: isMainnet ? ADDRESS_ACTION_MAINNET : ADDRESS_ACTION_TESTNET,
      data: actionInitData,
    },
  } satisfies OpenActionModuleInput;
};

export const createActOnOpenActionRequest = (
  publicationId: string,
  input: PWYWCollectModuleProcessInput,
  isMainnet: boolean = true,
): ActOnOpenActionRequest => {
  if (input.amount && input.amount < 0) {
    throw new Error("Amount must be greater than or equal to 0");
  }

  if (input.amount && (!input.currency || input.currency === ZERO_ADDRESS)) {
    throw new Error("Currency address must be provided if amount is greater than 0");
  }

  const processCollectData = encodeData(PROCESS_ABI, [input.currency ?? ZERO_ADDRESS, input.amount?.toString() ?? "0"]);

  const processActionData = encodeData(
    [
      { type: "address", name: "collectNftRecipient" },
      { type: "bytes", name: "collectData" },
    ],
    [input.collectNftRecipient, processCollectData],
  );

  return {
    actOn: {
      unknownOpenAction: {
        address: isMainnet ? ADDRESS_ACTION_MAINNET : ADDRESS_ACTION_TESTNET,
        data: processActionData,
      },
    },
    for: publicationId,
  };
};

const actOnRequest: ActOnOpenActionRequest = createActOnOpenActionRequest(
  "0xd8-0x01", // publicationId
  {
    collectNftRecipient: "0xdaA5EBe0d75cD16558baE6145644EDdFcbA1e868",
    currency: "0x3d2bD0e15829AA5C362a4144FdF4A1112fa29B5c", // BONSAI
    amount: 0n, // 1 $BONSAI
  },
);
