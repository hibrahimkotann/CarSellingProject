import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAllAssets from '@salesforce/apex/AssetInformation.getAllAssets';
import addAssetToOpportunity from '@salesforce/apex/AssetInformation.addAssetToOpportunity';
import { CloseActionScreenEvent } from 'lightning/actions';
import { refreshApex } from '@salesforce/apex';

export default class AssetSelectionComponentForOpportunity extends LightningElement {
    @api recordId;
    @track selectedRows = [];
    @track data;

    @track columns = [
        { label: 'Serial Number', fieldName: 'SerialNumber', type: 'text' },
        { label: 'Interior Color', fieldName: 'Interior_Color__c', type: 'text' },
        { label: 'Exterior Color', fieldName: 'Exterior_Color__c', type: 'text' },
        { label: 'Product', fieldName: 'Product2_Name', type: 'text' },
    ];

    @wire(getAllAssets)
    wiredAssets({ error, data }) {
        this.refreshPage = data;
        if (data) {
            let accParsedData = JSON.parse(JSON.stringify(data));
            accParsedData.forEach(acc => {
                if (acc.Product2) {
                    acc.Product2_Name = acc.Product2.Name;
                }
            });
            this.data = accParsedData;
        } else if (error) {
            this.data = undefined;
            console.error('Error in getAllAssets wire: ', error);
        }
    }

    handleRowSelection(event) {
        this.selectedRows = event.detail.selectedRows.map(row => row.Id);
    }

    handleLinkSelection() {
        console.log('Selected Rows: ', this.selectedRows);
        console.log('Opportunity Id: ', this.recordId);

        addAssetToOpportunity({ opportunityId: this.recordId, assetIds: this.selectedRows })
            .then(response => {
                console.log('Response from addAssetToOpportunity: ', response);
                if (response === 'successful') {
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'New Connection',
                        message: '***** Successful Connection *****',
                        variant: 'success'
                    }));
                    this.dispatchEvent(new CloseActionScreenEvent());
                    // Refresh the data
                    return refreshApex(this.refreshPage);
                } else {
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'Error',
                        message: 'Something went wrong',
                        variant: 'error'
                    }));
                }
            })
            .catch(error => {
                console.error('Error in handleLinkSelection: ', error);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: 'Something went wrong',
                    variant: 'error'
                }));
            });
    }
}
