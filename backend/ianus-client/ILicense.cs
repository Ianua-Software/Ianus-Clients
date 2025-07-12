using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Ianua.Ianus.Client
{
    public interface IMeta
    {
        string Name { get; set; }
    }

    public interface ILicenseClaims
    {
        [JsonPropertyName("jti")]
        Guid Jti { get; set; }

        [JsonPropertyName("iss")]
        string Iss { get; set; }

        [JsonPropertyName("aud")]
        string Aud { get; set; }

        [JsonPropertyName("isv")]
        Guid Isv { get; set; }

        [JsonPropertyName("prd")]
        Guid Prd { get; set; }

        [JsonPropertyName("sub")]
        Guid Sub { get; set; }

        [JsonPropertyName("env")]
        List<Guid> Env { get; set; }

        [JsonPropertyName("required_roles")]
        List<string> RequiredRoles { get; set; }

        [JsonPropertyName("iat")]
        long Iat { get; set; }

        [JsonPropertyName("nbf")]
        long Nbf { get; set; }

        [JsonPropertyName("exp")]
        long? Exp { get; set; }

        [JsonPropertyName("custom")]
        Dictionary<string, object> Custom { get; set; }

        // Human-readable names for clarity
        [JsonPropertyName("iss_meta")]
        IMeta IssMeta { get; set; }

        [JsonPropertyName("aud_meta")]
        IMeta AudMeta { get; set; }

        [JsonPropertyName("isv_meta")]
        IMeta IsvMeta { get; set; }

        [JsonPropertyName("sub_meta")]
        IMeta SubMeta { get; set; }

        [JsonPropertyName("env_meta")]
        Dictionary<Guid, IMeta> EnvMeta { get; set; }

        [JsonPropertyName("ver")]
        string Ver { get; set; }
    }

    public interface ILicense
    {
        [JsonPropertyName("claims")]
        ILicenseClaims Claims { get; set; }
    }
}