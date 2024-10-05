import { ILicense } from "../../../ianus-core/License";

export type LicenseData =
{
    /**
     * The id of the ian_license record that was found for the current licensed product
     */
    licenseId: string;

    /**
     * The license key inside the found ian_license record
     */
    licenseKey: string;

    /**
     * The claims of the license if license is valid, otherwise undefined
     */
    licenseClaims: ILicense | undefined;
}