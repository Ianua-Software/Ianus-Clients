using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Ianua.Ianus.Client
{
    public class Meta : IMeta
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }
    }

    public class LicenseClaims : ILicenseClaims
    {
        [JsonPropertyName("jti")]
        public Guid Jti { get; set; }

        [JsonPropertyName("iss")]
        public string Iss { get; set; }

        [JsonPropertyName("aud")]
        public string Aud { get; set; }

        [JsonPropertyName("isv")]
        public Guid Isv { get; set; }

        [JsonPropertyName("prd")]
        public Guid Prd { get; set; }

        [JsonPropertyName("sub")]
        public Guid Sub { get; set; }

        [JsonPropertyName("env")]
        public List<Guid> Env { get; set; }

        [JsonPropertyName("required_roles")]
        public List<string> RequiredRoles { get; set; }

        [JsonPropertyName("iat")]
        public long Iat { get; set; }

        [JsonPropertyName("nbf")]
        public long Nbf { get; set; }

        [JsonPropertyName("exp")]
        public long? Exp { get; set; }

        [JsonPropertyName("custom")]
        public Dictionary<string, object> Custom { get; set; }

        // Human-readable names for clarity
        [JsonPropertyName("iss_meta")]
        public IMeta IssMeta { get; set; }

        [JsonPropertyName("aud_meta")]
        public IMeta AudMeta { get; set; }

        [JsonPropertyName("isv_meta")]
        public IMeta IsvMeta { get; set; }

        [JsonPropertyName("sub_meta")]
        public IMeta SubMeta { get; set; }

        [JsonPropertyName("env_meta")]
        public Dictionary<Guid, IMeta> EnvMeta { get; set; }

        [JsonPropertyName("ver")]
        public string Ver { get; set; }
    }

    public class License : ILicense
    {
        public ILicenseClaims Claims { get; set; }
    }
}