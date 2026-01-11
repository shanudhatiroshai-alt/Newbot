# 🤖 ShanuFx WhatsApp Bot

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Baileys](https://img.shields.io/badge/Baileys-Latest-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![GitHub Stars](https://img.shields.io/github/stars/ShanudhaTirosh/Shanu-md?style=for-the-badge&logo=github)
![GitHub Forks](https://img.shields.io/github/forks/ShanudhaTirosh/Shanu-md?style=for-the-badge&logo=github)
![Maintenance](https://img.shields.io/badge/Maintained-Yes-green?style=for-the-badge)

**A powerful, fast, and feature-rich WhatsApp bot built with Node.js and Baileys**

[Features](#-features) • [Installation](#-installation) • [Get Session ID](#-get-session-id) • [Usage](#-usage) • [Contributing](#-contributing)

</div>

---

## 📖 Project Overview

**ShanuFx WhatsApp Bot** is a modern, high-performance WhatsApp automation bot built on top of the latest Baileys library. It supports WhatsApp Multi-Device, session-based authentication (no repeated QR scanning), and comes with a modular command structure for easy customization and scalability.

Perfect for automating tasks, managing groups, and building custom WhatsApp interactions.

---

## 👨‍💻 Developer Information

<div align="center">

**Developed by [Shanudha Tirosh (ShanuFx)](https://github.com/ShanudhaTirosh)**

[![GitHub](https://img.shields.io/badge/GitHub-ShanudhaTirosh-181717?style=for-the-badge&logo=github)](https://github.com/ShanudhaTirosh)
[![Profile Views](https://komarev.com/ghpvc/?username=ShanudhaTirosh&style=for-the-badge&color=brightgreen)](https://github.com/ShanudhaTirosh)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔄 **Multi-Device Support** | Full WhatsApp Multi-Device compatibility using Baileys |
| 🔐 **Session ID Authentication** | Login once with QR, reuse session ID - no repeated scanning |
| ⚡ **Fast & Lightweight** | Optimized for speed and minimal resource usage |
| 🧩 **Modular Commands** | Easy-to-extend command handler architecture |
| 🔁 **Auto-Reconnect** | Automatic reconnection on connection loss |
| 👥 **Group & Private Chat** | Works seamlessly in both group and private conversations |
| 📁 **Media Handling** | Send and receive images, videos, audio, and documents |
| 🔒 **Secure Authentication** | JSON-based secure session storage |
| 🛠️ **Easy Configuration** | Simple environment-based setup |

---

## 🛠️ Tech Stack

<div align="center">

| Technology | Purpose |
|------------|---------|
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white) | Runtime Environment |
| ![Baileys](https://img.shields.io/badge/Baileys-25D366?style=flat&logo=whatsapp&logoColor=white) | WhatsApp Web API Library |
| ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black) | Programming Language |
| ![JSON](https://img.shields.io/badge/JSON-000000?style=flat&logo=json&logoColor=white) | Session & Auth Storage |

</div>

---

## 📦 Installation

### Prerequisites

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- A WhatsApp account

### Step-by-Step Guide

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ShanudhaTirosh/Shanu-md.git
   cd Shanu-md
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   
   Create a `.env` file in the root directory:
   ```env
   SESSION_ID=your_session_id_here
   PREFIX=.
   OWNER_NUMBER=94xxxxxxxxxx
   BOT_NAME=ShanuFx Bot
   ```

4. **Start the Bot**
   ```bash
   npm start
   ```

5. **First Time Setup**
   - If no session ID is provided, a QR code will appear in the terminal
   - Scan it with WhatsApp (Linked Devices)
   - Your session will be saved automatically

---

## 🔑 Get Session ID

To avoid scanning QR codes every time, you can generate and use a **Session ID**.

### 🌐 **[Click Here to Get Your Session ID](https://your-session-generator-link)**

### How Session ID Works:

1. Visit the session generator link above
2. Scan the QR code with WhatsApp
3. Copy the generated Session ID
4. Paste it into your `.env` file under `SESSION_ID`
5. Restart the bot - you're done! 🎉

> **Note:** Keep your Session ID private. It's like a password to your WhatsApp connection.

---

## 🚀 Usage

### Running the Bot

```bash
# Development mode
npm start

# Production mode with PM2
pm2 start index.js --name shanubot
```


---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## ⚠️ Disclaimer

- This bot is developed for **educational purposes only**
- The developers are **not responsible** for any misuse of this bot
- This project is **not affiliated** with WhatsApp Inc. or Meta Platforms Inc.
- Use responsibly and follow [WhatsApp's Terms of Service](https://www.whatsapp.com/legal/terms-of-service)
- Avoid spamming or any activity that violates WhatsApp policies

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Shanudha Tirosh (ShanuFx)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 🌟 Show Your Support

If you find this project helpful, please give it a ⭐️!

<div align="center">

[![GitHub Stars](https://img.shields.io/github/stars/ShanudhaTirosh/Shanu-md?style=social)](https://github.com/ShanudhaTirosh/Shanu-md/stargazers)
[![GitHub Followers](https://img.shields.io/github/followers/ShanudhaTirosh?style=social)](https://github.com/ShanudhaTirosh)

---

**Made with ❤️ by [ShanuFx](https://github.com/ShanudhaTirosh)**

</div>

---

