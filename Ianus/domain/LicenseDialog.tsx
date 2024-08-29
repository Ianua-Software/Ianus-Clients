import { ChoiceGroup, DefaultButton, Dialog, DialogFooter, DialogType, Dropdown, IChoiceGroupOption, IDropdownOption, MessageBar, MessageBarType, PrimaryButton, Text, TextField } from '@fluentui/react';
import * as React from 'react';
import { ILicense } from './License';
import { IInputs } from '../generated/ManifestTypes';
import { LicenseData } from './LicenseData';
import { useLicenseContext } from './IanusLicenseStateProvider';

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
    webAPI: ComponentFramework.WebApi;
    onSubmit: () => void;
    onCancel: () => void;
}

export const LicenseDialog: React.FC<ILicenseDialogProps> = ({ productName, webAPI, onCancel, onSubmit }) => {
    const [ licenseState, licenseDispatch ] = useLicenseContext();
    
    const [ submitBlocked, setSubmitBlocked ] = React.useState(true);
    const [ licenseKeyInput, setLicenseKeyInput ] = React.useState(licenseState.license?.licenseKey);
    const [ licenseId, setLicenseId ] = React.useState(licenseState?.license?.licenseId);
    
    React.useEffect(() => {
        (async() => {
            if (!licenseId)
            {
                const licenses = await webAPI.retrieveMultipleRecords("ian_license", `?$filter=ian_name eq '${productName}' and statecode eq 0`);

                if (licenses.entities.length > 0)
                {
                    setLicenseId(licenses.entities[0].ian_licenseid);
                }
            }
        })();
    }, [ ]);

    const onSubmitClick = async () => {
        if (licenseId) {
            await webAPI.updateRecord(
                "ian_license",
                licenseId,
                {
                    "ian_key": licenseKeyInput
                }
            );
        }
        else {
            await webAPI.createRecord(
                "ian_license",
                {
                    "ian_name": productName,
                    "ian_key": licenseKeyInput
                }
            );
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
                    <span style={{fontWeight: 'bold'}}>License Publisher: </span> <span>{licenseState.license?.licenseClaims.iss}</span>
                </p>
                <p>
                    <span style={{fontWeight: 'bold'}}>Licensed Product: </span> <span>{licenseState.license?.licenseClaims.aud}</span>
                </p>
                <p>
                    <span style={{fontWeight: 'bold'}}>Licensed Customer: </span> <span>{licenseState.license?.licenseClaims.sub}</span>
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