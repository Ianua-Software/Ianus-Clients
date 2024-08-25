import * as React from 'react';
import { Label } from '@fluentui/react';
import { IanusProvider } from "./domain/IanusProvider";
import { IInputs } from './generated/ManifestTypes';

export interface IHelloWorldProps {
  name?: string;
  pcfContext: ComponentFramework.Context<IInputs>;
}

export const HelloWorld: React.FC<IHelloWorldProps> = ({ name, pcfContext }) => {
  return (
    <IanusProvider
      pcfContext={pcfContext}
      productNameBase64={btoa('IANUS_FULL')}
      publicKeyBase64={btoa(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnvapddntxiL/KfNWrmHqRlIiNCq9y5doYigdhS9nKiRL+itiypokzoPJCgUcMFJehvYaNQTmGFkAs44lauvMJJEQOAK1v/xjnI0wPcPhh8bYQ7IH4148H4HluI2jQLF8zJvLdacX7rnOGxIRNgXiHO1jVmOTDFm10M4+RRw2EXi+RVjXcSFTqqkCd07SzQ2dLg3AJKoBJXRaIGMSvZm6iujWv6ijjQiJi4UclXGX+HmolBYlWzePlTjXUE7JXVY1qmizZ1t0cg0UF0xXd5tt/AJD2AQzzhAw3uJAgDRNSmSlq3YtPi8rqG7GapUp9m/IR1kAIoUHxClSbm/EqvrjdQIDAQAB
-----END PUBLIC KEY-----`)}
    >
      <Label>
        { name }
      </Label>
    </IanusProvider>
  );
}
