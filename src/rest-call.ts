import * as SDK from 'azure-devops-extension-sdk';
import axios from 'axios';
import { IWorkItemFormService, WorkItemTrackingServiceIds } from 'azure-devops-extension-api/WorkItemTracking/WorkItemTrackingServices';

export async function LoadDataFromService() {
    const inputs = SDK.getConfiguration().witInputs;
    const address = inputs.RestServiceAddress;
    const username = inputs.RestServiceUserName;
    const password = inputs.RestServicePassword;
    const service = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService);

    var params: any = {}
    if (inputs.RestCallParameters) {
        try {
            params = JSON.parse(inputs.RestCallParameters);

            // iterate through params to see if any value needs to be replaced with field values
            for (const key of Object.keys(params)) {
                const propertyValue = params[key];
                const isParameterized = propertyValue.startsWith('{') && propertyValue.endsWith('}');
                if (isParameterized) {
                    const fieldName = propertyValue.replace('{', '').replace('}', '');
                    const value = await service.getFieldValue(fieldName);

                    // replace parameter with the field value
                    params[key] = value;
                }
            }
        } catch (err) {
            console.log(err)
            return;
        }
    }

    var reqConfig = {
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (username || password) {
        if (username == "Bearer" || username == "bearer")
            reqConfig.headers["Authorization"] = username + " " + password;
        else
            reqConfig['auth'] = { username: username, password: password };
    }

    var req = axios.create(reqConfig);

    return req.get(address,
        {
            params: params
        }
    ).catch(err => {
        console.log(err);
        throw err;
    });
}