import * as React from 'react';
import { IInputs } from '../generated/ManifestTypes';
import { IanusGuard, IIanusGuardProps } from './IanusGuard';

export interface IIanusProviderProps extends IIanusGuardProps {
    pcfContext: ComponentFramework.Context<IInputs>;
}

export const IanusProvider: React.FC<React.PropsWithChildren<IIanusProviderProps>> = (props) => {
    return (
        <IanusGuard {...props} />
    );
};