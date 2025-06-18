export interface ILicense {
    aud: string;
    aud_name: string;
    iss: string;
    iss_name: string;
    sub: string;
    sub_name: string;
    exp?: number;
    env: string[];
    custom: Record<string, string>;
}