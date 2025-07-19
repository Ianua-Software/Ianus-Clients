using System;

namespace Ianua.Ianus.Dataverse.Client
{
    public class IanusValidationRequest
    {
        public Guid PublisherId { get; set; }
        public Guid ProductId { get; set; }
        public IEnumerable<string> PublicKeys { get; set; }
    }
}