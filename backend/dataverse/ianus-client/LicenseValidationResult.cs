using System;

namespace Ianua.Ianus.Dataverse.Client
{
    public class LicenseValidationResult
    {
        public bool IsValid { get; set; }
        public string Reason { get; set; }
        public License License { get; set; }
        public Guid? LicenseId { get; set; }
        public string LicenseKey { get; set; }

        public LicenseValidationResult()
        {
            
        }

        public LicenseValidationResult(LicenseValidationResult source)
        {
            IsValid = source?.IsValid ?? false;
            Reason = source?.Reason;
            License = source?.License;
            LicenseId = source?.LicenseId;
            LicenseKey = source?.LicenseKey;
        }
    }
}