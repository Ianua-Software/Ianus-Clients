using System.Collections.Generic;

namespace Ianua.Ianus.Domain
{
    public class LicenseClaims
    {
        public string iss { get; set; }

        public string aud { get; set; }

        public string sub { get; set; }

        public List<string> env { get; set; }

        public long iat { get; set; }

        public long nbf { get; set; }

        public long exp { get; set; }

        // Human-readable names for clarity
        public string iss_name { get; set; }

        public string aud_name { get; set; }

        public string sub_name { get; set; }

        public Dictionary<string, object> custom { get; set; }
    }

    public class License
    {
        public LicenseClaims claims { get; set; }
    }
}