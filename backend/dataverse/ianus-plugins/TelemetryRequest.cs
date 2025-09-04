using System;
using System.Text.Json.Serialization;

namespace Ianua.Ianus.Dataverse.Plugins
{
    public class EnvironmentIdentifier
    {
        [JsonPropertyName("type")]
        public string Type { get; set; }

        [JsonPropertyName("identifier")]
        public Guid Identifier { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }
    }

    public class TelemetryRequest
    {
        [JsonPropertyName("licenseId")]
        public Guid LicenseId { get; set; }

        [JsonPropertyName("environment")]
        public EnvironmentIdentifier Environment { get; set; }

        [JsonPropertyName("activeUsers")]
        public int ActiveUsers { get; set; }
    }
}