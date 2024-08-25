import { ChoiceGroup, DefaultButton, Dialog, DialogFooter, DialogType, Dropdown, IChoiceGroupOption, IDropdownOption, MessageBar, MessageBarType, PrimaryButton, Text, TextField } from '@fluentui/react';
import * as React from 'react';
import { ILicense } from './License';
import { IInputs } from '../generated/ManifestTypes';
import { SecureConfig } from './SecureConfig';

const modalProps = {
    isBlocking: false,
    styles: { main: { maxWidth: 600 } },
};

const dialogContentProps = {
    type: DialogType.largeHeader,
    title: 'Settings'
};

export interface ISettingsDialogProps {
    pcfContext: ComponentFramework.Context<IInputs>;
    secureConfig: SecureConfig;
    onSubmit: () => void;
    onCancel: () => void;
    licenseError?: string;
}

export const SettingsDialog: React.FC<ISettingsDialogProps> = ({ pcfContext, secureConfig, onCancel, onSubmit, licenseError }) => {
    const { configId, licenseKey: license, licenseClaims } = secureConfig;
    const [ licenseKey, setLicenseKey ] = React.useState(license);

    const onSubmitClick = async () => {
        await pcfContext.webAPI.updateRecord(
            "ian_license",
            configId,
            {
                "ian_key": licenseKey
            }
        );

        onSubmit();
    };

    return (
        <Dialog
            hidden={false}
            onDismiss={onCancel}
            dialogContentProps={dialogContentProps}
            modalProps={modalProps}
        >
        { !!licenseError &&
                <MessageBar
                    messageBarType={MessageBarType.error}
                    isMultiline={true}
                    styles={{ root: { marginBottom: "10px" }}}
                >
                    An error occured, please try again. Error information: { licenseError }
                </MessageBar>
            }
        <TextField label='License Key' value={licenseKey} onChange={(e, v) => setLicenseKey(v ?? "")} required />
        { !!licenseClaims &&
            <Text>
                <br />
                <h3>License Information</h3>
                <p>
                    <span style={{fontWeight: 'bold'}}>License Publisher: </span> <span>{licenseClaims.iss}</span>
                </p>
                <p>
                    <span style={{fontWeight: 'bold'}}>Licensed Product: </span> <span>{licenseClaims.aud}</span>
                </p>
                <p>
                    <span style={{fontWeight: 'bold'}}>Licensed Dataverse Environment: </span> <span>{licenseClaims.sub}</span>
                </p>
                <p>
                    <span style={{fontWeight: 'bold'}}>License expires after: </span> <span>{new Date(licenseClaims.exp * 1000).toISOString()}</span>
                </p>
            </Text>
        }
        <DialogFooter>
          <PrimaryButton onClick={onSubmitClick} text="Submit" disabled={!licenseKey} />
          <DefaultButton onClick={onCancel} text="Cancel" />
        </DialogFooter>
      </Dialog>
    );
}