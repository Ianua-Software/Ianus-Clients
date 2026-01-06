import * as React from 'react';

import { MessageBar, MessageBarType } from '@fluentui/react/lib/MessageBar';
import { MessageBarButton } from '@fluentui/react/lib/Button';
import { Spinner } from '@fluentui/react/lib/Spinner';

import { validateLicense } from '../../../../../ianus-core/LicenseValidation';
import { LicenseValidationResult } from '../../../../../ianus-core/LicenseValidationResult';

import { LicenseDialog } from './LicenseDialog';
import { useLicenseContext } from './IanusLicenseStateProvider';
import { DataverseLicenseValidationResult } from './DataverseLicenseValidationResult';
import { DebugDialog } from './DebugDialog';

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
     * Data provider for retrieving licenses in the current environment. Only needed in canvas apps. PCFs can query offline data using the primary (webAPI) data provider.
     */
    offlineDataProvider?: ComponentFramework.PropertyTypes.DataSet;

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
    return (dataProvider as ComponentFramework.WebApi)?.retrieveMultipleRecords !== undefined;
};

export const isDataset = (dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet | string): dataProvider is ComponentFramework.PropertyTypes.DataSet => {
    return (dataProvider as ComponentFramework.PropertyTypes.DataSet)?.sortedRecordIds !== undefined;
};

export const acquireLicenses = async (publisherId: string, productId: string, dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet): Promise<ComponentFramework.WebApi.Entity[]> => {
    const licenseIdentifier = `${publisherId}_${productId}`

    if (isWebApi(dataProvider)) {
        const response = await dataProvider.retrieveMultipleRecords("ian_license", `?$filter=ian_identifier eq '${licenseIdentifier}' and statecode eq 0`);
        return response.entities;
    }
    else if (isDataset(dataProvider)) {
        const recordValues = Object.values(dataProvider.records ?? {});

        if (recordValues.length) {
            const record = recordValues[0];
            const recordReference = record.getNamedReference();

            if (recordReference.etn && recordReference.etn !== "ian_license") {
                throw new Error("You need to pass the 'ian_license' entity as data source for LicenseDataset when using a dataset as value")
            }
        }

        return recordValues
            .filter(r => r.getValue("ian_identifier") === licenseIdentifier)
            .map(r => ({ ian_licenseid: r.getValue("ian_licenseid"), ian_identifier: r.getValue("ian_identifier"), ian_key: r.getValue("ian_key") } as ComponentFramework.WebApi.Entity));
    }
    else {
        throw new Error(`The 'dataProvider' prop must be either of type ComponentFramework.WebApi or ComponentFramework.PropertyTypes.Dataset. You passed '${typeof dataProvider}'.`)
    }
};

const fetchOrganizationIdFromWebApi = async (webApi: ComponentFramework.WebApi) => {
    const results = await webApi.retrieveMultipleRecords("organization", "?$top=1&$select=organizationid");

    if (!results.entities.length)
    {
        return null;
    }

    const organization = results.entities[0];
    return organization.organizationid.replace("{", "").replace("}", "").toLowerCase();
};

export const IanusGuard: React.FC<IIanusGuardProps> = ({ publisherId, productId, publicKeys, environmentType, environmentIdentifier, dataProvider, offlineDataProvider, usagePermission, onLicenseValidated, children }) => {
    const [ licenseState, licenseDispatch ] = useLicenseContext();

    // Stabilize callback references
    const onLicenseValidatedRef = React.useRef(onLicenseValidated);
    React.useEffect(() => {
        onLicenseValidatedRef.current = onLicenseValidated;
    }, [onLicenseValidated]);

    // Stabilize publicKeys array reference
    const publicKeysRef = React.useRef(publicKeys);
    React.useEffect(() => {
        if (JSON.stringify(publicKeys) !== JSON.stringify(publicKeysRef.current))
        {
            publicKeysRef.current = publicKeys;
        }
    }, [publicKeys]);

    const resolvedEnvironmentIdentifierRef = React.useRef<string | null>(null);
    const preventAutomaticReevaluation = React.useRef<boolean>(false);

    const handleValidationResult = React.useCallback((result: DataverseLicenseValidationResult) =>
    {
        preventAutomaticReevaluation.current = result?.isValid ?? false;

        if (onLicenseValidatedRef.current)
        {
            try
            {
                onLicenseValidatedRef.current(result);
            }
            catch (e)
            {
                if (e && e instanceof Error)
                {
                    console.error(`Error while calling onLicenseValidated: '${e.message}'`);
                }
            }
        }
    }, [] );

    const runValidation = React.useCallback(async (): Promise<DataverseLicenseValidationResult> => {
        try
        {
            // Resolve environment identifier (cache it)
            if (resolvedEnvironmentIdentifierRef.current === null) {
                resolvedEnvironmentIdentifierRef.current = isWebApi(environmentIdentifier) 
                    ? await fetchOrganizationIdFromWebApi(environmentIdentifier) 
                    : (environmentIdentifier as string)?.replace("{", "").replace("}", "").toLowerCase();
            }

            if (!resolvedEnvironmentIdentifierRef.current) {
                return {
                    isValid: false,
                    isTerminalError: true,
                    reason: `Failed to determine current environment identifier!`
                };
            }

            if (!productId)
            {
                return {
                    isValid: false,
                    isTerminalError: true,
                    reason: "No productId found, pass a productId as prop!"
                };
            }

            if (!publicKeysRef.current || !publicKeysRef.current.length) {
                return {
                    isValid: false,
                    isTerminalError: true,
                    reason: "No public key found, pass a valid public key as prop!"
                };
            }

            const onlineLicenses = await acquireLicenses(publisherId, productId, dataProvider);
            const offlineLicenses = offlineDataProvider != null ? await acquireLicenses(publisherId, productId, offlineDataProvider) : [];

            const licenses = onlineLicenses.length ? onlineLicenses : offlineLicenses;

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
                    reason: `Multiple active licenses for '${publisherId}_${productId}' found, please make sure there is only one active license. If on mobile canvas app, check for data updates in the device status / connection dialog and then clear cache.`
                };
            }

            const licenseRecord = licenses[0];
            const validationResult = await validateLicense(publisherId, productId, environmentType, resolvedEnvironmentIdentifierRef.current, publicKeysRef.current, licenseRecord.ian_key);

            return {
                ...validationResult,
                licenseId: licenseRecord.ian_licenseid,
                licenseKey: licenseRecord.ian_key,
            };
        }
        catch (e)
        {
            return {
                isValid: false,
                isTerminalError: true,
                reason: (e as unknown as { message: string })?.message
            };
        }
    }, [dataProvider, environmentIdentifier, environmentType, offlineDataProvider, productId, publisherId]);

    const initLicenseValidation = React.useCallback(async () => {
        const result = await runValidation();
        licenseDispatch({ type: "setLicense", payload: result });

        handleValidationResult(result);
    }, [licenseDispatch, runValidation, handleValidationResult]);

    const onLicenseDialogFinally = React.useCallback(() => {
        licenseDispatch({ type: "setLicenseDialogVisible", payload: false });
        initLicenseValidation();
    }, [initLicenseValidation, licenseDispatch]);

    const onDebugFinally = React.useCallback(() => {
        licenseDispatch({ type: "setDebugDialogVisible", payload: false });
    }, [licenseDispatch]);

    const dataTotalResultCount = isDataset(dataProvider)
        ? dataProvider.paging.totalResultCount
        : undefined;

    const dataIsLoading = isDataset(dataProvider)
        ? dataProvider.loading
        : undefined;

    const dataHasError = isDataset(dataProvider)
        ? dataProvider.error
        : undefined;

    const dataProviderState = React.useMemo(() =>
    {
        if (!isDataset(dataProvider))
        {
            return "webapi";
        }
        else
        {
            return `dataset-${dataTotalResultCount}-${dataIsLoading}-${dataHasError}`;
        }
    }, [dataProvider, dataHasError, dataIsLoading, dataTotalResultCount]);

    const offlineDataTotalResultCount = offlineDataProvider != null
        ? offlineDataProvider.paging.totalResultCount
        : undefined;

    const offlineDataIsLoading = offlineDataProvider != null
        ? offlineDataProvider.loading
        : undefined;

    const offlineDataHasError = offlineDataProvider != null
        ? offlineDataProvider.error
        : undefined;

    const offlineDataProviderState = React.useMemo(() =>
    {
        if (offlineDataProvider == null)
        {
            return "unused"
        }
        else
        {
            return `dataset-${offlineDataTotalResultCount}-${offlineDataIsLoading}-${offlineDataHasError}`;
        }
    }, [offlineDataHasError, offlineDataIsLoading, offlineDataProvider, offlineDataTotalResultCount]);

    const dataProviderSignature = React.useMemo(() => {
        if (isDataset(dataProvider) && dataProvider.records) {
            return Object.values(dataProvider.records)
                .map(r => `${r.getRecordId()}-${r.getValue("ian_identifier")}-${r.getValue("ian_key")}`)
                .join("|");
        }
        return "";
    }, [dataProvider]);

    const offlineDataProviderSignature = React.useMemo(() => {
        if (offlineDataProvider && offlineDataProvider.records) {
            return Object.values(offlineDataProvider.records)
                .map(r => `${r.getRecordId()}-${r.getValue("ian_identifier")}-${r.getValue("ian_key")}`)
                .join("|");
        }
        return "";
    }, [offlineDataProvider]);

    // Make sure that automatic reevaluation is only reset when using at least one dataset as dataprovider
    const canResetAutomaticReevaluation = React.useMemo(() => {
        return isDataset(dataProvider) || offlineDataProvider != null;
    }, [dataProvider, offlineDataProvider]);

    // On change of dataprovider signature or offlinedataprovider signature, allow reevaluation
    React.useEffect(() => {
        if (canResetAutomaticReevaluation) {
            preventAutomaticReevaluation.current = false;
        }
    }, [canResetAutomaticReevaluation, dataProviderSignature, offlineDataProviderSignature]);

    React.useEffect(() => {
        if (preventAutomaticReevaluation.current)
        {
            console.log(`Skipping license evaluation as checks have already passed at ${new Date().toISOString()}`);
            return;
        }

        console.log(`Starting license evaluation at ${new Date().toISOString()}`);
        console.log(`DataProvider state: ${dataProviderState}`);
        console.log(`DataProvider signature: ${dataProviderSignature}`);
        console.log(`Offline DataProvider state: ${offlineDataProviderState}`);
        console.log(`Offline DataProvider signature: ${offlineDataProviderSignature}`);

        if ( usagePermission != null && !usagePermission )
        {
            const result: LicenseValidationResult = {
                isValid: false,
                isTerminalError: true,
                reason: "Your user is not enabled for using this product"
            };

            licenseDispatch({ type: "setLicense", payload: result });
            handleValidationResult(result);
        }
        else if (!isDataset(dataProvider)
            || (!dataProvider.error && !dataProvider.loading && dataProvider.paging.totalResultCount >= 0)
            || (offlineDataProvider != null && !offlineDataProvider.error && !offlineDataProvider.loading && offlineDataProvider.paging.totalResultCount >= 0)
        )
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
            handleValidationResult(result);
        }
    }, [dataProvider, dataProviderState, dataProviderSignature, initLicenseValidation, licenseDispatch, usagePermission, offlineDataProvider, offlineDataProviderState, offlineDataProviderSignature, handleValidationResult]);

    return licenseState.license?.isValid
        ? ( <>
            { licenseState.licenseDialogVisible && <LicenseDialog publisherId={publisherId} productId={productId} dataProvider={dataProvider} offlineDataProvider={offlineDataProvider} onSubmit={onLicenseDialogFinally} onCancel={onLicenseDialogFinally} /> }
            { children }
        </> )
        : (
            <div style={{ display: "flex", width: "100%", height: "100%", flex: "1" }}>
                { licenseState.licenseDialogVisible && <LicenseDialog publisherId={publisherId} productId={productId} dataProvider={dataProvider} offlineDataProvider={offlineDataProvider} onSubmit={onLicenseDialogFinally} onCancel={onLicenseDialogFinally} /> }
                { licenseState.debugDialogVisible && <DebugDialog publisherId={publisherId} productId={productId} environmentType={environmentType} environmentIdentifier={resolvedEnvironmentIdentifierRef.current || ""} dataProvider={dataProvider} offlineDataProvider={offlineDataProvider} onDismiss={onDebugFinally} /> }
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
                                    { !licenseState.license?.isTerminalError && <MessageBarButton onClick={() => licenseDispatch({ type: "setDebugDialogVisible", payload: true })}>Debug</MessageBarButton> }
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