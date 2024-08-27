import { MessageBar, MessageBarType, Spinner } from '@fluentui/react';
import * as React from 'react';
import { SecureConfig } from './SecureConfig';
import { IInputs } from '../generated/ManifestTypes';
import { SettingsDialog } from './SettingsDialog';
import { checkLicense } from './LicenseValidation';
import { ILicense } from './License';

export interface IIanusGuardProps {
    pcfContext: ComponentFramework.Context<IInputs>;
    productNameBase64: string;
    publicKeyBase64: string;
    validIssuer: string;
}

export const IanusGuard: React.FC<IIanusGuardProps> = ({ pcfContext, productNameBase64, publicKeyBase64, validIssuer, children }) => {
    const [secureConfig, setSecureConfig] = React.useState<SecureConfig | undefined>(undefined);
    const [dialog, setDialog] = React.useState<React.ReactNode>();
    const [error, setError] = React.useState("");
    
    const productName = React.useMemo(() => atob(productNameBase64), []);
    const publicKey = React.useMemo(() => atob(publicKeyBase64), []);

    const onSettingsFinally = () => {
        setDialog(undefined);
        init();
    };

    const showSettingsDialog = (cfg: SecureConfig, licenseError?: string) => {
        setDialog(<SettingsDialog secureConfig={cfg} pcfContext={pcfContext} onSubmit={onSettingsFinally} onCancel={onSettingsFinally} licenseError={licenseError} />);
    };

    const init = async () => {
        try {
            if (!productName) {
                setError("No product name found, pass a product name as prop!");
                return;
            }

            if (!publicKey) {
                setError("No public key found, pass a valid public key as prop!");
                return;
            }

            const licenses = await pcfContext.webAPI.retrieveMultipleRecords("ian_license", `?$filter=ian_name eq '${productName}' and statecode eq 0`);

            if (!licenses.entities.length) {
                setError("No license found!");
                return;
            }

            if (licenses.entities.length > 1) {
                setError(`Multiple active licenses for '${productName}' found, please make sure there is only one active license`);
                return;
            }

            const license = licenses.entities[0];

            const [errorMessage, licenseClaims] = await checkLicense(validIssuer, productName, (pcfContext as unknown as { orgSettings: { uniqueName: string }}).orgSettings.uniqueName, publicKey, license.ian_key);

            const generatedSecureConfig = {
                configId: license.ian_licenseid,
                licenseKey: license.ian_key,
                licenseClaims: licenseClaims
            };

            if (errorMessage || !licenseClaims) {
                showSettingsDialog(generatedSecureConfig, errorMessage);
            }
            else
            {
                setSecureConfig(generatedSecureConfig);
            }
        }
        catch (e) {
            if (e && e instanceof Error) {
                setError(e?.message ?? e);
            }
        }
    };

    React.useEffect(() => {
        init();
    }, []);

    return secureConfig
        ? ( <> { children } </> )
        : (
            <div style={{ width: pcfContext.mode.allocatedWidth > 0 ? pcfContext.mode.allocatedWidth : undefined, height: pcfContext.mode.allocatedHeight > 0 ? pcfContext.mode.allocatedHeight : undefined }}>
                { dialog }
                <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
                    { !!error &&
                        <MessageBar
                            messageBarType={MessageBarType.error}
                            isMultiline={true}
                            styles={{ root: { marginBottom: "10px" }}}
                            onDismiss={() => setError("")}
                        >
                            An error occured, please try again. Error information: { error }
                        </MessageBar>
                    }
                    { !secureConfig && !error && <Spinner styles={{ root: { width: "auto" }}} label="Loading..." /> }
                </div>
            </div>
        );
};