import * as React from 'react';
import { DefaultButton, Label } from '@fluentui/react';
import { IanusProvider } from "./domain/IanusProvider";
import { IInputs } from './generated/ManifestTypes';
import { useLicenseContext } from './domain/IanusLicenseStateProvider';

export interface IIanusDemoProps {
  productName: string;
  publicKey: string;
  validIssuer: string;
  orgUniqueName: string;
  webAPI: ComponentFramework.WebApi;
}

const IanusDemoApp: React.FC = () => {
  const [ licenseState, licenseDispatch ] = useLicenseContext();

  return (
    <>
      <Label>
        { `License check valid! Your protected content would render in this place. License Id: ${licenseState.license?.licenseId}` }
      </Label>
      <DefaultButton onClick={() => licenseDispatch({ type: "setLicenseDialogVisible", payload: true })}>Show license</DefaultButton>
    </>
  );
}


export const IanusDemo: React.FC<IIanusDemoProps> = ({ productName, publicKey, validIssuer, orgUniqueName, webAPI }) => {
  return (
    <IanusProvider
      productNameBase64={productName}
      publicKeyBase64={publicKey}
      validIssuer={validIssuer}
      orgUniqueName={orgUniqueName}
      webAPI={webAPI}
    >
      <IanusDemoApp />
    </IanusProvider>
  );
}
