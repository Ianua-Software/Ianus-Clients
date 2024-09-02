import * as React from 'react';
import { DefaultButton, Label } from '@fluentui/react';
import { IanusProvider } from "../../../ianus/IanusProvider";
import { useLicenseContext } from '../../../ianus/IanusLicenseStateProvider';

export interface IIanusDemoProps {
  productName: string;
  publicKey: string;
  validIssuer: string;
  environmentInfo: string | ComponentFramework.PropertyTypes.DataSet;
  dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLicenseValidated?: (result: { isValid: boolean; }) => any
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


export const IanusDemo: React.FC<IIanusDemoProps> = ({ productName, publicKey, validIssuer, environmentInfo, dataProvider, onLicenseValidated }) => {
  return (
    <IanusProvider
      productNameBase64={productName}
      publicKeyBase64={publicKey}
      validIssuer={validIssuer}
      environmentInfo={environmentInfo}
      dataProvider={dataProvider}
      onLicenseValidated={onLicenseValidated}
    >
      <IanusDemoApp />
    </IanusProvider>
  );
}
