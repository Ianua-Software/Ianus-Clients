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
      productNameBase64={btoa('aab1aa49-1fb3-4d9c-b3b3-4e25ae34a4eb')}
      publicKeyBase64={btoa(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv+tqi/voQvBnMoBx23FtNxEt+dZZuoVF6wMbOqPLtW1jboRERrvewQYiA3XvC86uDv1U+ORbqAkZ8BE0ezgjKhIhV6Qmy1WbYhwmm/40Bu9vLRUNlcQn4h/ia8RB/KzlfQQ7733fxEbS2Rcei1v/44eu3tOqxUTL/i0WFf7lNVuirlji/eSj4BsM2+HWG3SyCpNDvxLv4GYmX5Zn92LLDPMEyZhq79Xf6uD+JbFKyEOQ8cc+Pc+Q44QBveOMU5ADD4C3VGTNtyouJ329gye9zgyxkFdWc0fIsou/pVS9mvnt97mMXjLnABnuzVww18IzGzPQsvZNOJX7b2CT9iK+oQIDAQAB
-----END PUBLIC KEY-----`)}
      validIssuer='6401271d-cc3f-4227-b79f-4d7103692f57'
    >
      <Label>
        { name }
      </Label>
    </IanusProvider>
  );
}
