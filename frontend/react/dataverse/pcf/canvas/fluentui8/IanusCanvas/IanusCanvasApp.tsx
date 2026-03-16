import * as React from 'react';
import { DefaultButton, Label } from '@fluentui/react';
import { IanusProvider } from "../../../../react-core/fluentui8/src/IanusProvider";
import { useLicenseContext } from '../../../../react-core/fluentui8/src/IanusLicenseStateProvider';
import { EnvironmentType } from '../../../../react-core/fluentui8/src/IanusGuard';
import { DataverseLicenseValidationResult } from '../../../../react-core/fluentui8/src/DataverseLicenseValidationResult';

export interface IIanusCanvasAppProps {
  publisherId: string;
  productId: string;
  publicKey: string;
  fallbackPublicKey: string;
  environmentType: EnvironmentType;
  environmentIdentifier: string;
  dataProvider: ComponentFramework.PropertyTypes.DataSet;
  offlineDataProvider: ComponentFramework.PropertyTypes.DataSet;
  usagePermission?: boolean | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLicenseValidated?: (result: DataverseLicenseValidationResult) => any
}

const IanusCanvasContent: React.FC = () => {
  const [ licenseState, licenseDispatch ] = useLicenseContext();

  return (
    <>
      <Label style={{ textWrap: "wrap" }}>
        { `License check valid! License Id: ${licenseState.licenseValidationResult?.licenseId}` }
      </Label>
      <DefaultButton onClick={() => licenseDispatch({ type: "setVisibleDialog", payload: 'license_details' })}>Show license</DefaultButton>
    </>
  );
}

export const IanusCanvasApp: React.FC<IIanusCanvasAppProps> = ({ publisherId, productId, publicKey, fallbackPublicKey, environmentType, environmentIdentifier, dataProvider, offlineDataProvider, usagePermission, onLicenseValidated }) => {
  return (
    <IanusProvider
      publisherId={publisherId}
      productId={productId}
      publicKeys={[publicKey, fallbackPublicKey]}
      environmentType={environmentType}
      environmentIdentifier={environmentIdentifier}
      dataProvider={dataProvider}
      offlineDataProvider={offlineDataProvider}
      usagePermission={usagePermission}
      onLicenseValidated={onLicenseValidated}
    >
      <IanusCanvasContent />
    </IanusProvider>
  );
}
