import * as crypto from "crypto";

class Transaction {
  constructor(
    public amount: number,
    public payer: string,
    public payee: string
  ) {}

  toString() {
    return JSON.stringify(this);
  }
}

class Block {
  public nonce = Math.round(Math.random() * 1000000);

  constructor(
    public prevHash: string | null,
    public transaction: Transaction,
    public ts = Date.now()
  ) {}

  get hash() {
    const str = JSON.stringify(this);
    const hash: crypto.Hash = crypto.createHash("sha256");
    hash.update(str).end();
    return hash.digest("hex");
  }
}

class Chain {
  public static instance = new Chain();

  chain: Block[] = [];

  constructor() {
    // Instanciate the first block
    this.chain = [new Block(null, new Transaction(100, "genesis", "davidk"))];
  }

  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }

  mine(nonce: number) {
    let solution = 1;

    console.log("🔨 mining...");

    while (true) {
      const hash = crypto.createHash("MD5");
      hash.update((nonce + solution).toString()).end();

      const attempt = hash.digest("hex");
      if (attempt.substring(0, 4) === "0000") {
        console.log("🔨 found a solution: " + solution);
        return solution;
      }
      solution++;
    }
  }

  addBlock(
    transaction: Transaction,
    senderPublicKey: string,
    signature: Buffer
  ) {
    const verifier = crypto.createVerify("sha256");
    verifier.update(transaction.toString());

    const isValid = verifier.verify(senderPublicKey, signature);

    if (isValid) {
      const newBlock = new Block(this.lastBlock.hash, transaction);
      this.mine(newBlock.nonce);
      this.chain.push(newBlock);
    }
  }
}

class Wallet {
  public publicKey: string;
  public privateKey: string;

  constructor() {
    const keyPair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    this.publicKey = keyPair.publicKey;
    this.privateKey = keyPair.privateKey;
  }

  sendMoney(amount: number, payeePublicKey: string) {
    const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

    const sign = crypto.createSign("SHA256");
    sign.update(transaction.toString()).end();

    const signature = sign.sign(this.privateKey);
    Chain.instance.addBlock(transaction, this.publicKey, signature);
  }
}

const davidkWallet = new Wallet();
const johnWallet = new Wallet();

davidkWallet.sendMoney(50, johnWallet.publicKey);
johnWallet.sendMoney(50, davidkWallet.publicKey);

console.log(Chain.instance);
