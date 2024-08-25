import { ILicense } from "./License";

export type SecureConfig =
{
    configId: string;
    licenseKey: string;
    licenseClaims: ILicense | undefined;
}