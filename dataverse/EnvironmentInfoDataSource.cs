using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Discovery;
using System;
using System.Collections.Generic;

namespace Ianua.Ianus.Plugins
{
    /// <summary>
    /// Plugin development guide: https://docs.microsoft.com/powerapps/developer/common-data-service/plug-ins
    /// Best practices and guidance: https://docs.microsoft.com/powerapps/developer/common-data-service/best-practices/business-logic/
    /// </summary>
    public class EnvironmentInfoDataSource : PluginBase
    {
        public EnvironmentInfoDataSource(string unsecureConfiguration, string secureConfiguration)
            : base(typeof(EnvironmentInfoDataSource))
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

            localPluginContext.Trace("Starting environment information retrieval");

            var response = (RetrieveCurrentOrganizationResponse) localPluginContext.PluginUserService.Execute(new RetrieveCurrentOrganizationRequest());

            localPluginContext.Trace("Found environment information");

            var organizationInfo = response.Detail;

            var data = new List<Entity>
            {
                new Entity("ian_environmentinformation")
                {
                    Attributes =
                    {
                        ["ian_name"] = organizationInfo.FriendlyName,
                        ["ian_environmentinformationid"] = organizationInfo.OrganizationId,
                        ["ian_uniquename"] = organizationInfo.UniqueName,
                        ["ian_urlname"] = organizationInfo.UrlName,
                        ["ian_geo"] = organizationInfo.Geo
                    }
                }
            };

            var entityCollection = new EntityCollection(data)
            {
                MoreRecords = false,
                PagingCookie = null
            };

            localPluginContext.Trace($"Setting results for org {organizationInfo.UniqueName}");

            localPluginContext.PluginExecutionContext.OutputParameters["BusinessEntityCollection"] = entityCollection;
        }
    }
}
