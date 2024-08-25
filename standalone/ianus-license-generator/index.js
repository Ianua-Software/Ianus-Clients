#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const jsonwebtoken = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

// Parse command-line arguments
const argv = yargs(hideBin(process.argv))
  .option("publisher-id", { type: "string", demandOption: true })
  .option("product-id", { type: "string", demandOption: true })
  .option("subject-id", { type: "string", demandOption: true })
  .option("env", {
    type: "array",
    describe: "Environments in the format type:identifier:name",
    demandOption: true,
  })
  .option("private-key", { type: "string", demandOption: true })
  .option("key-id", { type: "string", demandOption: true })
  .option("output", { type: "string", demandOption: true })
  .option("expires-in", {
    type: "number",
    describe: "Expiration in days",
    default: 30
  })
  .argv;

// Convert env args into objects
const parseEnvironments = (envArgs) =>
  envArgs.map((entry) => {
    const [type, identifier, name] = entry.split(":");
    return { type, identifier, name };
  });

// Generate JWT
const createLicense = (args) => {
  const now = Math.floor(Date.now() / 1000);
  const expiration = now + args.expiresIn * 24 * 60 * 60;

  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: args.keyId,
  };

  const claims = {
    jti: uuidv4(),
    iss: `https://www.ianusguard.com/api/public/products/${args.productId}`,
    aud: "ianusguard",
    pub: args.publisherId,
    prd: args.productId,
    sub: args.subjectId,
    env: parseEnvironments(args.env),
    required_roles: [],
    iat: now,
    nbf: now,
    exp: expiration,
    custom: {},
    iss_meta: {
      name: "Ianus Guard Demo by Ianua Software UG (haftungsbeschränkt)",
    },
    aud_meta: {
      name: "Ianus Guard",
    },
    pub_meta: {
      name: "Ianua Software UG (haftungsbeschränkt)",
    },
    prd_meta: {
      name: "Ianus Guard Demo",
    },
    sub_meta: {
      name: "Ianua Software UG DEV",
    },
    ver: "1.0",
  };

  return { claims, header };
};

// Main
const { header, claims } = createLicense({
  keyId: argv["key-id"],
  productId: argv["product-id"],
  publisherId: argv["publisher-id"],
  subjectId: argv["subject-id"],
  env: argv["env"]
});

// Sign
const privateKey = fs.readFileSync(argv["private-key"], "utf8");
const jwt = jsonwebtoken.sign(
  claims,
  privateKey,
  {
    algorithm: "RS256",
    header
  }
);

// Write JWT to output
fs.writeFileSync(path.resolve(argv.output), jwt);
console.log(`✅ License written to ${argv.output}`);
