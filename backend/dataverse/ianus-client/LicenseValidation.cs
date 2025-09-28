using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Security.Cryptography;
using Microsoft.Xrm.Sdk;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.OpenSsl;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;
using System.Collections.Generic;

namespace Ianua.Ianus.Dataverse.Client
{
    public static class LicenseValidation
    {
        public static RSA ImportRsaPublicKey(string pem)
        {
            var rsaParams = ConvertPemToRsaParameters(pem);

            var rsa = RSA.Create();
            rsa.ImportParameters(rsaParams);

            return rsa;
        }

        private static RSAParameters ConvertPemToRsaParameters(string pem)
        {
            using (var publicKeyTextReader = new StringReader(pem))
            {
                var pemReader = new PemReader(publicKeyTextReader);
                var rsaKeyParameters = (RsaKeyParameters)pemReader.ReadObject();

                var rsaParams = new RSAParameters
                {
                    Modulus = rsaKeyParameters.Modulus.ToByteArrayUnsigned(),
                    Exponent = rsaKeyParameters.Exponent.ToByteArrayUnsigned()
                };

                return rsaParams;
            }
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

        private static bool VerifySignature(RSA key, byte[] data, byte[] signature)
        {
            return key.VerifyData(data, signature, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        }

        private static Guid RetrieveOrganizationId (IOrganizationService service)
        {
            var request = new RetrieveMultipleRequest
            {
                Query = new QueryExpression
                {
                    EntityName = "organization",
                    ColumnSet = new ColumnSet("organizationid"),
                    TopCount = 1
                }
            };

            var results = (RetrieveMultipleResponse) service.Execute(request);

            return results.EntityCollection.Entities.FirstOrDefault()?.Id ?? Guid.Empty;
        }

        private static LicenseValidationResult ValidateClaims
        (
            Guid publisherId, 
            Guid productId, 
            Guid organizationId, 
            License license
        )
        {
            if (license == null)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = "No license passed!"
                };
            }

            if (license.Env == null || !license.Env.Any() || string.IsNullOrEmpty(license.Aud) || string.IsNullOrEmpty(license.Iss))
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = "Incomplete license!"
                };
            }

            var validIssuer = $"https://www.ianusguard.com/api/public/products/{productId}";

            if (!string.Equals(validIssuer, license.Iss, StringComparison.InvariantCultureIgnoreCase))
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid license issuer: Issuer must be '{validIssuer}'"
                };
            }

            var validAudience = "ianusguard";

            if (!string.Equals(license.Aud, validAudience, StringComparison.InvariantCultureIgnoreCase))
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid license audience: Audience must be '{validAudience}'"
                };
            }

            if (license.Pub != publisherId)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid license publisher: Publisher must be '{publisherId}'"
                };
            }

            if (license.Prd != productId)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid license product: Product must be '{productId}'"
                };
            }

            if (!license.Env.Any(e => string.Equals(e.Type, "dataverse", StringComparison.InvariantCultureIgnoreCase) && Guid.TryParse(e.Identifier, out var parsedIdentifier) && parsedIdentifier == organizationId))
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid organization: Your license is not intended for usage in '{organizationId}' but for '{string.Join(", ", license.Env.Select(e => $"{e.Identifier} ({e.Name})"))}'"
                };
            }

            // A license without exp claim is defined to not expire
            if (license.Exp != null)
            {
                // Validate expiration date
                var expiryDate = DateTimeOffset.FromUnixTimeSeconds(license.Exp.Value).UtcDateTime;
                if (expiryDate < DateTime.UtcNow)
                {
                    return new LicenseValidationResult
                    {
                        IsValid = false,
                        Reason = $"Invalid license expiry: License expired on '{expiryDate}'"
                    };
                }
            }

            return new LicenseValidationResult
            {
                IsValid = true,
                License = license
            };
        }

        public static Entity RetrieveLicense(Guid publisherId, Guid productId, IOrganizationService service)
        {
            var identifier = $"{publisherId}_{productId}";

            return RetrieveLicense(identifier, service);
        }

        public static Entity RetrieveLicense(string identifier, IOrganizationService service)
        {
            try
            {
                var alternateKey = new KeyAttributeCollection
                {
                    { "ian_identifier", identifier }
                };

                var entityRef = new EntityReference("ian_license", alternateKey);

                var retrieveRequest = new RetrieveRequest
                {
                    Target = entityRef,
                    ColumnSet = new ColumnSet("ian_identifier", "ian_key", "ian_lasttelemetrysubmissiondate")
                };

                var retrieveResponse = (RetrieveResponse)service.Execute(retrieveRequest);
                var retrievedEntity = retrieveResponse.Entity;

                return retrievedEntity;
            }
            catch
            {
                return null;
            }
        }

        public static LicenseValidationResult ValidateLicense(Guid publisherId, Guid productId, IEnumerable<string> publicKeys, IOrganizationService service)
        {
            try
            {
                var license = RetrieveLicense(publisherId, productId, service);

                if (license != null)
                {
                    var licenseKey = license.GetAttributeValue<string>("ian_key");
                    return ValidateLicense(publisherId, productId, publicKeys, licenseKey, service);
                }
                else
                {
                    return new LicenseValidationResult
                    {
                        IsValid = false,
                        Reason = "No license found!"
                    };
                }
            }
            catch
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = "No license found!"
                };
            }
        }

        private static LicenseValidationResult ValidateLicense(Guid publisherId, Guid productId, IEnumerable<string> publicKeys, string licenseKey, IOrganizationService service)
        {
            if (string.IsNullOrEmpty(licenseKey))
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = "No license key set!"
                };
            }

            // Split the license key into parts
            var parts = licenseKey.Split('.');

            if (parts.Length < 3)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = "Invalid license format!"
                };
            }

            var encodedHeaders = parts[0];
            var encodedClaims = parts[1];
            var signature = parts[2];

            // Base64 decode the claims
            var plainClaims = Base64UrlDecode(encodedClaims);
            var license = JsonSerializer.Deserialize<License>(plainClaims);

            var organizationId = RetrieveOrganizationId(service);

            if (organizationId == Guid.Empty)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = "Failed to retrieve dataverse organization unique name!"
                };
            }

            var licenseValidationResult = ValidateClaims(publisherId, productId, organizationId, license);

            if (!licenseValidationResult.IsValid)
            {
                return licenseValidationResult;
            }

            // Create the data to verify (headers.claims)
            var dataToVerify = Encoding.UTF8.GetBytes($"{encodedHeaders}.{encodedClaims}");

            foreach (var publicKey in publicKeys)
            {
                // Verify the signature
                var key = ImportRsaPublicKey(publicKey);
                var isLicenseSignatureValid = VerifySignature(key, dataToVerify, Base64UrlDecode(signature));

                if (isLicenseSignatureValid)
                {
                    return licenseValidationResult;
                }
            }

            return new LicenseValidationResult
            {
                IsValid = false,
                Reason = "Invalid license signature: Verification failed!"
            };
        }
    }
}
