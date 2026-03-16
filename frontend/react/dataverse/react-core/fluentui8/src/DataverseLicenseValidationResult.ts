import { ILicense } from "../../../../../ianus-core/License";

export type DataverseLicenseValidationError = {
    isValid: false;
    reason: string;
    isTerminalError?: boolean;
    licenseId?: string;
    licenseKey?: string;
}

export type DataverseLicenseValidationSuccess = {
    isValid: true;
    license: ILicense;
    licenseId: string;
    licenseKey: string;
}

export type DataverseLicenseValidationResult = DataverseLicenseValidationError | DataverseLicenseValidationSuccess;