using System;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System.Text.Json;
using Ianua.Ianus.Dataverse.Client;
using Microsoft.Crm.Sdk.Messages;
using System.Net.Http;
using System.Text;
using System.Web;

namespace Ianua.Ianus.Dataverse.Plugins
{
    /// <summary>
    /// Plugin development guide: https://docs.microsoft.com/powerapps/developer/common-data-service/plug-ins
    /// Best practices and guidance: https://docs.microsoft.com/powerapps/developer/common-data-service/best-practices/business-logic/
    /// </summary>
    public class LicenseValidationApi : PluginBase
    {
        private static readonly HttpClient HttpClient = new HttpClient();

        public LicenseValidationApi(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(LicenseValidationApi))
        {
            // TODO: Implement your custom configuration handling
            // https://docs.microsoft.com/powerapps/developer/common-data-service/register-plug-in#set-configuration-data
        }
        
        public int RetrieveActiveUserCount(string usagePermissionEntity, IOrganizationService service)
        {
            var fetch = $@"<fetch version='1.0' mapping='logical' distinct='true'>
                <entity name='systemuser'>
                    <attribute name='fullname'/>
                    <attribute name='domainname'/>

                    <!-- Only enabled, non-app, interactive users -->
                    <filter type='and'>
                        <condition attribute='isdisabled' operator='eq' value='0'/>
                        <condition attribute='applicationid' operator='null'/>
                        <condition attribute='accessmode' operator='ne' value='3'/>
                        <condition attribute='accessmode' operator='ne' value='4'/>
                    </filter>

                    <!-- Directly assigned roles -->
                    <link-entity name='systemuserroles' from='systemuserid' to='systemuserid' link-type='outer' alias='sur'>
                        <link-entity name='role' from='roleid' to='roleid' link-type='outer' alias='r1'>
                            <filter type='and'>
                                <condition attribute='name' operator='ne' value='System Administrator'/>
                                <condition attribute='name' operator='ne' value='System Customizer'/>
                                <condition attribute='name' operator='ne' value='Support User'/>
                            </filter>
                            <link-entity name='roleprivileges' from='roleid' to='roleid' link-type='outer' alias='rp1'>
                                <link-entity name='privilege' from='privilegeid' to='privilegeid' link-type='outer' alias='p1'>
                                    <filter>
                                        <condition attribute='name' operator='eq' value='prvRead{usagePermissionEntity}'/>
                                    </filter>
                                </link-entity>
                            </link-entity>
                        </link-entity>
                    </link-entity>

                    <!-- Team-assigned roles -->
                    <link-entity name='teammembership' from='systemuserid' to='systemuserid' link-type='outer' alias='tm'>
                        <link-entity name='team' from='teamid' to='teamid' link-type='outer' alias='t'>
                            <link-entity name='teamroles' from='teamid' to='teamid' link-type='outer' alias='tr'>
                                <link-entity name='role' from='roleid' to='roleid' link-type='outer' alias='r2'>
                                    <filter type='and'>
                                        <condition attribute='name' operator='ne' value='System Administrator'/>
                                        <condition attribute='name' operator='ne' value='System Customizer'/>
                                        <condition attribute='name' operator='ne' value='Support User'/>
                                    </filter>
                                    <link-entity name='roleprivileges' from='roleid' to='roleid' link-type='outer' alias='rp2'>
                                        <link-entity name='privilege' from='privilegeid' to='privilegeid' link-type='outer' alias='p2'>
                                            <filter>
                                                <condition attribute='name' operator='eq' value='prvRead{usagePermissionEntity}'/>
                                            </filter>
                                        </link-entity>
                                    </link-entity>
                                </link-entity>
                            </link-entity>
                        </link-entity>
                    </link-entity>

                    <!-- keep users that match either path -->
                    <filter type='or'>
                        <condition entityname='p1' attribute='privilegeid' operator='not-null'/>
                        <condition entityname='p2' attribute='privilegeid' operator='not-null'/>
                    </filter>
                </entity>
            </fetch>";

            var fetchRequest = new FetchExpression(fetch);
            var fetchResponse = service.RetrieveMultiple(fetchRequest);

            return fetchResponse.Entities.Count;
        }

        // Entry point for custom business logic execution
        protected override void ExecuteDataversePlugin(ILocalPluginContext localPluginContext)
        {
            if (localPluginContext == null)
            {
                throw new ArgumentNullException(nameof(localPluginContext));
            }

            if (localPluginContext.PluginExecutionContext.MessageName.Equals("ian_IanusLicenseValidation") && localPluginContext.PluginExecutionContext.Stage.Equals(30))
            {
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

                    var licenseValidationResult = LicenseValidation.ValidateLicense(publisherId, productId, publicKeys, localPluginContext.RootService);

                    if (licenseValidationResult.IsValid && localPluginContext.PluginExecutionContext.InputParameters.TryGetValue("TelemetryApiKey", out string telemetryApiKey) && localPluginContext.PluginExecutionContext.InputParameters.TryGetValue("UsagePermissionEntity", out string usagePermissionEntity))
                    {
                        var license = LicenseValidation.RetrieveLicense(publisherId, productId, localPluginContext.RootService);
                        var lastTelemetrySubmissionDate = license.GetAttributeValue<DateTime?>("ian_lasttelemetrysubmissiondate");

                        if (lastTelemetrySubmissionDate == null || DateTime.UtcNow.Subtract(lastTelemetrySubmissionDate.Value) > new TimeSpan(24, 0, 0))
                        {
                            var activeUserCount = RetrieveActiveUserCount(usagePermissionEntity, localPluginContext.RootService);
                            var organization = (RetrieveCurrentOrganizationResponse)localPluginContext.RootService.Execute(new RetrieveCurrentOrganizationRequest());

                            var report = new TelemetryRequest
                            {
                                LicenseId = licenseValidationResult.License.Jti,
                                Environment = new EnvironmentIdentifier
                                {
                                    Type = "dataverse",
                                    Identifier = organization.Detail.OrganizationId,
                                    Name = organization.Detail.UrlName
                                },
                                ActiveUsers = activeUserCount
                            };

                            var httpRequest = new HttpRequestMessage(HttpMethod.Post, new Uri("https://www.ianusguard.com/api/telemetry"))
                            {
                                Content = new StringContent(JsonSerializer.Serialize(report), Encoding.UTF8, "application/json"),
                                Headers =
                                {
                                    { "X-API-Key", telemetryApiKey }
                                }
                            };
                            var httpResponse = HttpClient.SendAsync(httpRequest).GetAwaiter().GetResult();

                            if (httpResponse.IsSuccessStatusCode)
                            {
                                localPluginContext.PluginExecutionContext.OutputParameters["ReportedUserCount"] = activeUserCount;
                                localPluginContext.RootService.Update(new Entity
                                {
                                    LogicalName = license.LogicalName,
                                    Id = license.Id,
                                    Attributes =
                                    {
                                        { "ian_lasttelemetrysubmissiondate", DateTime.UtcNow }
                                    }
                                });
                            }
                        }
                    }

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
