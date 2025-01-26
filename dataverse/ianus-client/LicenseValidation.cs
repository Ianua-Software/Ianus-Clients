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

        private static string RetrieveEnvironmentInformation (IOrganizationService service)
        {
            var request = new RetrieveMultipleRequest
            {
                Query = new QueryExpression
                {
                    EntityName = "ian_environmentinformation"
                }
            };

            var results = (RetrieveMultipleResponse) service.Execute(request);

            return results.EntityCollection.Entities.FirstOrDefault()?.GetAttributeValue<string>("ian_uniquename");
        }

        public static LicenseValidationResult ValidateLicense
        (
            string validIssuer, 
            string validAudience, 
            string dataverseOrganizationUniqueName, 
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

            if (licenseClaims.env == null || !licenseClaims.env.Any() || string.IsNullOrEmpty(licenseClaims.aud) || string.IsNullOrEmpty(licenseClaims.iss) || licenseClaims.exp == 0)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = "Incomplete license!"
                };
            }

            if (licenseClaims.iss != validIssuer)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid license issuer: License must be issued by '{validIssuer}'"
                };
            }

            if (licenseClaims.aud != validAudience)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid license audience: License audience must be '{validAudience}'"
                };
            }

            // Validate expiration date
            var expiryDate = DateTimeOffset.FromUnixTimeSeconds(licenseClaims.exp).DateTime;
            if (expiryDate < DateTime.UtcNow)
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid license expiry: Your license has expired on '{expiryDate}'"
                };
            }

            if (!licenseClaims.env.Contains(dataverseOrganizationUniqueName.ToLower()))
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = $"Invalid environment: Your license is not intended for usage in '{dataverseOrganizationUniqueName}' but for '{string.Join(", ", licenseClaims.env)}'"
                };
            }

            return new LicenseValidationResult
            {
                IsValid = true,
                License = new License
                {
                    claims = licenseClaims
                }
            };
        }


        public static LicenseValidationResult VerifyLicense(string validIssuer, string validAudience, string publicKeyPem, string licenseKey, IOrganizationService service)
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

            // Base64 decode the claims
            var plainClaims = Base64UrlDecode(encodedClaims);
            var licenseClaims = JsonSerializer.Deserialize<LicenseClaims>(plainClaims);

            var dataverseOrganizationUniqueName = RetrieveEnvironmentInformation(service);

            if (string.IsNullOrEmpty(dataverseOrganizationUniqueName))
            {
                return new LicenseValidationResult
                {
                    IsValid = false,
                    Reason = "Failed to retrieve dataverse organization unique name!"
                };
            }

            var licenseValidationResult = ValidateLicense(validIssuer, validAudience, dataverseOrganizationUniqueName, licenseClaims);

            return licenseValidationResult;
        }
    }
}
