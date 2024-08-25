# Standalone License Issuance

At Ianua Software, we value your freedom. That's why we provide the tools to create and issue licenses entirely on your own, outside of our platform.

While these standalone licenses won't benefit from all features of our platform (e.g., secure private key storage, easy cooperation with other users, public key endpoints, self-service license generation for your users, centralized license insights, ...), they **will be fully validated on the client side**. This means your product can continue functioning independently of our infrastructure if needed.

## Why Standalone?

We want you to choose Ianus Guard for the **advantages and comfort it provides**, not because you're locked into it. That’s why we encourage early **dual-signing** of your products:

- Generate one key on Ianus Guard (our platform)
- Generate a second key locally and store it securely
- Configure both public keys in your clients

This gives you the flexibility to leave our platform anytime without risking service interruptions.

> 💬 We're confident in our service — but if you ever consider leaving, feel free to reach out. We're happy to hear your thoughts and improve where we can.

---

## 🔐 Generating Your RSA Key Pair

Run the following commands to create a private/public RSA key pair:

```bash
# Generate private key (keep this secret!)
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048

# Generate public key (safe to share with clients)
openssl rsa -pubout -in private.pem -out public.pem
```
> ⚠️ Important: Keep your private.pem secure and never share it. Your public.pem will be used by client applications for verification.

## 🎟️ Issuing a License

You can issue licenses using our official tool published on npm:

npx @ianua/ianus-license-generator \
  --publisher-id 362acb9f-dddf-4547-8445-9b66c11b6e5f \
  --product-id 65936925-e356-458c-ba6e-f9525b91d8b4 \
  --subject-id 2110fa24-4cc9-4b73-99f8-847d553a0e6d \
  --env dataverse:86ba945e-f4d2-49bd-9841-2a4d6b2a7ac0:DEV \
  --private-key ./private.pem \
  --key-id 204b988a-a7a0-415e-9de3-dd928fb016e7 \
  --output license.jwt

The tool will generate a JWT license in standard format, ready for use.

## Can a third party generate licenses on their own using this?
Licenses are cryptographically signed. By adding the public key(s) when implementing Ianus Guard, you define to trust only these keys.
If someone else ran this script with all the same values as you do, but with a different private key, as you kept your private key in a secure place, the license will be rejected by all license clients.

This is because the digital signature will not match, the license will be rejected with the message: "Invalid license signature: Verification failed!".

## 🧩 Integration

Be sure to add the corresponding public key (from public.pem) into your client license verifier configuration.
