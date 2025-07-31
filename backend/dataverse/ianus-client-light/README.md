# Ianua.Ianus.Dataverse.Client.Light

`Ianua.Ianus.Dataverse.Client.Light` is a lightweight, secure license validation library designed specifically for **Dataverse plugin assemblies**. It enables Dataverse ISVs and Power Platform developers to verify product licenses without needing to include BouncyCastle crypto packages.
This is done by sending the validation to the `ian_IanusLicenseValidation` custom API that contains BouncyCastle.

> 🛠️ This package is intended for use **only within plugin assmblies** that are deployed without **Plugin Packages**. For **Plugin Packages**, please check out **Ianua.Ianus.Dataverse.Client**:
>
> For the new pluginpackage assemblies (e.g. `.nupkg` uploads), see: [`Ianua.Ianus.Dataverse.Client`](https://www.nuget.org/packages/Ianua.Ianus.Dataverse.Client)

---

## 💡 Features

- Seamless license validation from within plugin logic
- Works with the Ianus Guard license backend
- Supports validation via secure public key signatures
- Lightweight and optimized for plugin execution performance

---

## 📦 Installation

> 🛠️ Make sure that the Dataverse organization you're going to use this in has the [Ianus Guard Dev Kit](https://github.com/Ianua-Software/Ianus-Clients/tree/main/solutions) installed.

Install the NuGet package via CLI:

```bash
dotnet add package Ianua.Ianus.Dataverse.Client.Light
```

Or use the NuGet Package Manager:

```mathematica
PM> Install-Package Ianua.Ianus.Dataverse.Light
```
## ✅ Usage
To validate a license inside your plugin, call the static `LicenseValidation.ValidateLicense` method:

### Parameters
| Parameter             | Type                   | Description                                                                                   |
|-----------------------|------------------------|-----------------------------------------------------------------------------------------------|
| request               | IanusValidationRequest |  Request containing the external IDs of your Ianus Guard publisher (publisherId), product (productId) and the list of allowed public keys (typically one, multiple if dual signing) to verify signature  |

> It will automatically search for fitting licenses for your publisherId / productId combination and validate them.

```csharp
var licenseValidationResult = LicenseValidator.ValidateLicense(
    new IanusValidationRequest
    {
        PublisherId = publisherId,
        ProductId = productId,
        PublicKeys = publicKeys
    },
    localPluginContext.InitiatingUserService
);
```

## 🧱 Plugin Types Support
| Plugin Type         | Supported                                             |
|---------------------|-------------------------------------------------------|
| Classic .dll upload | ✅ Yes                                                |
| .nupkg upload       | ✅ Yes, but better to use Ianua.Ianus.Dataverse.Client|


If you're unsure which one you're using, check whether your plugin is part of a Plugin Package in your Dataverse environment.
If you never heard of plugin packages, you are very likely using Plugin Assemblies and should use Ianua.Ianus.Dataverse.Client.Light.

## 🔐 Security Notes

    License verification is performed at runtime via cryptographic signature matching.
    Please be sure to have the Ianus Guard Dev Kit containing the validation API installed, available at [GitHub](https://github.com/Ianua-Software/Ianus-Clients/tree/main/solutions).
    The check runs on behalf of the initiating user in the plugin execution pipeline.

## 📄 License

Distributed under Apache-2.0, open and free.

## 📫 Support

For documentation, support, and troubleshooting, please visit:
👉 https://ianusguard.com/docs

## Related Packages

    Ianua.Ianus.Dataverse.Client: Use this for new nuget-based plugins in .nupkg structure.