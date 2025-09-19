# 🔒 Ricart-Agrawala Algorithm

Interactive visualization of the Ricart-Agrawala distributed mutual exclusion algorithm built with React.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-View_Now-green?style=for-the-badge)](https://richardalgo.vercel.app)
[![React](https://img.shields.io/badge/React-19.1.1-61dafb)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 🎯 Live Demo

**👉 [Try the Interactive Demo](https://richardalgo.vercel.app)**

Experience the algorithm in action with real-time visualization and interactive controls.

## 📖 About

The Ricart-Agrawala algorithm is a distributed algorithm that ensures mutual exclusion in distributed systems without requiring a central coordinator. This implementation provides an interactive simulation where you can:

- Visualize the algorithm in real-time
- Control simulation speed and parameters  
- Monitor message exchanges between nodes
- Understand the decision-making process

## 🚀 Quick Start

### Live Demo (Recommended)
Visit the [live demo](https://richardalgo.vercel.app) to try the algorithm without any setup.

### Local Development

```bash
# Clone the repository
git clone https://github.com/11Saniyaa/richart_algo_for_distributed_lock_mangemnt.git
cd richart_algo_for_distributed_lock_mangemnt

# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 🎮 How to Use

- **▶️ Start/Pause**: Toggle the simulation
- **🔄 Reset**: Reset all nodes to initial state
- **Nodes**: Change number of participating nodes (3-5)
- **Speed**: Adjust simulation speed (100ms - 2000ms)

### Node States
- 🟢 **RELEASED**: Node is not interested in critical section
- 🟡 **WANTED**: Node is requesting access to critical section  
- 🔴 **HELD**: Node is currently in critical section

## 🧠 Algorithm Overview

1. **Request Phase**: Node sends REQUEST messages to all other nodes
2. **Reply Logic**: Nodes reply immediately or defer based on their state and timestamp
3. **Entry Condition**: Node enters critical section when all replies are received
4. **Release Phase**: Node sends deferred replies when exiting critical section

## 🛠️ Tech Stack

- **Frontend**: React 19.1.1, JavaScript ES6+
- **Styling**: CSS3 with responsive design
- **Icons**: Lucide React
- **Build Tool**: Create React App

## 📦 Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

---

**Happy Learning! 🎓**
