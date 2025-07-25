import { JSONSchema4 } from "json-schema";
import { ILicense } from "../../../../../../ianus-core/License";
import { LicenseValidationResult } from "../../../../../../ianus-core/LicenseValidationResult";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { IanusDemo, IIanusDemoProps } from "./IanusDemo";
import * as React from "react";

export class Ianus implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    private theComponent: ComponentFramework.ReactControl<IInputs, IOutputs>;
    private notifyOutputChanged: () => void;
    private isValid = 0;
    private reason = "";
    private license: ILicense | null = null;

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
        this.reason = result.reason;
        this.license = result.license ?? null;

        this.notifyOutputChanged();
    };

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     * @returns ReactElement root react element for the control
     */
    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        const props: IIanusDemoProps = {
            publisherId: context.parameters.publisherId.raw ?? "",
            productId: context.parameters.productId.raw ?? "",
            publicKey: context.parameters.publicKey.raw ?? "",
            fallbackPublicKey: context.parameters.fallbackPublicKey.raw ?? "",
            organizationId: (context as unknown as { orgSettings: { attributes: { organizationid: string }}}).orgSettings.attributes.organizationid ?? context.webAPI,
            dataProvider: context.webAPI,
            onLicenseValidated: this.onLicenseValidated
        };

        return React.createElement(
            IanusDemo, props
        );
    }

    public getOutputSchema(): JSONSchema4 {
        const licenseSchema: JSONSchema4 = {
            $schema: 'http://json-schema.org/draft-04/schema#',
            title: 'License',
            type: 'object',
            properties: {
                "jti": {
                    type: "string"
                },
                "iss": {
                    type: "string"
                },
                "aud": {
                    type: "string"
                },
                "pub": {
                    type: "string"
                },
                "prd": {
                    type: "string"
                },
                "sub": {
                    type: "string"
                },
                "env": {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            "type": {
                                type: "string"
                            },
                            "identifier": {
                                type: "string"
                            },
                            "name": {
                                type: "string"
                            }
                        }
                    }
                },
                "required_roles": {
                    type: "array",
                    items: {
                        type: "string"
                    }
                },
                "iat": {
                    type: "number"
                },
                "nbf": {
                    type: "number"
                },
                "exp": {
                    type: "number"
                },
                "custom": {
                    type: "object",
                    items: {
                        type: "any"
                    }
                },
                "iss_meta": {
                    type: "object",
                    items: {
                        type: "object",
                        properties: {
                            "name": {
                                type: "string"
                            }
                        }
                    }
                },
                "aud_meta": {
                    type: "object",
                    items: {
                        type: "object",
                        properties: {
                            "name": {
                                type: "string"
                            }
                        }
                    }
                },
                "pub_meta": {
                    type: "object",
                    items: {
                        type: "object",
                        properties: {
                            "name": {
                                type: "string"
                            }
                        }
                    }
                },
                "prd_meta": {
                    type: "object",
                    items: {
                        type: "object",
                        properties: {
                            "name": {
                                type: "string"
                            }
                        }
                    }
                },
                "sub_meta": {
                    type: "object",
                    items: {
                        type: "object",
                        properties: {
                            "name": {
                                type: "string"
                            }
                        }
                    }
                },
                "ver": {
                    type: "string"
                }
            }
        };
        
        return licenseSchema;
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
            // licenseSchema: JSON.stringify(this.getOutputSchema())
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
