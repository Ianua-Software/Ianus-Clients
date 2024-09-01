import { isDataset } from "./IanusGuard";
import { ILicense } from "./License";

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

const arrayBufferFromString = (str: string) => {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};

const validateLicense = (validIssuer: string, validAudience: string, dataverseOrganizationUniqueName: string, license: ILicense): [boolean, string] => {
    if (!license) {
        return [false, "No license passed!"];
    }

    if (!license.env || !license.env.length || !license.aud || !license.iss || !license.exp) {
        return [false, "Incomplete license!"];
    }

    if (license.iss !== validIssuer) {
        return [false, `Invalid license issuer: License must be issued by '${validIssuer}'`];
    }

    if (license.aud !== validAudience) {
        return [false, `Invalid license audience: License audience must be '${validAudience}'`];
    }

    if (isNaN(license.exp)) {
        return [false, "Invalid license expiry: License expiry is not a number"];
    }

    const expiryDate = new Date(license.exp * 1000);
    if (expiryDate < new Date()) {
        return [false, `Invalid license expiry: Your license has expired on '${expiryDate}'`];
    }

    const host = window.location.hostname.toLowerCase();
    if (!license.env.includes(host) && !license.env.includes(dataverseOrganizationUniqueName)) {
        return [false, `Invalid environment: Your license is not intended for usage in '${host}' / '${dataverseOrganizationUniqueName}' but for '${JSON.stringify(license.env)}'`];
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

const extractUniqueNameFromDataset = (dataset: ComponentFramework.PropertyTypes.DataSet) => {
    const records = Object.values(dataset.records);

    if (records.length) {
        const record = records[0];

        if (record.getNamedReference().etn !== "ian_environmentinformation") {
            throw new Error("You need to pass the Environment Information (ian_environmentinformation) as data source for environment info")
        }

        return record.getValue("ian_uniquename") as string;
    }

    return "";
};

export const checkLicense = async (validIssuer: string, validAudience: string, environmentInfo: string | ComponentFramework.PropertyTypes.DataSet, publicKey: string, licenseKey: string | undefined): Promise<[string, ILicense?]> => {
    if (!licenseKey) {
        return ["No license key passed!"];
    }

    try {
        const key = await importRsaKey(publicKey);
        const parts = licenseKey.split('.');

        if (parts.length < 3) {
            return ["Incorrect license!"];
        }

        const [encodedHeaders, encodedClaims, signature] = parts;

        const plainClaims = window.atob(encodedClaims);
        const claimsJson = JSON.parse(plainClaims);

        const dataverseOrganizationUniqueName = isDataset(environmentInfo)
            ? extractUniqueNameFromDataset(environmentInfo)
            : environmentInfo as string;

        const [contentValidationResult, contentValidationResultMessage] = validateLicense(validIssuer, validAudience, dataverseOrganizationUniqueName, claimsJson);

        if (!contentValidationResult) {
            return [contentValidationResultMessage];
        }

        const isLicenseSignatureValid = await window.crypto.subtle.verify(
            "RSASSA-PKCS1-v1_5",
            key,
            base64url_decode(signature),
            new TextEncoder().encode(encodedHeaders + "." + encodedClaims)
        );

        return [isLicenseSignatureValid ? "" : "Invalid license signature: Verification failed!", isLicenseSignatureValid ? claimsJson : undefined];
    }
    catch {
        return ["Oops, something went wrong while validating your license"];
    }
};