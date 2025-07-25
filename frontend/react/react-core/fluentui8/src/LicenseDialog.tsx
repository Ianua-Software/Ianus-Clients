import * as React from 'react';

import {
    DefaultButton,
    Dialog,
    DialogFooter,
    DialogType,
    PrimaryButton,
    Text,
    TextField
} from '@fluentui/react';

import { useLicenseContext } from './IanusLicenseStateProvider';
import { acquireLicenses, isDataset, isWebApi } from './IanusGuard';
import { ILicense } from "../../../../ianus-core/License";
import { base64url_decode } from '../../../../ianus-core/LicenseValidation';

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
    onSubmit: () => void;
    onCancel: () => void;
}

export const LicenseDialog: React.FC<ILicenseDialogProps> = ({ publisherId, productId, dataProvider, onCancel, onSubmit }) => {
    const [ licenseState, licenseDispatch ] = useLicenseContext();
    
    const [ submitBlocked, setSubmitBlocked ] = React.useState(true);
    const [ licenseKeyInput, setLicenseKeyInput ] = React.useState(licenseState.license?.licenseKey);
    const [ licenseId, setLicenseId ] = React.useState(licenseState?.license?.licenseId);
    
    React.useEffect(() => {
        (async() => {
            if (!licenseId)
            {
                const licenses = await acquireLicenses(publisherId, productId, dataProvider);

                if (licenses.length > 0)
                {
                    setLicenseId(licenses[0].ian_licenseid);
                }
            }
        })();
    }, [ ]);

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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (dataProvider.records[licenseId] as any).setValue("ian_name", name);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (dataProvider.records[licenseId] as any).setValue("ian_key", licenseKeyInput);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (dataProvider.records[licenseId] as any).save();
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
    };

    return (
        <Dialog
            hidden={false}
            onDismiss={onCancel}
            dialogContentProps={dialogContentProps}
            modalProps={modalProps}
        >
        <TextField label='License Key' value={licenseKeyInput} onChange={(e, v) => { setLicenseKeyInput(v ?? ""); setSubmitBlocked(false); }} required />
        { !!licenseState.license?.licenseClaims &&
            <Text>
                <br />
                <h3>License Information</h3>
                <p>
                    <span style={{fontWeight: 'bold'}}>License Publisher: </span> <span title={licenseState.license?.licenseClaims.pub}>{licenseState.license?.licenseClaims?.pub_meta?.name}</span>
                </p>
                <p>
                    <span style={{fontWeight: 'bold'}}>Licensed Product: </span> <span title={licenseState.license?.licenseClaims.aud}>{licenseState.license?.licenseClaims?.prd_meta?.name}</span>
                </p>
                <p>
                    <span style={{fontWeight: 'bold'}}>Licensed Customer: </span> <span title={licenseState.license?.licenseClaims.sub}>{licenseState.license?.licenseClaims?.sub_meta?.name}</span>
                </p>
                <p>
                    <span style={{fontWeight: 'bold'}}>Licensed Dataverse Environment: </span> <span>{licenseState.license?.licenseClaims?.env?.map(e => `${e.identifier} (${e.name})`).join(", ")}</span>
                </p>                
                <p>
                    <span style={{fontWeight: 'bold'}}>License expires after: </span> <span>{!licenseState.license?.licenseClaims?.exp ? "Never" : new Date(licenseState.license?.licenseClaims.exp * 1000).toISOString()}</span>
                </p>
            </Text>
        }
        <DialogFooter>
          <PrimaryButton onClick={onSubmitClick} text="Submit" disabled={!licenseKeyInput || submitBlocked} />
          <DefaultButton onClick={onCancel} text="Cancel" />
        </DialogFooter>
      </Dialog>
    );
}