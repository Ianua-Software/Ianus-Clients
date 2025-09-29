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
    public class InvalidateLicense : PluginBase
    {
        public InvalidateLicense(string unsecureConfiguration, string secureConfiguration)
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

            try
            {
                if (!localPluginContext.PluginExecutionContext.InputParameters.TryGetValue("Target", out Entity target))
                {
                    return;
                }

                var identifier = target.GetAttributeValue<string>("ian_identifier");

                if (string.IsNullOrEmpty(identifier))
                {
                    return;
                }

                var existingLicense = LicenseValidation.RetrieveLicense(identifier, localPluginContext.RootService);

                if (existingLicense != null)
                {
                    var update = new Entity("ian_license", existingLicense.Id)
                    {
                        Attributes =
                        {
                            { "ian_identifier", null },
                            { "statecode", new OptionSetValue(1) },
                            { "statuscode", new OptionSetValue(2) }
                        }
                    };

                    localPluginContext.RootService.Update(update);
                }
            }
            catch (Exception ex)
            {
                localPluginContext.Logger.LogError(ex, "An exception occured: {0}", ex.Message);
                throw;
            }
        }
    }
}
