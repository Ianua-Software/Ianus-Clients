import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { MessageBarButton } from '@fluentui/react/lib/Button';
import { Spinner } from '@fluentui/react/lib/Spinner';
import * as React from 'react';
import { LicenseData } from './LicenseData';
import { LicenseDialog } from './LicenseDialog';
import { checkLicense } from './LicenseValidation';
import { ILicense } from './License';
import { useLicenseContext } from './IanusLicenseStateProvider';
import { LicenseValidationResult } from './LicenseValidationResult';

export interface IIanusGuardProps {
    issuerIdentifier: string;
    productIdentifier: string;
    publicKey: string;
    environmentInfo: string | ComponentFramework.PropertyTypes.DataSet;
    dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet;
    onLicenseValidated?: (result: LicenseValidationResult) => unknown;
}

export const isWebApi = (dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet | string): dataProvider is ComponentFramework.WebApi => {
    return (dataProvider as ComponentFramework.WebApi).retrieveMultipleRecords !== undefined;
};

export const isDataset = (dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet | string): dataProvider is ComponentFramework.PropertyTypes.DataSet => {
    return (dataProvider as ComponentFramework.PropertyTypes.DataSet).records !== undefined;
};

export const acquireLicenses = async (issuer: string, product: string, dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet): Promise<ComponentFramework.WebApi.Entity[]> => {
    const licenseIdentifier = `${issuer}-${product}`

    if (isWebApi(dataProvider)) {
        const response = await dataProvider.retrieveMultipleRecords("ian_license", `?$filter=ian_identifier eq '${licenseIdentifier}' and statecode eq 0`);
        return response.entities;
    }
    else if (isDataset(dataProvider)) {
        return Object.values(dataProvider.records)
            .filter(r => r.getValue("ian_identifier") === licenseIdentifier)
            .map(r => dataProvider.columns.reduce((all, cur) => ({...all, [cur.name]: r.getValue(cur.name)}), {} as ComponentFramework.WebApi.Entity))
    }
    else {
        throw new Error(`The 'dataProvider' prop must be either of type ComponentFramework.WebApi or ComponentFramework.PropertyTypes.Dataset. You passed '${typeof dataProvider}'.`)
    }
};

const updateResultIfDefined = ( result: LicenseValidationResult, onLicenseValidated: ( ( result: LicenseValidationResult ) => unknown ) | undefined ) => {
    if (onLicenseValidated) {
        try
        {
            onLicenseValidated(result);
        }
        catch( e ) {
            if (e && e instanceof Error) {
                console.error(`Error while calling onLicenseValidated: '${e.message}'`);
            }
        }
    }
};

export const IanusGuard: React.FC<IIanusGuardProps> = ({ issuerIdentifier, productIdentifier, publicKey, environmentInfo, dataProvider, onLicenseValidated, children }) => {
    const [ licenseState, licenseDispatch ] = useLicenseContext();

    const onSettingsFinally = () => {
        licenseDispatch({ type: "setLicenseDialogVisible", payload: false });
        initLicenseValidation();
    };

    const validateLicense = async (): Promise<boolean> => {
        try {
            if (!productIdentifier) {
                licenseDispatch({ type: "setLicenseError", payload: "No product name found, pass a product name as prop!" });
                return false;
            }

            if (!publicKey) {
                licenseDispatch({ type: "setLicenseError", payload: "No public key found, pass a valid public key as prop!" });
                return false;
            }

            const licenses = await acquireLicenses(issuerIdentifier, productIdentifier, dataProvider);

            if (!licenses.length) {
                licenseDispatch({ type: "setLicenseError", payload: "No license found!" });
                return false;
            }

            if (licenses.length > 1) {
                licenseDispatch({ type: "setLicenseError", payload: `Multiple active licenses for '${issuerIdentifier}-${productIdentifier}' found, please make sure there is only one active license` });
                return false;
            }

            const license = licenses[0];

            const [errorMessage, licenseClaims] = await checkLicense(issuerIdentifier, productIdentifier, environmentInfo, publicKey, license.ian_key);

            if (errorMessage || !licenseClaims) {
                licenseDispatch({ type: "setLicenseError", payload: errorMessage || "No license claims found!" });
                return false;
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
                return true;
            }
        }
        catch (e) {
            if (e && e instanceof Error) {
                licenseDispatch({ type: "setLicenseError", payload: e?.message ?? e });
            }

            return false;
        }
    };

    const initLicenseValidation = async () => {
        const result = await validateLicense();

        updateResultIfDefined({ isValid: result }, onLicenseValidated);
    };

    React.useEffect(() => {
        if (
            (!isDataset(dataProvider) || (!dataProvider.error && !dataProvider.loading))
            && (!isDataset(environmentInfo) || (!environmentInfo.error && !environmentInfo.loading))
        )
        {
            initLicenseValidation();
        }
    }, [
        isDataset(dataProvider) ? dataProvider.sortedRecordIds.length : dataProvider,
        isDataset(environmentInfo) ? environmentInfo.sortedRecordIds.length : environmentInfo
    ]);

    return licenseState.license
        ? ( <>
            { licenseState.licenseDialogVisible && <LicenseDialog issuerIdentifier={issuerIdentifier} productIdentifier={productIdentifier} dataProvider={dataProvider} onSubmit={onSettingsFinally} onCancel={onSettingsFinally} /> }
            { children }
        </> )
        : (
            <div style={{ display: "flex", width: "100%", height: "100%", flex: "1" }}>
                { licenseState.licenseDialogVisible && <LicenseDialog issuerIdentifier={issuerIdentifier} productIdentifier={productIdentifier} dataProvider={dataProvider} onSubmit={onSettingsFinally} onCancel={onSettingsFinally} /> }
                <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1}}>
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