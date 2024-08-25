import { ILicenseClaims } from "../../../../../ianus-core/LicenseClaims";

export type DataverseLicenseValidationError = {
    isValid: false;
    reason: string;
    isTerminalError?: boolean;
    licenseId?: string;
    licenseKey?: string;
}

export type DataverseLicenseValidationSuccess = {
    isValid: true;
    claims: ILicenseClaims;
    licenseId: string;
    licenseKey: string;
}

export type DataverseLicenseValidationResult = DataverseLicenseValidationError | DataverseLicenseValidationSuccess;