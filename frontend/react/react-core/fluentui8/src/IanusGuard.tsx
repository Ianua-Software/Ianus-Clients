import * as React from 'react';

import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { MessageBarButton } from '@fluentui/react/lib/Button';
import { Spinner } from '@fluentui/react/lib/Spinner';

import { validateLicense } from '../../../../ianus-core/LicenseValidation';
import { LicenseValidationResult } from '../../../../ianus-core/LicenseValidationResult';

import { LicenseData } from './LicenseData';
import { LicenseDialog } from './LicenseDialog';
import { useLicenseContext } from './IanusLicenseStateProvider';

export interface IIanusGuardProps {
    publisherId: string;
    productId: string;
    publicKey: string;
    organizationId: string | ComponentFramework.PropertyTypes.DataSet;
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

const extractOrganizationIdFromDataset = (dataset: ComponentFramework.PropertyTypes.DataSet) => {
    const records = Object.values(dataset.records);

    if (records.length) {
        const record = records[0];

        if (record.getNamedReference().etn !== "organization") {
            throw new Error("You need to pass the 'organization' entity as data source for organizationId when using a dataset as value")
        }

        return record.getValue("organizationid") as string;
    }

    return "";
};

export const IanusGuard: React.FC<IIanusGuardProps> = ({ publisherId, productId, publicKey, organizationId, dataProvider, onLicenseValidated, children }) => {
    const [ licenseState, licenseDispatch ] = useLicenseContext();

    const onSettingsFinally = () => {
        licenseDispatch({ type: "setLicenseDialogVisible", payload: false });
        initLicenseValidation();
    };

    const runValidation = async (): Promise<LicenseValidationResult> => {
        try {
            if (!productId) {
                licenseDispatch({ type: "setLicenseError", payload: "No productId found, pass a productId as prop!" });
                return {
                    isValid: false,
                    reason: "No productId found, pass a productId as prop!"
                };
            }

            if (!publicKey) {
                licenseDispatch({ type: "setLicenseError", payload: "No public key found, pass a valid public key as prop!" });
                return {
                    isValid: false,
                    reason: "No public key found, pass a valid public key as prop!"
                };
            }

            const licenses = await acquireLicenses(publisherId, productId, dataProvider);

            if (!licenses.length) {
                licenseDispatch({ type: "setLicenseError", payload: "No license found!" });
                return {
                    isValid: false,
                    reason: "No license found!"
                };
            }

            if (licenses.length > 1) {
                licenseDispatch({ type: "setLicenseError", payload: `Multiple active licenses for '${publisherId}-${productId}' found, please make sure there is only one active license` });
                return {
                    isValid: false,
                    reason: `Multiple active licenses for '${publisherId}-${productId}' found, please make sure there is only one active license`
                };
            }

            const licenseRecord = licenses[0];

            const resolvedOrganizationId = isDataset(organizationId)
            ? extractOrganizationIdFromDataset(organizationId)
            : organizationId as string;

            const validationResult = await validateLicense(publisherId, productId, "dataverse", resolvedOrganizationId, publicKey, licenseRecord.ian_key);

            if ( !validationResult.isValid ) {
                licenseDispatch({ type: "setLicenseError", payload: validationResult.reason || "No license claims found!" });
                return validationResult;
            }
            else
            {
                const licenseData: LicenseData = {
                    licenseId: licenseRecord.ian_licenseid,
                    licenseKey: licenseRecord.ian_key,
                    licenseClaims: validationResult.license
                };

                licenseDispatch({ type: "setLicense", payload: licenseData });
                licenseDispatch({ type: "setLicenseError", payload: "" });
                return validationResult;
            }
        }
        catch (e) {
            licenseDispatch({ type: "setLicenseError", payload: (e as unknown as { message: string })?.message ?? e });

            return {
                isValid: false,
                reason: (e as unknown as { message: string })?.message
            };
        }
    };

    const initLicenseValidation = async () => {
        const result = await runValidation();

        updateResultIfDefined(result, onLicenseValidated);
    };

    React.useEffect(() => {
        if (
            (!isDataset(dataProvider) || (!dataProvider.error && !dataProvider.loading))
            && (!isDataset(organizationId) || (!organizationId.error && !organizationId.loading))
        )
        {
            initLicenseValidation();
        }
    }, [
        isDataset(dataProvider) ? dataProvider.sortedRecordIds.length : dataProvider,
        isDataset(organizationId) ? organizationId.sortedRecordIds.length : organizationId
    ]);

    return licenseState.license
        ? ( <>
            { licenseState.licenseDialogVisible && <LicenseDialog publisherId={publisherId} productId={productId} dataProvider={dataProvider} onSubmit={onSettingsFinally} onCancel={onSettingsFinally} /> }
            { children }
        </> )
        : (
            <div style={{ display: "flex", width: "100%", height: "100%", flex: "1" }}>
                { licenseState.licenseDialogVisible && <LicenseDialog publisherId={publisherId} productId={productId} dataProvider={dataProvider} onSubmit={onSettingsFinally} onCancel={onSettingsFinally} /> }
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