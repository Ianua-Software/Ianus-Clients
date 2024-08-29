import { MessageBar, MessageBarButton, MessageBarType, Spinner } from '@fluentui/react';
import * as React from 'react';
import { LicenseData } from './LicenseData';
import { IInputs } from '../generated/ManifestTypes';
import { LicenseDialog } from './LicenseDialog';
import { checkLicense } from './LicenseValidation';
import { ILicense } from './License';
import { useLicenseContext } from './IanusLicenseStateProvider';

export interface IIanusGuardProps {
    productNameBase64: string;
    publicKeyBase64: string;
    validIssuer: string;
    orgUniqueName: string;
    webAPI: ComponentFramework.WebApi;
}

export const IanusGuard: React.FC<IIanusGuardProps> = ({ productNameBase64, publicKeyBase64, validIssuer, orgUniqueName, webAPI, children }) => {
    const [ licenseState, licenseDispatch ] = useLicenseContext();

    const productName = React.useMemo(() => atob(productNameBase64), []);
    const publicKey = React.useMemo(() => atob(publicKeyBase64), []);

    const onSettingsFinally = () => {
        licenseDispatch({ type: "setLicenseDialogVisible", payload: false });
        init();
    };

    const init = async () => {
        try {
            if (!productName) {
                licenseDispatch({ type: "setLicenseError", payload: "No product name found, pass a product name as prop!" });
                return;
            }

            if (!publicKey) {
                licenseDispatch({ type: "setLicenseError", payload: "No public key found, pass a valid public key as prop!" });
                return;
            }

            const licenses = await webAPI.retrieveMultipleRecords("ian_license", `?$filter=ian_name eq '${productName}' and statecode eq 0`);

            if (!licenses.entities.length) {
                licenseDispatch({ type: "setLicenseError", payload: "No license found!" });
                return;
            }

            if (licenses.entities.length > 1) {
                licenseDispatch({ type: "setLicenseError", payload: `Multiple active licenses for '${productName}' found, please make sure there is only one active license` });
                return;
            }

            const license = licenses.entities[0];

            const [errorMessage, licenseClaims] = await checkLicense(validIssuer, productName, orgUniqueName, publicKey, license.ian_key);

            if (errorMessage || !licenseClaims) {
                licenseDispatch({ type: "setLicenseError", payload: errorMessage || "No license claims found!" });
            }
            else
            {
                const licenseData: LicenseData = {
                    licenseId: license.ian_licenseid,
                    licenseKey: license.ian_key,
                    licenseClaims: licenseClaims
                };

                licenseDispatch({ type: "setLicense", payload: licenseData });
                licenseDispatch({ type: "setLicenseError", payload: "" });
            }
        }
        catch (e) {
            if (e && e instanceof Error) {
                licenseDispatch({ type: "setLicenseError", payload: e?.message ?? e });
            }
        }
    };

    React.useEffect(() => {
        init();
    }, []);

    return licenseState.license
        ? ( <>
            { licenseState.licenseDialogVisible && <LicenseDialog productName={productName} webAPI={webAPI} onSubmit={onSettingsFinally} onCancel={onSettingsFinally} /> }
            { children }</> 
        )
        : (
            <div style={{ display: "flex", width: "100%", height: "100%" }}>
                { licenseState.licenseDialogVisible && <LicenseDialog productName={productName} webAPI={webAPI} onSubmit={onSettingsFinally} onCancel={onSettingsFinally} /> }
                <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
                    { !!licenseState.licenseError &&
                        <MessageBar
                            messageBarType={MessageBarType.error}
                            isMultiline={true}
                            styles={{ root: { marginBottom: "10px" }}}
                            onDismiss={() => licenseDispatch({ type: "setLicenseError", payload: "" })}
                            actions={
                                <div>
                                    <MessageBarButton onClick={() => licenseDispatch({ type: "setLicenseDialogVisible", payload: true })}>Set License</MessageBarButton>
                                </div>
                            }
                        >
                            An error occured, please try again. Error information: { licenseState.licenseError }
                        </MessageBar>
                    }
                    { !licenseState.license && !licenseState.licenseError && <Spinner styles={{ root: { width: "auto" }}} label="Loading..." /> }
                </div>
            </div>
        );
};