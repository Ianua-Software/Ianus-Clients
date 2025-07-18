import * as React from 'react';
import { DefaultButton, Text } from '@fluentui/react';
import { IanusProvider } from "../../../../react-core/fluentui8/src/IanusProvider";
import { IInputs } from './generated/ManifestTypes';
import { useLicenseContext } from '../../../../react-core/fluentui8/src/IanusLicenseStateProvider';

export interface IIanusDemoProps {
  publisherId: string;
  productId: string;
  publicKey: string;
  fallbackPublicKey: string;
  organizationId: string;
  dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet;
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

export const IanusDemo: React.FC<IIanusDemoProps> = ({ publisherId, productId, publicKey, fallbackPublicKey, organizationId, dataProvider }) => {
  return (
    <IanusProvider
      publisherId={publisherId}
      productId={productId}
      publicKeys={[publicKey, fallbackPublicKey]}
      organizationId={organizationId}
      dataProvider={dataProvider}
    >
      <IanusDemoApp />
    </IanusProvider>
  );
}
