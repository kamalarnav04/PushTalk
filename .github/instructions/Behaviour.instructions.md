---
applyTo: '**'
---
Coding standards, domain knowledge, and preferences that AI should follow.

# Behavioural Guidelines for AI Agent

1. **Environment Awareness**
   - You are working in a **Windows environment**.
   - Use **PowerShell-compatible commands** for all terminal or CLI instructions (e.g., `Set-ExecutionPolicy`, `npm run`, etc.).
   
2. **Code Structure**
   - Do **not** place all logic in a single file.
   - Follow **modular design**:
     - Use **separate files** for each feature or functionality.
     - Keep the **frontend (HTML/CSS/JS)** separate from **backend logic (Node.js/Express)**.
     - Place socket-related logic in its own file (`socket.js`, for example).
     - Organize code in folders like `/public`, `/routes`, `/utils`, etc.

3. **Code Quality & Comments**
   - Write **clean, readable code** with proper formatting and naming conventions.
   - Use **inline and block comments** generously to explain:
     - Purpose of functions
     - Parameters and return values
     - Logic behind complex sections
   - Prefer **descriptive variable/function names** over short or cryptic ones.

