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

const validateClaims = (validIssuer: string, validAudience: string, organizationId: string, license: ILicense): [boolean, string] => {
    if (!license) {
        return [false, "No license passed!"];
    }

    if (!license.env || !license.env.length || !license.aud || !license.iss) {
        return [false, "Incomplete license!"];
    }

    if (license.iss !== validIssuer) {
        return [false, `Invalid license issuer: License must be issued by '${validIssuer}'`];
    }

    if (license.aud !== validAudience) {
        return [false, `Invalid license audience: License audience must be '${validAudience}'`];
    }

    const formattedOrganizationId = organizationId.replace("{", "").replace("}", "").toLowerCase();
    if (!license.env.includes(formattedOrganizationId)) {
        return [false, `Invalid organization: Your license is not intended for usage in '${formattedOrganizationId}' but for '${JSON.stringify(license.env)}'`];
    }

    // Licenses without exp are considered not expiring
    if (license.exp != null )
    {
        if(isNaN(license.exp)) {
            return [false, "Invalid license expiry: License expiry is not a number"];
        }

        const expiryDate = new Date(license.exp * 1000);
        if (expiryDate < new Date()) {
            return [false, `Invalid license expiry: Your license has expired on '${expiryDate}'`];
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

export const validateLicense = async (validIssuer: string, validAudience: string, organizationId: string, publicKey: string, licenseKey: string | undefined): Promise<LicenseValidationResult> => {
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

        const [claimsValidationResult, claimsValidationResultMessage] = validateClaims(validIssuer, validAudience, organizationId, claimsJson);

        if (!claimsValidationResult) {
            return {
                isValid: false,
                reason: claimsValidationResultMessage
            };
        }

        const isLicenseSignatureValid = await window.crypto.subtle.verify(
            "RSASSA-PKCS1-v1_5",
            key,
            base64url_decode(signature),
            new TextEncoder().encode(encodedHeaders + "." + encodedClaims)
        );

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