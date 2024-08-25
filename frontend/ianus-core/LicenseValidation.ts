import { ILicenseClaims } from "./LicenseClaims";
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

const validateClaims = (publisherId: string, productId: string, environmentType: string, environmentIdentifier: string, license: ILicenseClaims): [boolean, string] => {
    if (!license) {
        return [false, "No license passed!"];
    }

    if (!license.env || !license.env.length || !license.aud || !license.iss) {
        return [false, "Incomplete license!"];
    }

    const validIssuer = `https://www.ianusguard.com/api/public/products/${productId}`;

    if (license.iss.toLowerCase() !== validIssuer.toLowerCase()) {
        return [false, `Invalid license issuer: Issuer must be '${validIssuer}'`];
    }

    const validAudience = "ianusguard";

    if (license.aud !== validAudience) {
        return [false, `Invalid license audience: Audience must be '${publisherId}'`];
    }

    if (license.pub !== publisherId) {
        return [false, `Invalid license publisher: Publisher must be '${publisherId}'`];
    }

    if (license.prd !== productId) {
        return [false, `Invalid license product: Product must be '${productId}'`];
    }

    const formattedEnvironmentIdentifier = environmentIdentifier.replace("{", "").replace("}", "").toLowerCase();
    if (!license.env.some(e => e.type.toLowerCase() === environmentType && e.identifier.toLowerCase() == formattedEnvironmentIdentifier)) {
        return [false, `Invalid organization: Your license is not intended for usage in environment of type '${environmentType}' and identifier '${formattedEnvironmentIdentifier}' but for '${JSON.stringify(license.env)}'`];
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
export const base64url_decode = (value: string): ArrayBuffer => {
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

export const validateLicense = async (
    publisherId: string,
    productId: string,
    environmentType: string,
    environmentIdentifier: string,
    publicKeys: string[],
    licenseKey: string | undefined
): Promise<LicenseValidationResult> => {
    if (!licenseKey) {
        return {
            isValid: false,
            isTerminalError: false,
            reason: "No license key set!"
        };
    }

    try {
        const parts = licenseKey.split('.');

        if (parts.length < 3) {
            return {
                isValid: false,
                isTerminalError: false,
                reason: "Incorrect license!"
            };
        }

        const [encodedHeaders, encodedClaims, signature] = parts;

        const plainClaims = new TextDecoder("utf-8").decode(base64url_decode(encodedClaims));
        const claimsJson = JSON.parse(plainClaims);

        const [claimsValidationResult, claimsValidationResultMessage] = validateClaims(publisherId, productId, environmentType, environmentIdentifier, claimsJson);

        if (!claimsValidationResult) {
            return {
                isValid: false,
                isTerminalError: false,
                reason: claimsValidationResultMessage
            };
        }

        const dataToVerify = new TextEncoder().encode(encodedHeaders + "." + encodedClaims);
        const signatureToVerify = base64url_decode(signature);

        for( const publicKey of publicKeys )
        {
            if ( publicKey )
            {
                let keyImportSuccess = false;
                
                try
                {
                    const key = await importRsaKey(publicKey);
                    keyImportSuccess = true;

                    const isLicenseSignatureValid = await verifySignature(key, dataToVerify, signatureToVerify);

                    if (isLicenseSignatureValid === true)
                    {
                        return {
                            isValid: true,
                            claims: claimsJson
                        };
                    }
                }
                catch
                {
                    return {
                        isValid: false,
                        isTerminalError: false,
                        reason: keyImportSuccess
                            ? "An error occured while verifying your license's signature"
                            : "An error occured while importing your public key"
                    };
                }
            }
        }

        return {
            isValid: false,
            isTerminalError: false,
            reason: "Invalid license signature: Verification failed!"
        };
    }
    catch {
        return {
            isValid: false,
            isTerminalError: true,
            reason: "Oops, something went wrong while validating your license"
        };
    }
};