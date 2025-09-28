import * as React from 'react';

import {
    DefaultButton,
    Dialog,
    DialogFooter,
    DialogType,
    MessageBar,
    MessageBarType,
    PrimaryButton,
    Text,
    TextField
} from '@fluentui/react';

import { useLicenseContext } from './IanusLicenseStateProvider';
import { acquireLicenses, isDataset, isWebApi } from './IanusGuard';
import { base64url_decode } from '../../../../../ianus-core/LicenseValidation';

const modalProps = {
    isBlocking: false,
    styles: { main: { maxWidth: 600 } },
};

const dialogContentProps = {
    type: DialogType.largeHeader,
    title: 'License'
};

export interface ILicenseDialogProps {
    publisherId: string;
    productId: string;
    dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet;
    offlineDataProvider?: ComponentFramework.PropertyTypes.DataSet;
    onSubmit: () => void;
    onCancel: () => void;
}

export const LicenseDialog: React.FC<ILicenseDialogProps> = ({ publisherId, productId, dataProvider, offlineDataProvider, onCancel, onSubmit }) => {
    const [ licenseState, licenseDispatch ] = useLicenseContext();
    
    const [ submitBlocked, setSubmitBlocked ] = React.useState(true);
    const [ licenseKeyInput, setLicenseKeyInput ] = React.useState(licenseState.license?.licenseKey);
    const [ licenseId, setLicenseId ] = React.useState(licenseState?.license?.licenseId);
    const [ error, setError ] = React.useState("");
    
    React.useEffect(() => {
        (async() => {
            if (!licenseId)
            {
                const onlineLicenses = await acquireLicenses(publisherId, productId, dataProvider);
                const offlineLicenses = offlineDataProvider != null ? await acquireLicenses(publisherId, productId, offlineDataProvider) : [];
    
                const licenses = onlineLicenses.length ? onlineLicenses : offlineLicenses;

                if (licenses.length > 0)
                {
                    setLicenseId(licenses[0].ian_licenseid);
                }
            }
        })();
    }, [dataProvider, licenseId, offlineDataProvider, productId, publisherId]);

    const tryToExtractDisplayNames = ( licenseKey?: string ) =>
    {
        if (!licenseKey)
        {
            return null;
        }

        const split = licenseKey.split(".");

        if (split.length != 3)
        {
            return null;
        }

        const body = split[1];

        try
        {
            const plainClaims = new TextDecoder("utf-8").decode(base64url_decode(body));
            const claimsJson = JSON.parse(plainClaims);

            if (claimsJson?.pub_meta?.name && claimsJson.prd_meta?.name)
            {
                return {
                    publisher: claimsJson.pub_meta.name,
                    product: claimsJson.prd_meta.name
                };
            }
            else
            {
                return null;
            }
        }
        catch
        {
            return null;
        }
    }

    const onSubmitClick = async () => {
        try
        {
            setSubmitBlocked( true );

            const displayNames = tryToExtractDisplayNames(licenseKeyInput);
            const name = `${displayNames?.publisher ?? publisherId} - ${displayNames?.product ?? productId}`;
            const identifier = `${publisherId}_${productId}`;

            if (licenseId) {
                if (isWebApi(dataProvider)) {
                    await dataProvider.updateRecord(
                        "ian_license",
                        licenseId,
                        {
                            "ian_name": name,
                            "ian_key": licenseKeyInput
                        }
                    );
                }
                else if (isDataset(dataProvider)) {
                    if (dataProvider.records[licenseId])
                    {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        await (dataProvider.records[licenseId] as any).setValue("ian_name", name);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        await (dataProvider.records[licenseId] as any).setValue("ian_key", licenseKeyInput);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        await (dataProvider.records[licenseId] as any).save();
                    }
                    // In this case, Ianus Guard is configured for offline access where the dataset contains no data
                    // Therefore we have to do an insertion and have the plugin deprecate the existing license
                    else
                    {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const newLicense = await (dataProvider as any).newRecord();

                        // When creating as update, we only set the key.
                        // The rest is handled by the ExtractInformationFromKey plugin.
                        await newLicense.setValue("ian_key", licenseKeyInput);

                        await newLicense.save();
                    }
                }
            }
            else {
                if (isWebApi(dataProvider)) {
                    await dataProvider.createRecord(
                        "ian_license",
                        {
                            "ian_name": name,
                            "ian_identifier": identifier,
                            "ian_key": licenseKeyInput
                        }
                    );
                }
                else if (isDataset(dataProvider)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const newLicense = await (dataProvider as any).newRecord();

                    await newLicense.setValue("ian_name", name);
                    await newLicense.setValue("ian_identifier", identifier);
                    await newLicense.setValue("ian_key", licenseKeyInput);
                    await newLicense.save();
                }
            }

            onSubmit();
        }
        catch(e)
        {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setError((e as any)?.message ?? JSON.stringify(e));
        }
        finally
        {
            setSubmitBlocked(false);
        }
    };

    return (
        <Dialog
            hidden={!licenseState?.licenseDialogVisible}
            onDismiss={onCancel}
            dialogContentProps={dialogContentProps}
            modalProps={modalProps}
        >
            { error && (
                <MessageBar
                    messageBarType={MessageBarType.error}
                    isMultiline={true}
                    styles={{ root: { marginBottom: "10px" }}}
                    onDismiss={() => { setError(""); }}
                >
                    An error occured, please try again. Error information: { error }
                </MessageBar>
            )}
            <TextField label='License Key' value={licenseKeyInput} onChange={(e, v) => { setLicenseKeyInput(v ?? ""); setSubmitBlocked(false); }} required />
            { !!licenseState.license?.isValid &&
                <Text>
                    <br />
                    <h3>License Information</h3>
                    <p>
                        <span style={{fontWeight: 'bold'}}>License Publisher: </span> <span title={licenseState.license?.claims?.pub}>{licenseState.license?.claims?.pub_meta?.name}</span>
                    </p>
                    <p>
                        <span style={{fontWeight: 'bold'}}>Licensed Product: </span> <span title={licenseState.license?.claims.aud}>{licenseState.license?.claims?.prd_meta?.name}</span>
                    </p>
                    <p>
                        <span style={{fontWeight: 'bold'}}>Licensed Customer: </span> <span title={licenseState.license?.claims.sub}>{licenseState.license?.claims?.sub_meta?.name}</span>
                    </p>
                    <p>
                        <span style={{fontWeight: 'bold'}}>Licensed Dataverse Environment: </span> <span>{licenseState.license?.claims?.env?.map(e => `${e.identifier} (${e.name})`).join(", ")}</span>
                    </p>                
                    <p>
                        <span style={{fontWeight: 'bold'}}>License expires after: </span> <span>{!licenseState.license?.claims?.exp ? "Never" : new Date(licenseState.license?.claims.exp * 1000).toISOString()}</span>
                    </p>
                    {
                        licenseState.license?.claims?.cus &&
                            <p>
                                <span style={{fontWeight: 'bold'}}>Custom claims: </span> <span>{JSON.stringify(licenseState.license.claims.cus)}</span>
                            </p>
                    }
                </Text>
            }
        <DialogFooter>
          <PrimaryButton onClick={onSubmitClick} text="Submit" disabled={!licenseKeyInput || submitBlocked} />
          <DefaultButton onClick={onCancel} text="Cancel" />
        </DialogFooter>
      </Dialog>
    );
}