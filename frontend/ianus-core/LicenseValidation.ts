import { ILicense } from "./License";
import { LicenseValidationResult } from "./LicenseValidationResult";

// from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
const str2ab = (str: string) => {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
};
 
const importRsaKey = (pem: string) => {
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pem.replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----","").trim());
    // convert from a binary string to an ArrayBuffer
    const binaryDer = str2ab(binaryDerString);
  
    return window.crypto.subtle.importKey(
      "spki",
      binaryDer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      true,
      ["verify"]
    );
};

const validateClaims = (validIsvId: string, validProductId: string, organizationId: string, license: ILicense): [boolean, string] => {
    if (!license) {
        return [false, "No license passed!"];
    }

    if (!license.env || !license.env.length || !license.aud || !license.iss) {
        return [false, "Incomplete license!"];
    }

    const validIssuer = `https://www.ianusguard.com/api/public/products/${validProductId}`;

    if (license.iss.toLowerCase() !== validIssuer.toLowerCase()) {
        return [false, `Invalid license issuer: Issuer must be '${validIssuer}'`];
    }

    const validAudience = "ianusguard";

    if (license.aud !== validAudience) {
        return [false, `Invalid license audience: Audience must be '${validIsvId}'`];
    }

    if (license.isv !== validIsvId) {
        return [false, `Invalid license ISV: ISV must be '${validIsvId}'`];
    }

    if (license.prd !== validProductId) {
        return [false, `Invalid license product: Product must be '${validProductId}'`];
    }

    const formattedOrganizationId = organizationId.replace("{", "").replace("}", "").toLowerCase();
    if (!license.env.includes(formattedOrganizationId)) {
        return [false, `Invalid organization: Your license is not intended for usage in '${formattedOrganizationId}' but for '${JSON.stringify(license.env)}'`];
    }

    // Licenses without exp are considered not expiring
    if (license.exp != null )
    {
        if(isNaN(license.exp)) {
            return [false, "Invalid license expiry: Expiry is not a number"];
        }

        const expiryDate = new Date(license.exp * 1000);
        if (expiryDate < new Date()) {
            return [false, `Invalid license expiry: License expired on '${expiryDate}'`];
        }
    }

    return [true, ""];
};

// Helper for Base64url encoding, from: https://thewoods.blog/base64url/
const base64url_decode = (value: string): ArrayBuffer => {
    const m = value.length % 4;
    return Uint8Array.from(atob(
        value.replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(value.length + (m === 0 ? 0 : 4 - m), '=')
    ), c => c.charCodeAt(0)).buffer
};

const verifySignature = async (key: CryptoKey, dataToVerify: BufferSource, signature: BufferSource) =>
{
    return await window.crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        key,
        signature,
        dataToVerify
    );
}

export const validateLicense = async (validIsvId: string, validProductId: string, organizationId: string, publicKey: string, licenseKey: string | undefined): Promise<LicenseValidationResult> => {
    if (!licenseKey) {
        return {
            isValid: false,
            reason: "No license key passed!"
        };
    }

    try {
        const key = await importRsaKey(publicKey);
        const parts = licenseKey.split('.');

        if (parts.length < 3) {
            return {
                isValid: false,
                reason: "Incorrect license!"
            };
        }

        const [encodedHeaders, encodedClaims, signature] = parts;

        const plainClaims = window.atob(encodedClaims);
        const claimsJson = JSON.parse(plainClaims);

        const [claimsValidationResult, claimsValidationResultMessage] = validateClaims(validIsvId, validProductId, organizationId, claimsJson);

        if (!claimsValidationResult) {
            return {
                isValid: false,
                reason: claimsValidationResultMessage
            };
        }

        const dataToVerify = new TextEncoder().encode(encodedHeaders + "." + encodedClaims);
        const signatureToVerify = base64url_decode(signature);
        const isLicenseSignatureValid = verifySignature(key, dataToVerify, signatureToVerify);

        if (!isLicenseSignatureValid)
        {
            return {
                isValid: false,
                reason: "Invalid license signature: Verification failed!"
            };
        }
        else
        {
            return {
                isValid: true,
                reason: "",
                license: claimsJson
            };
        }
    }
    catch {
        return {
            isValid: false,
            reason: "Oops, something went wrong while validating your license"
        };
    }
};