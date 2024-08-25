using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Ianua.Ianus.Dataverse.Client
{
    public class Meta
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }
    }

    public class EnvironmentIdentifier
    {
        [JsonPropertyName("type")]
        public string Type { get; set; }

        [JsonPropertyName("identifier")]
        public string Identifier { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }
    }

    public class License
    {
        [JsonPropertyName("jti")]
        public Guid Jti { get; set; }

        [JsonPropertyName("iss")]
        public string Iss { get; set; }

        [JsonPropertyName("aud")]
        public string Aud { get; set; }

        [JsonPropertyName("pub")]
        public Guid Pub { get; set; }

        [JsonPropertyName("prd")]
        public Guid Prd { get; set; }

        [JsonPropertyName("sub")]
        public Guid Sub { get; set; }

        [JsonPropertyName("env")]
        public List<EnvironmentIdentifier> Env { get; set; }

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
        public Meta IssMeta { get; set; }

        [JsonPropertyName("aud_meta")]
        public Meta AudMeta { get; set; }

        [JsonPropertyName("pub_meta")]
        public Meta PubMeta { get; set; }

        [JsonPropertyName("prd_meta")]
        public Meta PrdMeta { get; set; }

        [JsonPropertyName("sub_meta")]
        public Meta SubMeta { get; set; }

        [JsonPropertyName("ver")]
        public string Ver { get; set; }
    }
}