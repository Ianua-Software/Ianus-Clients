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

namespace Ianua.Ianus.Client
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

        public static LicenseValidationResult ValidateClaims
        (
            Guid validIsvId, 
            Guid validProductId, 
            Guid organizationId, 
            LicenseClaims licenseClaims
        )
        {
            if (licenseClaims == null)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = "No license passed!"
                };
            }

            if (licenseClaims.Env == null || !licenseClaims.Env.Any() || string.IsNullOrEmpty(licenseClaims.Aud) || string.IsNullOrEmpty(licenseClaims.Iss))
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = "Incomplete license!"
                };
            }

            var validIssuer = $"https://www.ianusguard.com/api/public/products/{validProductId}";

            if (!string.Equals(validIssuer, licenseClaims.Iss, StringComparison.InvariantCultureIgnoreCase))
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid license issuer: License must be issued by '{validIssuer}'"
                };
            }

            if (!string.Equals(licenseClaims.Aud, "ianusguard", StringComparison.InvariantCultureIgnoreCase))
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid license audience: License must have audience 'ianusguard'"
                };
            }

            if (licenseClaims.Isv != validIsvId)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid license ISV: License must be issued by '{validIsvId}'"
                };
            }

            if (licenseClaims.Prd != validProductId)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid license product: License product must be '{validProductId}'"
                };
            }

            if (!licenseClaims.Env.Contains(organizationId))
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid organization: Your license is not intended for usage in '{organizationId}' but for '{string.Join(", ", licenseClaims.Env)}'"
                };
            }

            // A license without exp claim is defined to not expire
            if (licenseClaims.Exp != null)
            {
                // Validate expiration date
                var expiryDate = DateTimeOffset.FromUnixTimeSeconds(licenseClaims.Exp.Value).DateTime;
                if (expiryDate < DateTime.UtcNow)
                {
                    return new LicenseValidationResult
                    {
                        IsValid = false,
                        Reason = $"Invalid license expiry: Your license has expired on '{expiryDate}'"
                    };
                }
            }

            return new LicenseValidationResult
            {
                IsValid = true,
                License = new License
                {
                    Claims = licenseClaims
                }
            };
        }

        public static LicenseValidationResult ValidateLicense(Guid validIsvId, Guid validProductId, string publicKeyPem, string licenseKey, IOrganizationService service)
        {
            var key = ImportRsaPublicKey(publicKeyPem);

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
            var licenseClaims = JsonSerializer.Deserialize<LicenseClaims>(plainClaims);

            var organizationId = RetrieveOrganizationId(service);

            if (organizationId == Guid.Empty)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = "Failed to retrieve dataverse organization unique name!"
                };
            }

            var licenseValidationResult = ValidateClaims(validIsvId, validProductId, organizationId, licenseClaims);

            if (!licenseValidationResult.IsValid)
            {
                return licenseValidationResult;
            }

            // Create the data to verify (headers.claims)
            var dataToVerify = Encoding.UTF8.GetBytes($"{encodedHeaders}.{encodedClaims}");

            // Verify the signature
            var isLicenseSignatureValid = VerifySignature(key, dataToVerify, Base64UrlDecode(signature));

            if (!isLicenseSignatureValid)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = "Invalid license signature: Verification failed!"
                };
            }
            else
            {
                return licenseValidationResult;
            }
        }
    }
}
