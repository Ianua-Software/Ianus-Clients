# Ianua.Ianus.Dataverse.Client

`Ianua.Ianus.Dataverse.Client` is a lightweight, secure license validation library designed specifically for **Dataverse plugin packages**. It enables Dataverse ISVs and Power Platform developers to verify product licenses directly within plugin execution contexts.

> 🛠️ This package is intended for use **only within plugin projects** that are deployed as **Plugin Packages**. For regular **Plugin Assemblies**, please check out **Ianua.Ianus.Dataverse.Client.Light**:
>
> For legacy or simplified plugin assemblies (e.g. `.dll` uploads without PluginPackage structure), see: [`Ianua.Ianus.Dataverse.Client.Light`](https://www.nuget.org/packages/Ianua.Ianus.Dataverse.Client.Light)

---

## 💡 Features

- Seamless license validation from within plugin logic
- Works with the Ianus Guard license backend
- Supports validation via secure public key signatures
- Lightweight and optimized for plugin execution performance

---

## 📦 Installation

Install the NuGet package via CLI:

```bash
dotnet add package Ianua.Ianus.Dataverse.Client
```

Or use the NuGet Package Manager:

```mathematica
PM> Install-Package Ianua.Ianus.Dataverse.Client
```
## ✅ Usage
To validate a license inside your plugin, call the static `LicenseValidation.ValidateLicense` method:

### Parameters
| Parameter             | Type                 | Description                                                                                   |
|-----------------------|----------------------|-----------------------------------------------------------------------------------------------|
| publisherId           | Guid                 | The external ID of your Ianus Guard publisher                                                 |
| productId             | Guid                 | The external ID of the Ianus Guard product being verified                                     |
| publicKeys            | string[]             | The list of allowed public keys (typically one, multiple if dual signing) to verify signature |
| service               | IOrganizationService | The initiating user's service context from  IPluginExecutionContext                           |

> It will automatically search for fitting licenses for your publisherId / productId combination and validate them.

```csharp
var licenseValidationResult = LicenseValidation.ValidateLicense(
    publisherId,
    productId,
    publicKeys,
    localPluginContext.InitiatingUserService
);
```

## 🧱 Plugin Types Support
| Plugin Type         | Supported               |
|---------------------|-------------------------|
| Plugin Package      | ✅ Yes                   |
| Classic .dll upload | ❌ No (use Client.Light) |


If you're unsure which one you're using, check whether your plugin is part of a Plugin Package in your Dataverse environment.
If you never heard of plugin packages, you are very likely using Plugin Assemblies and should use Ianua.Ianus.Dataverse.Client.Light instead.

## 🔐 Security Notes

    License verification is performed at runtime via cryptographic signature matching.
    The check runs on behalf of the initiating user in the plugin execution pipeline.

## 📄 License

Distributed under Apache-2.0, open and free.

## 📫 Support

For documentation, support, and troubleshooting, please visit:
👉 https://ianusguard.com/docs

## Related Packages

    Ianua.Ianus.Dataverse.Client.Light: Use this for simple legacy .dll-based plugin assemblies without full PluginPackage structure.