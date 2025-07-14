using System;

namespace Ianua.Ianus.Dataverse.Client
{
    public class IanusValidationRequest
    {
        public Guid IsvId { get; set; }
        public Guid ProductId { get; set; }
        public string PublicKey { get; set; }
    }
}