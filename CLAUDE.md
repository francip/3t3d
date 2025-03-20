# 3T3D: 3D Tic-Tac-Toe Guidelines

## Project Structure
- HTML/CSS/JS-based 3D game using Three.js
- No build tools required - runs directly in browser

## Development Commands
- Run locally: Use `npm run dev` to start the Vite development server
- Debug: Open browser devtools (F12) for console logging/inspection
- Test: Manual testing via browser interaction

## Code Style

### Formatting
- Use 4-space indentation
- Use semicolons at end of statements
- Keep lines under 100 characters

### Naming Conventions
- camelCase for variables, functions, methods
- PascalCase for classes
- All caps for constants

### JavaScript
- Use ES modules with explicit imports/exports
- Three.js is main dependency
- Prefer const/let over var
- Use arrow functions for callbacks
- Handle user input through raycasting
- Update scene in animation loop

### Error Handling
- Use defensive checks for game state/user input
- Prefer early returns over nested conditions
- Console.error for debugging issues