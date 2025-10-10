import * as React from 'react';

import {
    Dialog,
    DialogFooter,
    DialogType,
    PrimaryButton,
    Text,
    DetailsList,
    DetailsListLayoutMode,
    IColumn
} from '@fluentui/react';

import { useLicenseContext } from './IanusLicenseStateProvider';
import { isDataset } from './IanusGuard';

const modalProps = {
    isBlocking: false,
    styles: {
        main: {
            width: '80vw !important',
            maxWidth: '80vw !important', 
            height: 'auto',
            maxHeight: '90vh',
            overflowY: 'auto',
            overflowX: 'auto'
        }
    }
};

const dialogContentProps = {
    type: DialogType.largeHeader,
    title: 'Debug'
};

export interface IDebugDialogProps {
    publisherId: string;
    productId: string;
    dataProvider: ComponentFramework.WebApi | ComponentFramework.PropertyTypes.DataSet;
    offlineDataProvider?: ComponentFramework.PropertyTypes.DataSet;
    onDismiss: () => void;
}

export const DebugDialog: React.FC<IDebugDialogProps> = ({ publisherId, productId, dataProvider, offlineDataProvider, onDismiss }) => {
    const [ licenseState, licenseDispatch ] = useLicenseContext();

    const licenseColumns: IColumn[] = [
        { key: 'id', name: 'Id', fieldName: 'ian_licenseid', minWidth: 100, maxWidth: 200, isResizable: true },
        { key: 'name', name: 'Name', fieldName: 'ian_name', minWidth: 100, maxWidth: 200, isResizable: true },
        { key: 'identifier', name: 'Identifier', fieldName: 'ian_identifier', minWidth: 100, maxWidth: 200, isResizable: true },
        { key: 'key', name: 'Key', fieldName: 'ian_key', minWidth: 100, maxWidth: 200, isResizable: true },
    ];

    const mapRecordsToItems = React.useCallback((dataset: ComponentFramework.PropertyTypes.DataSet) =>
        dataset.sortedRecordIds.map(id => {
            const record = dataset.records[id];
            return {
                ian_licenseid: record.getRecordId(),
                ian_name: record.getValue("ian_name"),
                ian_identifier: record.getValue("ian_identifier"),
                ian_key: record.getValue("ian_key")
            };
        }),
        []
    );

    return (
        <Dialog
            hidden={!licenseState?.debugDialogVisible}
            onDismiss={onDismiss}
            dialogContentProps={dialogContentProps}
            modalProps={modalProps}
        >
            <p>
                <Text><b>Target license identifier:</b> {publisherId}_{productId}</Text>
                <br />
                <br />
                { isDataset( dataProvider ) && (
                    <>
                        <Text><b>Licenses in data provider:</b> {dataProvider.sortedRecordIds.length}</Text>
                        <br />
                        <DetailsList
                            items={mapRecordsToItems(dataProvider)}
                            columns={licenseColumns}
                            setKey="dataProviderList"
                            layoutMode={DetailsListLayoutMode.fixedColumns}
                            selectionMode={0} // No selection
                        />
                        <br />
                    </>
                ) }

                { offlineDataProvider && isDataset( offlineDataProvider ) && (
                    <>
                        <Text><b>Licenses in offline data provider:</b> {offlineDataProvider.sortedRecordIds.length}</Text>
                        <br />
                        <DetailsList
                            items={mapRecordsToItems(offlineDataProvider)}
                            columns={licenseColumns}
                            setKey="offlineDataProviderList"
                            layoutMode={DetailsListLayoutMode.fixedColumns}
                            selectionMode={0} // No selection
                        />
                        <br />
                    </>
                ) }
            </p>
        <DialogFooter>
          <PrimaryButton onClick={onDismiss} text="Close" />
        </DialogFooter>
      </Dialog>
    );
}