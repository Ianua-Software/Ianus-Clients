import { MessageBar, MessageBarButton, MessageBarType, Spinner } from '@fluentui/react';
import * as React from 'react';
import { LicenseData } from './LicenseData';
import { LicenseDialog } from './LicenseDialog';
import { checkLicense } from './LicenseValidation';
import { ILicense } from './License';
import { useLicenseContext } from './IanusLicenseStateProvider';

export interface IIanusGuardProps {
    productNameBase64: string;
    publicKeyBase64: string;
    validIssuer: string;
    environmentInfo: string | ComponentFramework.PropertyTypes.DataSet;
    dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet;
}

export const isWebApi = (dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet | string): dataProvider is ComponentFramework.WebApi => {
    return (dataProvider as ComponentFramework.WebApi).retrieveMultipleRecords !== undefined;
};

export const isDataset = (dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet | string): dataProvider is ComponentFramework.PropertyTypes.DataSet => {
    return (dataProvider as ComponentFramework.PropertyTypes.DataSet).records !== undefined;
};

export const acquireLicenses = async (productName: string, dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet): Promise<ComponentFramework.WebApi.Entity[]> => {
    if (isWebApi(dataProvider)) {
        const response = await dataProvider.retrieveMultipleRecords("ian_license", `?$filter=ian_name eq '${productName}' and statecode eq 0`);
        return response.entities;
    }
    else if (isDataset(dataProvider)) {
        return Object.values(dataProvider.records)
            .filter(r => r.getValue("ian_name") === productName)
            .map(r => dataProvider.columns.reduce((all, cur) => ({...all, [cur.name]: r.getValue(cur.name)}), {} as ComponentFramework.WebApi.Entity))
    }
    else {
        throw new Error(`The 'dataProvider' prop must be either of type ComponentFramework.WebApi or ComponentFramework.PropertyTypes.Dataset. You passed '${typeof dataProvider}'.`)
    }
};

export const IanusGuard: React.FC<IIanusGuardProps> = ({ productNameBase64, publicKeyBase64, validIssuer, environmentInfo, dataProvider, children }) => {
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

            const licenses = await acquireLicenses(productName, dataProvider);

            if (!licenses.length) {
                licenseDispatch({ type: "setLicenseError", payload: "No license found!" });
                return;
            }

            if (licenses.length > 1) {
                licenseDispatch({ type: "setLicenseError", payload: `Multiple active licenses for '${productName}' found, please make sure there is only one active license` });
                return;
            }

            const license = licenses[0];

            const [errorMessage, licenseClaims] = await checkLicense(validIssuer, productName, environmentInfo, publicKey, license.ian_key);

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
    }, [ isDataset(dataProvider) ? dataProvider.loading : dataProvider ]);

    return licenseState.license
        ? ( <>
            { licenseState.licenseDialogVisible && <LicenseDialog productName={productName} dataProvider={dataProvider} onSubmit={onSettingsFinally} onCancel={onSettingsFinally} /> }
            { children }</> 
        )
        : (
            <div style={{ display: "flex", width: "100%", height: "100%" }}>
                { licenseState.licenseDialogVisible && <LicenseDialog productName={productName} dataProvider={dataProvider} onSubmit={onSettingsFinally} onCancel={onSettingsFinally} /> }
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