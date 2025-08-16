import * as React from 'react';

import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { MessageBarButton } from '@fluentui/react/lib/Button';
import { Spinner } from '@fluentui/react/lib/Spinner';

import { validateLicense } from '../../../../../ianus-core/LicenseValidation';
import { LicenseValidationResult } from '../../../../../ianus-core/LicenseValidationResult';

import { LicenseDialog } from './LicenseDialog';
import { useLicenseContext } from './IanusLicenseStateProvider';
import { DataverseLicenseValidationResult } from './DataverseLicenseValidationResult';

export type EnvironmentType = "entra" | "dataverse";

export interface IIanusGuardProps {
    /**
     * The external publisher Guid found on the publisher's Ianus Guard portal form
     */
    publisherId: string;

    /**
     * The external product Guid found on the product's Ianus Guard portal form
     */
    productId: string;

    /**
     * One or multiple public keys, found on the product's Ianus Guard portal form or your own generated public key
     */
    publicKeys: string[];

    /**
     * Type of environment you're currently evaluating against
     */
    environmentType: EnvironmentType;

    /**
     * Identifier for the current environment. For entra this is the Tenant ID, for dataverse this is the Organization ID. For dataverse you can pass the WebApi object to fetch it automatically
     */
    environmentIdentifier: string | ComponentFramework.WebApi;

    /**
     * Data provider for retrieving licenses in the current environment. Either a dataset or the WebApi object
     */
    dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet;

    /**
     * When using user-based licensing, usage permission is derived by having read permission to a defined 'usage-entity'. Pass the result of the license check here, if read is allowed, pass true, otherwise false.
     * Pass null while you're fetching the permission.
     * For canvas apps, use the DataSourceInfo PowerFX function, for PCFs use pcfContext.utils.getEntityMetadata for loading the metadata followed by pcfContext.utils.hasEntityPrivilege for getting the permission result.
     */
    usagePermission?: boolean | null;

    /**
     * Optionally pass a callback which is called when a license validation result was generated
     * 
     * @param result The result of this validation run
     * @returns Returned data will not be processed in any way
     */
    onLicenseValidated?: (result: LicenseValidationResult) => unknown;
}

export const isWebApi = (dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet | string): dataProvider is ComponentFramework.WebApi => {
    return (dataProvider as ComponentFramework.WebApi).retrieveMultipleRecords !== undefined;
};

export const isDataset = (dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet | string): dataProvider is ComponentFramework.PropertyTypes.DataSet => {
    return (dataProvider as ComponentFramework.PropertyTypes.DataSet).records !== undefined;
};

export const acquireLicenses = async (publisherId: string, productId: string, dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet): Promise<ComponentFramework.WebApi.Entity[]> => {
    const licenseIdentifier = `${publisherId}_${productId}`

    if (isWebApi(dataProvider)) {
        const response = await dataProvider.retrieveMultipleRecords("ian_license", `?$filter=ian_identifier eq '${licenseIdentifier}' and statecode eq 0`);
        return response.entities;
    }
    else if (isDataset(dataProvider)) {
        if (dataProvider.records.length) {
            const record = dataProvider.records[0];

            if (record.getNamedReference().etn !== "ian_license") {
                throw new Error("You need to pass the 'ian_license' entity as data source for LicenseDataset when using a dataset as value")
            }
        }

        return Object.values(dataProvider.records)
            .filter(r => r.getValue("ian_identifier") === licenseIdentifier)
            .map(r => ({ ian_licenseid: r.getValue("ian_licenseid"), ian_identifier: r.getValue("ian_identifier"), ian_key: r.getValue("ian_key") } as ComponentFramework.WebApi.Entity));
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

const fetchOrganizationIdFromWebApi = async (webApi: ComponentFramework.WebApi) => {
    const results = await webApi.retrieveMultipleRecords("organization", "?$top=1&$select=organizationid");

    if (!results.entities.length)
    {
        return null;
    }

    const organization = results.entities[0];
    return organization.organizationid;
};

export const IanusGuard: React.FC<IIanusGuardProps> = ({ publisherId, productId, publicKeys, environmentType, environmentIdentifier, dataProvider, usagePermission, onLicenseValidated, children }) => {
    const [ licenseState, licenseDispatch ] = useLicenseContext();

    const onSettingsFinally = () => {
        licenseDispatch({ type: "setLicenseDialogVisible", payload: false });
        initLicenseValidation();
    };

    const runValidation = React.useCallback(async (): Promise<DataverseLicenseValidationResult> => {
        try {
            if (!productId) {
                return {
                    isValid: false,
                    isTerminalError: true,
                    reason: "No productId found, pass a productId as prop!"
                };
            }

            if (!publicKeys || !publicKeys.length) {
                return {
                    isValid: false,
                    isTerminalError: true,
                    reason: "No public key found, pass a valid public key as prop!"
                };
            }

            const licenses = await acquireLicenses(publisherId, productId, dataProvider);

            if (!licenses.length) {
                return {
                    isValid: false,
                    isTerminalError: false,
                    reason: "No license found!"
                };
            }

            if (licenses.length > 1) {
                return {
                    isValid: false,
                    isTerminalError: true,
                    reason: `Multiple active licenses for '${publisherId}_${productId}' found, please make sure there is only one active license`
                };
            }

            const licenseRecord = licenses[0];
            const resolvedEnvironmentIdentifier = ( isWebApi(environmentIdentifier) ? await fetchOrganizationIdFromWebApi(environmentIdentifier) : environmentIdentifier as string );

            const validationResult = await validateLicense(publisherId, productId, environmentType, resolvedEnvironmentIdentifier, publicKeys, licenseRecord.ian_key);

            return {
                ...validationResult,
                licenseId: licenseRecord.ian_licenseid,
                licenseKey: licenseRecord.ian_key,
            };
        }
        catch (e) {
            return {
                isValid: false,
                isTerminalError: true,
                reason: (e as unknown as { message: string })?.message
            };
        }
    }, [dataProvider, environmentIdentifier, environmentType, productId, publicKeys, publisherId]);

    const initLicenseValidation = React.useCallback(async () => {
        const result = await runValidation();
        licenseDispatch({ type: "setLicense", payload: result });

        updateResultIfDefined(result, onLicenseValidated);
    }, [licenseDispatch, onLicenseValidated, runValidation]);

    React.useEffect(() => {
        if ( usagePermission != null && !usagePermission )
        {
            const result: LicenseValidationResult = {
                isValid: false,
                isTerminalError: true,
                reason: "Your user is not enabled for using this product"
            };

            licenseDispatch({ type: "setLicense", payload: result });
            updateResultIfDefined(result, onLicenseValidated);
        }
        else if (!isDataset(dataProvider) || (!dataProvider.error && !dataProvider.loading && dataProvider.paging.totalResultCount >= 0))
        {
            initLicenseValidation();
        }
        else if (dataProvider.error)
        {
            const result: LicenseValidationResult = {
                isValid: false,
                isTerminalError: true,
                reason: `Dataset error: ${dataProvider.errorMessage}`
            };

            licenseDispatch({ type: "setLicense", payload: result });
            updateResultIfDefined(result, onLicenseValidated);
        }
    }, [dataProvider, initLicenseValidation, licenseDispatch, usagePermission, onLicenseValidated]);

    return licenseState.license?.isValid
        ? ( <>
            { licenseState.licenseDialogVisible && <LicenseDialog publisherId={publisherId} productId={productId} dataProvider={dataProvider} onSubmit={onSettingsFinally} onCancel={onSettingsFinally} /> }
            { children }
        </> )
        : (
            <div style={{ display: "flex", width: "100%", height: "100%", flex: "1" }}>
                { licenseState.licenseDialogVisible && <LicenseDialog publisherId={publisherId} productId={productId} dataProvider={dataProvider} onSubmit={onSettingsFinally} onCancel={onSettingsFinally} /> }
                <div style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1}}>
                    { licenseState.license?.isValid === false && (
                        <MessageBar
                            messageBarType={MessageBarType.error}
                            isMultiline={true}
                            styles={{ root: { marginBottom: "10px" }}}
                            onDismiss={() =>
                                {
                                    licenseDispatch({ type: "setLicense", payload: undefined });
                                    initLicenseValidation();
                                }
                            }
                            actions={
                                <div>
                                    { !licenseState.license?.isTerminalError && <MessageBarButton onClick={() => licenseDispatch({ type: "setLicenseDialogVisible", payload: true })}>Set License</MessageBarButton> }
                                </div>
                            }
                        >
                            An error occured, please try again. Error information: { licenseState.license?.reason }
                        </MessageBar>
                    )}
                    { !licenseState.license && <Spinner styles={{ root: { width: "auto" }}} label="Loading..." /> }
                </div>
            </div>
        );
};