import * as React from 'react';
import { DefaultButton, Label } from '@fluentui/react';
import { IanusProvider } from "../../../../react-core/fluentui8/src/IanusProvider";
import { useLicenseContext } from '../../../../react-core/fluentui8/src/IanusLicenseStateProvider';
import { LicenseValidationResult } from '../../../../../ianus-core/LicenseValidationResult';

export interface IIanusDemoProps {
  productId: string;
  publicKey: string;
  issuerId: string;
  organizationId: string | ComponentFramework.PropertyTypes.DataSet;
  dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLicenseValidated?: (result: LicenseValidationResult) => any
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


export const IanusDemo: React.FC<IIanusDemoProps> = ({ productId, publicKey, issuerId, organizationId, dataProvider, onLicenseValidated }) => {
  return (
    <IanusProvider
      issuerId={issuerId}
      productId={productId}
      publicKey={publicKey}
      organizationId={organizationId}
      dataProvider={dataProvider}
      onLicenseValidated={onLicenseValidated}
    >
      <IanusDemoApp />
    </IanusProvider>
  );
}
