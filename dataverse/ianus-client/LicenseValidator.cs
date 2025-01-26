using System;
using System.Text.Json;
using Microsoft.Xrm.Sdk;

namespace Ianua.Ianus.Client
{
    public class LicenseValidator
    {
        public static LicenseValidationResult ValidateLicense(IanusValidationRequest request, IOrganizationService service)
        {
            var customActionRequest = new OrganizationRequest
            {
                RequestName = "ian_LicenseValidation",
                Parameters = {
                    { "Issuer", request.Issuer },
                    { "Product", request.Product },
                    { "PublicKey", request.PublicKey }
                }
            };

            try
            {
                var response = service.Execute(customActionRequest);

                return new LicenseValidationResult
                {
                    IsValid = response.Results.TryGetValue("IsValid", out var isValid)
                        ? isValid as bool? ?? false
                        : false,
                    Reason = response.Results.TryGetValue("Reason", out var reason)
                        ? reason as string ?? string.Empty
                        : string.Empty,
                    License = response.Results.TryGetValue("License", out var license)
                        ? ( !string.IsNullOrEmpty(license as string) ? JsonSerializer.Deserialize<License>(license as string) : null )
                        : null,
                };
            }
            catch (Exception ex)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = ex.Message
                };
            }
        }
    }
}