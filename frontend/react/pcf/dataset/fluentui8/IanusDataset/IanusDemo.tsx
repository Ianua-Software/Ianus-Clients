import * as React from 'react';
import { DefaultButton, Label } from '@fluentui/react';
import { IanusProvider } from "../../../../react-core/fluentui8/src/IanusProvider";
import { useLicenseContext } from '../../../../react-core/fluentui8/src/IanusLicenseStateProvider';

export interface IIanusDemoProps {
  product: string;
  publicKey: string;
  issuer: string;
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


export const IanusDemo: React.FC<IIanusDemoProps> = ({ product, publicKey, issuer, environmentInfo, dataProvider, onLicenseValidated }) => {
  return (
    <IanusProvider
      issuerIdentifier={issuer}
      productIdentifier={product}
      publicKey={publicKey}
      environmentInfo={environmentInfo}
      dataProvider={dataProvider}
      onLicenseValidated={onLicenseValidated}
    >
      <IanusDemoApp />
    </IanusProvider>
  );
}
