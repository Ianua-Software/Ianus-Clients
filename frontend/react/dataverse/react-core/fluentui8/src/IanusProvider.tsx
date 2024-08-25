import * as React from 'react';

import { IanusGuard, IIanusGuardProps } from './IanusGuard';
import { IanusLicenseStateProvider } from './IanusLicenseStateProvider';

export interface IIanusProviderProps extends IIanusGuardProps { }

export const IanusProvider: React.FC<React.PropsWithChildren<IIanusProviderProps>> = (props) => {
    return (
        <IanusLicenseStateProvider>
            <IanusGuard {...props} />
        </IanusLicenseStateProvider>
    );
};