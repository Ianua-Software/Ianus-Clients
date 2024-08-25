# Ianus Clients

## 🔐 Licensing Clients for Ianus Guard

This repository contains official client libraries, tools, and samples to help you integrate [Ianus Guard](https://www.ianusguard.com) into your own software — whether you're building **Plugins, PCFs, React apps, or external tools**.

Ianus Guard is a flexible licensing solution tailored for the Dataverse and Power Platform ecosystem. These clients allow you to **validate licenses**, **manage keys**, and **secure your apps**, even in fully **offline environments**.

---

## 🧭 Repository Structure

```
/frontend     → Client libraries for frontend (React, PCF, etc.)
/backend      → Client libraries for server-side use (e.g. plugins, .NET apps)
/solutions    → Unmanaged Ianus Guard Dev Kit solution
/standalone   → Utilities for generating key pairs and issuing licenses
/samples      → Sample integrations and code examples
```

---

## ✨ Features

- ✅ **Offline license validation** – no external calls required
- 🔑 **Key-based license generation** – issue and validate licenses in your Dataverse modules and products
- 🧩 **Prebuilt React + PCF components** – quickly protect your frontend modules
- 🧪 **Built for extensibility** – use with Dataverse, plugins, services, or external tools

---

## 🛠️ Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/Ianua-Software/Ianus-Clients.git
cd Ianus-Clients
```

### 2. Explore the folders

#### 🧩 `/frontend`
- React-based license check components and helpers for PCF controls
- Supports Canvas Apps, field controls, dataset controls

#### 🔧 `/backend`
- .NET (C#) library for use in plugins or server-side license validation
- Cryptographic verification using public/private key pairs

#### 🔐 `/standalone`
- PowerShell and CLI-based tools for key generation and license creation

#### 📦 `/samples`
- Full examples showing how to wire up the libraries in:
  - PCFs
  - Plugins

---

## 📦 Installation (planned)

We intend to publish packages soon:

- 🔧 `Plugins`: https://www.nuget.org/packages/Ianua.Ianus.Dataverse.Client/ and https://www.nuget.org/packages/Ianua.Ianus.Dataverse.Client.Light/
- 🧩 `PCFs`: www.npmjs.com/package/@ianua/ianus-dataverse-react-fluentui8


---

## 📚 Learn More

👉 Visit [ianusguard.com](https://www.ianusguard.com) for:
- Detailed docs
- Feature walkthroughs
- Publisher onboarding
- Pricing model

---

## 🤝 Contributing

This project is maintained by Ianua Software.

If you encounter issues or want to contribute:
- Open a GitHub issue
- Submit a PR
- Or just star the repo to show your support ⭐

---

## 📄 License

[Apache-2.0](LICENSE) — Free to use, modify, and distribute with attribution.
