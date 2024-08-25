import { SecureConfig } from "./SecureConfig";

export const retrievePluginTypeResponse = (cfg: SecureConfig) => ({
  "value": [
    {
      "@odata.etag": "W/\"2492812\"",
      "name": "Xrm.Oss.AITune.OpenAICustomActionHandler",
      "plugintypeid": "10af31b7-ff08-4998-b5fd-11225ed66b11",
      "plugintype_sdkmessageprocessingstep": [
        {
          "name": "Xrm.Oss.AITune.OpenAICustomActionHandler: oss_AITuneBackend of any Entity",
          "sdkmessageprocessingstepid": "11c4d00d-bdb0-ed11-83ff-6045bd8f7e0b",
          "sdkmessageprocessingstepsecureconfigid": {
            "customizationlevel": 1,
            "createdon": "2023-02-20T01:23:11Z",
            "_createdby_value": "3f9bcab8-eb09-ed11-82e4-000d3aa7ff8b",
            "modifiedon": "2023-02-20T01:23:11Z",
            "sdkmessageprocessingstepsecureconfigidunique": "ad354a1c-49e0-4668-9ccf-b208593af3ad",
            "_createdonbehalfby_value": null,
            "secureconfig": JSON.stringify(cfg),
            "_modifiedby_value": "3f9bcab8-eb09-ed11-82e4-000d3aa7ff8b",
            "sdkmessageprocessingstepsecureconfigid": "7fb8f90d-a352-41d5-be92-b895ef5af57c",
            "_modifiedonbehalfby_value": null,
            "_organizationid_value": "86ba945e-f4d2-49bd-9841-2a4d6b2a7ac0"
          }
        }
      ]
    }
  ]
});
