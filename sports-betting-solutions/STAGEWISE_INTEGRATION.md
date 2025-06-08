# Stagewise Dev-Tool Integration

This project has been integrated with the stagewise dev-tool to provide AI-powered editing capabilities through a browser toolbar.

## What is Stagewise?

Stagewise is a browser toolbar that connects frontend UI to code AI agents in your code editor. It allows developers to:
- Select elements in a web app
- Leave comments and feedback
- Let AI agents make changes based on that context

## Integration Details

### Package Installed
- `@stagewise/toolbar-react` - React integration for stagewise toolbar

### Files Modified
1. **`src/components/stagewise/StagewiseToolbar.tsx`** - New component that wraps the stagewise toolbar
2. **`src/app/layout.tsx`** - Root layout updated to include the stagewise toolbar

### Development Mode Only
The stagewise toolbar is configured to only appear in development mode (`NODE_ENV === 'development'`). It will not be included in production builds.

### Configuration
The toolbar is initialized with an empty plugins array:
```typescript
const stagewiseConfig = {
  plugins: []
};
```

## Usage

1. Start the development server: `npm run dev`
2. Open your browser to `http://localhost:3000`
3. The stagewise toolbar should appear in development mode
4. Use the toolbar to select UI elements and interact with AI agents

## Notes

- The toolbar only renders in development mode for security and performance reasons
- The integration uses the React version of stagewise due to Next.js version compatibility
- The toolbar is dynamically imported to avoid server-side rendering issues
- No additional configuration is required - the toolbar is ready to use out of the box

## Recent Updates

### Racecards Page Enhancement
- Implemented track summary view with collapsible race details
- Each track now shows: number of races, total prize money, total runners, and first race time
- Toggle dropdown functionality allows users to expand/collapse individual track details
- Improved user experience by reducing scrolling and providing quick overview of all meetings 