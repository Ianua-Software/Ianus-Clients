import {
    DefaultButton,
    Dialog,
    DialogFooter,
    DialogType,
    FontIcon,
    PrimaryButton,
    Text,
    TextField
} from '@fluentui/react';
import * as React from 'react';
import { useLicenseContext } from './IanusLicenseStateProvider';
import { acquireLicenses, isDataset, isWebApi } from './IanusGuard';

const modalProps = {
    isBlocking: false,
    styles: { main: { maxWidth: 600 } },
};

const dialogContentProps = {
    type: DialogType.largeHeader,
    title: 'License'
};

export interface ILicenseDialogProps {
    productName: string;
    dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet;
    onSubmit: () => void;
    onCancel: () => void;
}

export const LicenseDialog: React.FC<ILicenseDialogProps> = ({ productName, dataProvider, onCancel, onSubmit }) => {
    const [ licenseState, licenseDispatch ] = useLicenseContext();
    
    const [ submitBlocked, setSubmitBlocked ] = React.useState(true);
    const [ licenseKeyInput, setLicenseKeyInput ] = React.useState(licenseState.license?.licenseKey);
    const [ licenseId, setLicenseId ] = React.useState(licenseState?.license?.licenseId);
    
    React.useEffect(() => {
        (async() => {
            if (!licenseId)
            {
                const licenses = await acquireLicenses(productName, dataProvider);

                if (licenses.length > 0)
                {
                    setLicenseId(licenses[0].ian_licenseid);
                }
            }
        })();
    }, [ ]);

    const onSubmitClick = async () => {
        if (licenseId) {
            if (isWebApi(dataProvider)) {
                await dataProvider.updateRecord(
                    "ian_license",
                    licenseId,
                    {
                        "ian_key": licenseKeyInput
                    }
                );
            }
            else if (isDataset(dataProvider)) {
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
                        "ian_name": productName,
                        "ian_key": licenseKeyInput
                    }
                );
            }
            else if (isDataset(dataProvider)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const newLicense = await (dataProvider as any).newRecord();

                await newLicense.setValue("ian_name", productName);
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
                    <span style={{fontWeight: 'bold'}}>License Publisher: </span> <span title={licenseState.license?.licenseClaims.iss}>{licenseState.license?.licenseClaims.iss_name}</span>
                </p>
                <p>
                    <span style={{fontWeight: 'bold'}}>Licensed Product: </span> <span title={licenseState.license?.licenseClaims.aud}>{licenseState.license?.licenseClaims.aud_name}</span>
                </p>
                <p>
                    <span style={{fontWeight: 'bold'}}>Licensed Customer: </span> <span title={licenseState.license?.licenseClaims.sub}>{licenseState.license?.licenseClaims.sub_name}</span>
                </p>
                <p>
                    <span style={{fontWeight: 'bold'}}>Licensed Dataverse Environment: </span> <span>{licenseState.license?.licenseClaims.env?.join(", ")}</span>
                </p>                
                <p>
                    <span style={{fontWeight: 'bold'}}>License expires after: </span> <span>{new Date(licenseState.license?.licenseClaims.exp * 1000).toISOString()}</span>
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