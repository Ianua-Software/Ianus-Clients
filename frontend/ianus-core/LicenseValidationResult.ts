import { ILicense } from "./License";

export type LicenseValidationError = {
    isValid: false;
    reason: string;
    isTerminalError?: boolean;
}

export type LicenseValidationSuccess = {
    isValid: true;
    license: ILicense;
}

export type LicenseValidationResult = LicenseValidationError | LicenseValidationSuccess;