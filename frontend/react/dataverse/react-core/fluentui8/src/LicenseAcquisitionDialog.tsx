import * as React from 'react';
import {
    Dialog,
    DialogFooter,
    DialogType,
    PrimaryButton,
    DefaultButton,
    Text,
    Stack,
    MessageBar,
    MessageBarType
} from '@fluentui/react';
import { useLicenseContext } from './IanusLicenseStateProvider';
import { EnvironmentEntry, EnvironmentType, LicenseAcquisitionConfig } from './IanusGuard';

const modalProps = {
    isBlocking: false,
    styles: { main: { maxWidth: 600 } },
};

export interface ILicenseDialogProps {
    config?: LicenseAcquisitionConfig;
    publisherId: string;
    productId: string;
    environmentType: string;
    environmentIdentifier: string;
}

export const LicenseAcquisitionDialog: React.FC<ILicenseDialogProps> = ({ 
    config, 
    publisherId, 
    productId, 
    environmentType, 
    environmentIdentifier 
}) => {
    const [licenseState, licenseDispatch] = useLicenseContext();
    const [error, setError] = React.useState<string | undefined>();

    const onDismiss = React.useCallback(() => {
        setError(undefined); // Clear error on dismiss
        licenseDispatch({ type: "setVisibleDialog", payload: undefined });
    }, [licenseDispatch]);

    const onOpenTrialPage = React.useCallback(() => {
        // Clear any previous errors
        setError(undefined);

        if (config?.type !== 'url') {
            setError('Configuration error: Trial page cannot be opened for this license acquisition type.');
            return;
        }

        if (!environmentIdentifier) {
            setError('Environment identifier is missing. Please try again or contact support.');
            return;
        }

        try {
            // Build the current environment entry
            const currentEnvironment: EnvironmentEntry = {
                type: environmentType as EnvironmentType,
                identifier: environmentIdentifier,
                name: environmentType === 'entra' ? 'Entra ID Tenant' : 'Dataverse Environment'
            };

            // Combine current environment with additional environments from config
            const allEnvironments = [
                currentEnvironment,
                ...(config?.prefillData?.additionalEnvironments ?? [])
            ];

            // Remove duplicates based on identifier
            const uniqueEnvironments = allEnvironments.filter((env, index, self) =>
                index === self.findIndex(e => e.identifier.toLowerCase() === env.identifier.toLowerCase())
            );

            const prefillData = {
                emailAddress: config?.prefillData?.emailAddress,
                environments: uniqueEnvironments
            };

            const portalUrl = 'https://www.ianusguard.com';
            const url = `${portalUrl}/public/publishers/${publisherId}/products/${productId}?prefill=${encodeURIComponent(JSON.stringify(prefillData))}`;
            
            // Attempt to open the URL
            const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
            
            // Check if popup was blocked
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                setError('Failed to open trial page. Please check if popup blockers are enabled and allow popups for this site.');
                return;
            }
            
            // Success - close the dialog
            onDismiss();
        } catch (err) {
            console.error('Failed to open trial page:', err);
            setError(`Failed to open trial page: ${err instanceof Error ? err.message : 'Unknown error occurred'}`);
        }
    }, [config, environmentType, environmentIdentifier, publisherId, productId, onDismiss]);

    // Early return if config is not provided
    if (!config) {
        return null;
    }

    return (
        <Dialog
            hidden={licenseState?.visibleDialog !== "license_acquisition"}
            onDismiss={onDismiss}
            dialogContentProps={{ 
                type: DialogType.largeHeader, 
                title: config.title ?? 'Acquire a License' 
            }}
            modalProps={modalProps}
        >
            <Stack tokens={{ childrenGap: 16 }}>
                {error && (
                    <MessageBar
                        messageBarType={MessageBarType.error}
                        isMultiline={true}
                        onDismiss={() => setError(undefined)}
                    >
                        {error}
                    </MessageBar>
                )}

                {typeof config.instruction === 'string' ? (
                    <Text>{config.instruction}</Text>
                ) : (
                    config.instruction
                )}
            </Stack>

            <DialogFooter>
                {config.type === 'url' ? (
                    <>
                        <PrimaryButton onClick={onOpenTrialPage} text="Open Trial Request Page" />
                        <DefaultButton onClick={onDismiss} text="Close" />
                    </>
                ) : (
                    <PrimaryButton onClick={onDismiss} text="Close" />
                )}
            </DialogFooter>
        </Dialog>
    );
};