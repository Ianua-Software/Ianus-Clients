import * as React from 'react';
import { DefaultButton, Label } from '@fluentui/react';
import { IanusProvider } from "../../../../react-core/fluentui8/src/IanusProvider";
import { useLicenseContext } from '../../../../react-core/fluentui8/src/IanusLicenseStateProvider';
import { LicenseValidationResult } from '../../../../../../ianus-core/LicenseValidationResult';

export interface IIanusCanvasAppProps {
  publisherId: string;
  productId: string;
  publicKey: string;
  fallbackPublicKey: string;
  environmentType: string;
  environmentIdentifier: string;
  dataProvider: ComponentFramework.PropertyTypes.DataSet;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLicenseValidated?: (result: LicenseValidationResult) => any
}

const IanusCanvasContent: React.FC = () => {
  const [ licenseState, licenseDispatch ] = useLicenseContext();

  return (
    <>
      <Label style={{ textWrap: "wrap" }}>
        { `License check valid! Your protected content would render in this place. License Id: ${licenseState.license?.licenseId}` }
      </Label>
      <DefaultButton onClick={() => licenseDispatch({ type: "setLicenseDialogVisible", payload: true })}>Show license</DefaultButton>
    </>
  );
}

export const IanusCanvasApp: React.FC<IIanusCanvasAppProps> = ({ publisherId, productId, publicKey, fallbackPublicKey, environmentType, environmentIdentifier, dataProvider, onLicenseValidated }) => {
  return (
    <IanusProvider
      publisherId={publisherId}
      productId={productId}
      publicKeys={[publicKey, fallbackPublicKey]}
      environmentType={environmentType}
      environmentIdentifier={environmentIdentifier}
      dataProvider={dataProvider}
      onLicenseValidated={onLicenseValidated}
    >
      <IanusCanvasContent />
    </IanusProvider>
  );
}
