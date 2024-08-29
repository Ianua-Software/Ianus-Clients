import * as React from 'react';
import { IInputs } from '../generated/ManifestTypes';
import { IanusGuard, IIanusGuardProps } from './IanusGuard';
import { IanusLicenseStateProvider } from './IanusLicenseStateProvider';

export interface IIanusProviderProps extends IIanusGuardProps {
    webAPI: ComponentFramework.WebApi;
}

export const IanusProvider: React.FC<React.PropsWithChildren<IIanusProviderProps>> = (props) => {
    return (
        <IanusLicenseStateProvider>
            <IanusGuard {...props} />
        </IanusLicenseStateProvider>
    );
};