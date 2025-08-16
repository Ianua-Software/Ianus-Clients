import * as React from 'react';
import { DefaultButton, Label } from '@fluentui/react';
import { IanusProvider } from "../../../../react-core/fluentui8/src/IanusProvider";
import { useLicenseContext } from '../../../../react-core/fluentui8/src/IanusLicenseStateProvider';
import { LicenseValidationResult } from '../../../../../../ianus-core/LicenseValidationResult';
import { EnvironmentType } from '../../../../react-core/fluentui8/src/IanusGuard';

export interface IIanusDatasetAppProps {
  publisherId: string;
  productId: string;
  publicKey: string;
  fallbackPublicKey: string;
  environmentType: EnvironmentType;
  environmentIdentifier: string | ComponentFramework.WebApi;
  dataProvider: ComponentFramework.WebApi;
  usagePermission?: boolean | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLicenseValidated?: (result: LicenseValidationResult) => any
}

const IanusDatasetContent: React.FC = () => {
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

export const IanusDatasetApp: React.FC<IIanusDatasetAppProps> = ({ publisherId, productId, publicKey, fallbackPublicKey, environmentType, environmentIdentifier, dataProvider, usagePermission, onLicenseValidated }) => {
  return (
    <IanusProvider
      publisherId={publisherId}
      productId={productId}
      publicKeys={[publicKey, fallbackPublicKey]}
      environmentType={environmentType}
      environmentIdentifier={environmentIdentifier}
      dataProvider={dataProvider}
      usagePermission={usagePermission}
      onLicenseValidated={onLicenseValidated}
    >
      <IanusDatasetContent />
    </IanusProvider>
  );
}
