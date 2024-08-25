import { ILicenseClaims } from "./LicenseClaims";

export type LicenseValidationError = {
    isValid: false;
    reason: string;
    isTerminalError?: boolean;
}

export type LicenseValidationSuccess = {
    isValid: true;
    claims: ILicenseClaims;
}

export type LicenseValidationResult = LicenseValidationError | LicenseValidationSuccess;