using System;
using System.Collections.Generic;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;
using System.Text.Json;
using Ianua.Ianus.Client;

namespace Ianua.Ianus.Plugins
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

            if (localPluginContext.PluginExecutionContext.MessageName.Equals("ian_LicenseValidation") && localPluginContext.PluginExecutionContext.Stage.Equals(30)) {

                try
                {
                    if (!localPluginContext.PluginExecutionContext.InputParameters.TryGetValue("Issuer", out string issuer) || string.IsNullOrEmpty(issuer))
                    {
                        throw new InvalidPluginExecutionException("The input parameter 'Issuer' is missing or empty!");
                    }

                    if (!localPluginContext.PluginExecutionContext.InputParameters.TryGetValue("Product", out string product) || string.IsNullOrEmpty(product))
                    {
                        throw new InvalidPluginExecutionException("The input parameter 'Product' is missing or empty!");
                    }

                    if (!localPluginContext.PluginExecutionContext.InputParameters.TryGetValue("PublicKey", out string publicKey) || string.IsNullOrEmpty(publicKey))
                    {
                        throw new InvalidPluginExecutionException("The input parameter 'PublicKey' is missing or empty!");
                    }

                    var license = RetrieveLicense(localPluginContext, issuer, product);

                    if (license == null)
                    {
                        localPluginContext.PluginExecutionContext.OutputParameters["IsLicenseValid"] = false;
                        localPluginContext.PluginExecutionContext.OutputParameters["Reason"] = "No matching license found";
                        localPluginContext.PluginExecutionContext.OutputParameters["License"] = "";
                    }
                    else
                    {
                        var licenseKey = license.GetAttributeValue<string>("ian_key");

                        try
                        {
                            var licenseValidationResult = LicenseValidation.ValidateLicense(issuer, product, publicKey, licenseKey, localPluginContext.InitiatingUserService);

                            localPluginContext.PluginExecutionContext.OutputParameters["IsLicenseValid"] = licenseValidationResult.IsValid;
                            localPluginContext.PluginExecutionContext.OutputParameters["Reason"] = licenseValidationResult.Reason;
                            localPluginContext.PluginExecutionContext.OutputParameters["License"] = licenseValidationResult.IsValid ? JsonSerializer.Serialize(licenseValidationResult.License) : "";
                        }
                        catch(Exception ex)
                        {
                            localPluginContext.PluginExecutionContext.OutputParameters["IsLicenseValid"] = false;
                            localPluginContext.PluginExecutionContext.OutputParameters["Reason"] = ex.Message;
                            localPluginContext.PluginExecutionContext.OutputParameters["License"] = "";
                        }
                    }
                }
                catch (Exception ex)
                {
                    localPluginContext.Trace("ian_LicenseValidation: {0}", ex.StackTrace.ToString());
                    throw new InvalidPluginExecutionException("An error occurred in ian_LicenseValidation.", ex);
                }
            }
            else
            {
                throw new InvalidPluginExecutionException("ian_LicenseValidation plug-in is not associated with the expected message or is not registered for the main operation.");
            }
        }

        private static Entity RetrieveLicense(ILocalPluginContext localPluginContext, string issuer, string product)
        {
            try
            {
                var alternateKey = new KeyAttributeCollection
                {
                    { "ian_identifier", $"{issuer}-{product}" }
                };

                var entityRef = new EntityReference("ian_license", alternateKey);

                var retrieveRequest = new RetrieveRequest
                {
                    Target = entityRef,
                    ColumnSet = new ColumnSet("ian_identifier", "ian_key")
                };

                var retrieveResponse = (RetrieveResponse) localPluginContext.InitiatingUserService.Execute(retrieveRequest);
                var retrievedEntity = retrieveResponse.Entity;

                return retrievedEntity;
            }
            catch
            {
                return null;
            }
        }
    }
}
