import * as React from 'react';
import { DefaultButton, TextField } from '@fluentui/react';
import { IanusProvider, useLicenseContext } from '@ianua/ianus-dataverse-react-fluentui8';
import { IInputs } from './generated/ManifestTypes';
import { CopyButton } from './CopyButton';

export interface IAppProps {
  value?: string;
  pcfContext: ComponentFramework.Context<IInputs>;
}

const publisherId = '4cec76aa-72df-4c71-93ff-2243589006fd';
const productId= 'e505e92d-066e-431a-99d3-000529328296';
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApQgCT345e408suU/k9NU
6Az8FJN37Fotn6zF52JWlThdqs9xhWe+dpcEO+MZGFAEkF417Imxxt1ZfY6Nf7EF
2vvynh9FLZkSGulb4lgixndFm1KVOaocgKG4WnEcguRYXg+M7f86tZ76qLb0l2nz
3j33OCjmuyDqUwsAzXU1ClHsUGJW9+CYx+fhjl/EopWE0M6p4Ru/7UaSeEtRxrRE
IEkgI6a+8XcMaEfDT/L2PoBNwzbpmHQfh1zolos2azpYri2q89TO08xyLkk6F6Rd
j6hivXNep7AvrVQPffiObs+UViZPm1nolhVUr1eqKBmYGgRji8GSpHOVm7D75VFr
9QIDAQAB
-----END PUBLIC KEY-----`;

export const AppContent: React.FC<IAppProps> = (props) =>
{
  const [licenseState, licenseDispatch] = useLicenseContext();

  return (
    <TextField styles={{ root: { width: "100%" } }} disabled={true} defaultValue={props.value} onRenderSuffix={() => <div style={{display: "flex", gap: "10px", flexDirection: "row"}}><CopyButton value={props.value} /><DefaultButton onClick={() => licenseDispatch({ type: "setLicenseDialogVisible", payload: true })}>Show license</DefaultButton> </div>} />
  );
};

export const App: React.FC<IAppProps> = (props) =>
{
  return (
    <IanusProvider
        publisherId={publisherId}
        productId={productId}
        publicKeys={[publicKey]}
        environmentType='dataverse'
        environmentIdentifier={(props.pcfContext as unknown as { orgSettings: { attributes: { organizationid: string }}}).orgSettings.attributes.organizationid ?? props.pcfContext.webAPI}
        dataProvider={props.pcfContext.webAPI}
      >
        <AppContent {...props} />
    </IanusProvider>
  );
};
