import * as React from "react";
import { ILicenseClaims } from "../../../../../../ianus-core/LicenseClaims";
import { LicenseValidationResult } from "../../../../../../ianus-core/LicenseValidationResult";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { IanusCanvasApp, IIanusCanvasAppProps } from "./IanusCanvasApp";

export class IanusCanvas implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private theComponent: ComponentFramework.ReactControl<IInputs, IOutputs>;
    private notifyOutputChanged: () => void;
    private isValid = 0;
    private reason = "";
    private license: ILicenseClaims | null = null;

    /**
     * Empty constructor.
     */
    constructor() { }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary
    ): void {
        this.notifyOutputChanged = notifyOutputChanged;
    }

    private onLicenseValidated = ( result: LicenseValidationResult ): void => {
        this.isValid = result.isValid ? 1 : 0;

        if (result.isValid)
        {
            this.license = result.claims;
            this.reason = "";
        }
        else
        {
            this.reason = result.reason;
            this.license = null;
        }

        this.notifyOutputChanged();
    };

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     * @returns ReactElement root react element for the control
     */
    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        const props: IIanusCanvasAppProps = {
            publisherId: context.parameters.publisherId.raw ?? "",
            productId: context.parameters.productId.raw ?? "",
            publicKey: context.parameters.publicKey.raw ?? "",
            fallbackPublicKey: context.parameters.fallbackPublicKey.raw ?? "",
            // For canvas apps we can only safely acquire the tenantid, so we only validate against 'entra' type
            environmentType: "entra",
            // We use organizationid from pcfContext if possible fetch via webAPI as fallback
            environmentIdentifier: context.parameters.tenantId.raw ?? (context as unknown as { orgSettings: { tenantId: string }}).orgSettings.tenantId,
            // We may only pass the dataset as dataProvider, if it will also be capable of creating new records (for setting a license first time)
            // This works only in canvas apps at the time of writing
            // Otherwise, pass webAPI
            dataProvider: context.parameters.licenseDataSet,
            onLicenseValidated: this.onLicenseValidated
        };

        return React.createElement(
            IanusCanvasApp, props
        );
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {
            isValid: this.isValid,
            reason: this.reason,
            licenseJson: this.license ? JSON.stringify(this.license) : ""
        };
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        // Add code to cleanup control if necessary
    }
}
