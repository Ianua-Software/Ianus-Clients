import * as React from "react";
import { DataverseLicenseValidationResult } from "./DataverseLicenseValidationResult";

export type AvailableDialogs = "debug" | "license_details" | "license_acquisition";

export type IanusLicenseDispatch = (action: Action) => void;

export type IanusLicenseStateProps = {
    license?: DataverseLicenseValidationResult;
    visibleDialog?: AvailableDialogs;
};

type Action = { type: "setLicense", payload: DataverseLicenseValidationResult | undefined }
    | { type: "setVisibleDialog", payload: AvailableDialogs | undefined };

function stateReducer(state: IanusLicenseStateProps, action: Action): IanusLicenseStateProps {
    switch (action.type) {
        case "setLicense": {
            return { ...state, license: action.payload };
        }
        case "setVisibleDialog": {
            return { ...state, visibleDialog: action.payload };
        }
    }
}

const IanusLicenseState = React.createContext<IanusLicenseStateProps | undefined>(undefined);
const IanusLicenseDispatch = React.createContext<IanusLicenseDispatch | undefined>(undefined);

export const IanusLicenseStateProvider: React.FC<IanusLicenseStateProps> = (props) => {
    const [state, dispatch] = React.useReducer(stateReducer, props ?? {});

    return (
        <IanusLicenseState.Provider value={state}>
            <IanusLicenseDispatch.Provider value={dispatch}>
                {props.children}
            </IanusLicenseDispatch.Provider>
        </IanusLicenseState.Provider>
    );
};

export const useLicenseState = () => {
    const context = React.useContext(IanusLicenseState);

    if (!context) {
        throw new Error("useLicenseState must be used within a state provider!");
    }

    return context;
};

export const useLicenseDispatch = () => {
    const context = React.useContext(IanusLicenseDispatch);

    if (!context) {
        throw new Error("useLicenseDispatch must be used within a state provider!");
    }

    return context;
};

export const useLicenseContext = (): [ IanusLicenseStateProps, IanusLicenseDispatch ] => {
    return [ useLicenseState(), useLicenseDispatch() ];
};