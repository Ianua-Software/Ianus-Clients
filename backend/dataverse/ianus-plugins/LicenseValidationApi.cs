using System;
using System.Collections.Generic;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;
using System.Text.Json;
using Ianua.Ianus.Dataverse.Client;

namespace Ianua.Ianus.Dataverse.Plugins
{
    /// <summary>
    /// Plugin development guide: https://docs.microsoft.com/powerapps/developer/common-data-service/plug-ins
    /// Best practices and guidance: https://docs.microsoft.com/powerapps/developer/common-data-service/best-practices/business-logic/
    /// </summary>
    public class LicenseValidationApi : PluginBase
    {
        public LicenseValidationApi(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(LicenseValidationApi))
        {
            // TODO: Implement your custom configuration handling
            // https://docs.microsoft.com/powerapps/developer/common-data-service/register-plug-in#set-configuration-data
        }

        // Entry point for custom business logic execution
        protected override void ExecuteDataversePlugin(ILocalPluginContext localPluginContext)
        {
            if (localPluginContext == null)
            {
                throw new ArgumentNullException(nameof(localPluginContext));
            }

            if (localPluginContext.PluginExecutionContext.MessageName.Equals("ian_IanusLicenseValidation") && localPluginContext.PluginExecutionContext.Stage.Equals(30)) {

                try
                {
                    if (!localPluginContext.PluginExecutionContext.InputParameters.TryGetValue("PublisherId", out Guid publisherId))
                    {
                        throw new InvalidPluginExecutionException("The input parameter 'PublisherId' is missing or not a valid guid!");
                    }

                    if (!localPluginContext.PluginExecutionContext.InputParameters.TryGetValue("ProductId", out Guid productId))
                    {
                        throw new InvalidPluginExecutionException("The input parameter 'ProductId' is missing or empty!");
                    }

                    if (!localPluginContext.PluginExecutionContext.InputParameters.TryGetValue("PublicKeys", out string[] publicKeys) || publicKeys == null || publicKeys.Length < 1)
                    {
                        throw new InvalidPluginExecutionException("The input parameter 'PublicKeys' is missing or empty!");
                    }

                    var licenseValidationResult = LicenseValidation.ValidateLicense(publisherId, productId, publicKeys, localPluginContext.InitiatingUserService);

                    localPluginContext.PluginExecutionContext.OutputParameters["IsValid"] = licenseValidationResult.IsValid;
                    localPluginContext.PluginExecutionContext.OutputParameters["Reason"] = licenseValidationResult.Reason;
                    localPluginContext.PluginExecutionContext.OutputParameters["License"] = licenseValidationResult.IsValid ? JsonSerializer.Serialize(licenseValidationResult.License) : "";
                }
                catch (Exception ex)
                {
                    localPluginContext.PluginExecutionContext.OutputParameters["IsValid"] = false;
                    localPluginContext.PluginExecutionContext.OutputParameters["Reason"] = ex.Message;
                    localPluginContext.PluginExecutionContext.OutputParameters["License"] = "";
                }
            }
            else
            {
                throw new InvalidPluginExecutionException("ian_IanusLicenseValidation plug-in is not associated with the expected message or is not registered for the main operation.");
            }
        }
    }
}
