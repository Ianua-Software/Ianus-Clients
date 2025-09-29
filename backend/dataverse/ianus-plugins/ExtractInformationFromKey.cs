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
    public class ExtractInformationFromKey : PluginBase
    {
        public ExtractInformationFromKey(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(LicenseValidationApi))
        {
            // TODO: Implement your custom configuration handling
            // https://docs.microsoft.com/powerapps/developer/common-data-service/register-plug-in#set-configuration-data
        }

        private static byte[] Base64UrlDecode(string input)
        {
            string base64 = input.Replace('-', '+').Replace('_', '/');

            switch (input.Length % 4)
            {
                case 2: base64 += "=="; break;
                case 3: base64 += "="; break;
            }

            return Convert.FromBase64String(base64);
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

                var licenseKey = target.GetAttributeValue<string>("ian_key");

                if (string.IsNullOrEmpty(licenseKey))
                {
                    throw new InvalidPluginExecutionException("License key is mandatory!");
                }

                // Split the license key into parts
                var parts = licenseKey.Split('.');

                if (parts.Length < 3)
                {
                    throw new InvalidPluginExecutionException("Invalid license key!");
                }

                var encodedHeaders = parts[0];
                var encodedClaims = parts[1];
                var signature = parts[2];

                // Base64 decode the claims
                var plainClaims = Base64UrlDecode(encodedClaims);
                var license = JsonSerializer.Deserialize<License>(plainClaims);

                if (license == null)
                {
                    throw new InvalidPluginExecutionException("Invalid license key!");
                }
                else
                {
                    var identifier = $"{license.Pub}_{license.Prd}";

                    target["ian_identifier"] = identifier;
                    target["ian_name"] = $"{license.PubMeta?.Name} - {license.PrdMeta?.Name}";

                    if (license.Exp != null)
                    {
                        target["ian_expirydate"] = DateTimeOffset.FromUnixTimeSeconds(license.Exp.Value).UtcDateTime;
                    }
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
