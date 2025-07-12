export interface IMeta {
    name: string;
}

export interface ILicense {
    jti: string;
    iss: string;
    aud: string;
    isv: string;
    prd: string;
    sub: string;
    env: string[];
    required_roles: string[];
    iat: number;
    nbf: number;
    exp?: number;
    custom: Record<string, any>;
    iss_meta: IMeta;
    aud_meta: IMeta;
    isv_meta: IMeta;
    prd_meta: IMeta;
    sub_meta: IMeta;
    env_meta: Record<string, IMeta>;
    ver: string;
}