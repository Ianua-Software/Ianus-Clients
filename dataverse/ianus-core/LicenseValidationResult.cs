using System.Collections.Generic;

namespace Ianua.Ianus.Domain
{
    public class LicenseValidationResult
    {
        public bool IsValid { get; set; }
        public string Reason { get; set; }
        public License License { get; set; }
    }
}