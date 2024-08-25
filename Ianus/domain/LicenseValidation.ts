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
    const binaryDerString = window.atob(pem);
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

const validateLicense = (license: ILicense): [boolean, string] => {
    if (!license) {
        return [false, "No license passed!"];
    }

    if (!license.sub || !license.aud || !license.iss || !license.exp) {
        return [false, "Incomplete license!"];
    }

    if (license.iss !== "XRM-OSS") {
        return [false, "Invalid license issuer"];
    }

    if (license.aud !== "XRM-OSS-AITUNE") {
        return [false, "This license is not scoped to AI Tune!"];
    }

    if (isNaN(license.exp)) {
        return [false, "License expiry is invalid!"];
    }

    if (new Date(license.exp * 1000) < new Date()) {
        return [false, "Your license has expired"];
    }

    if (license.sub !== window.location.hostname) {
        return [false, `This license is not intended for usage in ${window.location.hostname} but for ${license.sub}. You need a matching license!`];
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

export const checkLicense = async (publicKey: string, licenseKey: string | undefined): Promise<[string, ILicense?]> => {
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

        const [contentValidationResult, contentValidationResultMessage] = validateLicense(claimsJson);

        if (!contentValidationResult) {
            return [contentValidationResultMessage];
        }

        const isLicenseSignatureValid = await window.crypto.subtle.verify(
            "RSASSA-PKCS1-v1_5",
            key,
            base64url_decode(signature),
            new TextEncoder().encode(encodedHeaders + "." + encodedClaims)
        );

        return [isLicenseSignatureValid ? "" : "License signature verification failed!", isLicenseSignatureValid ? claimsJson : undefined];
    }
    catch {
        return ["Oops, something went wrong while validating your license"];
    }
};