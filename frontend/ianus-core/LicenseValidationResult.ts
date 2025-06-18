import { ILicense } from "./License";

export interface LicenseValidationResult {
    isValid: boolean;
    reason: string;
    license?: ILicense;
}