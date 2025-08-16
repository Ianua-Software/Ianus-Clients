import * as React from 'react';
import { DefaultButton, Text } from '@fluentui/react';
import { IanusProvider } from "../../../../react-core/fluentui8/src/IanusProvider";
import { useLicenseContext } from '../../../../react-core/fluentui8/src/IanusLicenseStateProvider';
import { LicenseValidationResult } from '../../../../../../ianus-core/LicenseValidationResult';
import { EnvironmentType } from '../../../../react-core/fluentui8/src/IanusGuard';

export interface IIanusAppProps {
  publisherId: string;
  productId: string;
  publicKey: string;
  fallbackPublicKey: string;
  environmentType: EnvironmentType;
  environmentIdentifier: string;
  dataProvider: ComponentFramework.WebApi;
  usagePermission?: boolean | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLicenseValidated?: (result: LicenseValidationResult) => any
}

const IanusDemoApp: React.FC = () => {
  const [ licenseState, licenseDispatch ] = useLicenseContext();

  return (
    <>
      <Text>
        { `License check valid! Your protected content would render in this place. License Id: ${licenseState.license?.licenseId}` }
      </Text>
      <DefaultButton onClick={() => licenseDispatch({ type: "setLicenseDialogVisible", payload: true })}>Show license</DefaultButton>
    </>
  );
}

export const IanusApp: React.FC<IIanusAppProps> = ({ publisherId, productId, publicKey, fallbackPublicKey, environmentType, environmentIdentifier, dataProvider, usagePermission, onLicenseValidated }) =>
{
  return (
    <IanusProvider
      publisherId={publisherId}
      productId={productId}
      publicKeys={[publicKey, fallbackPublicKey]}
      environmentType={environmentType}
      environmentIdentifier={environmentIdentifier}
      dataProvider={dataProvider}
      onLicenseValidated={onLicenseValidated}
      usagePermission={usagePermission}
    >
      <IanusDemoApp />
    </IanusProvider>
  );
}
