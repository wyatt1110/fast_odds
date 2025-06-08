export default function MinimalTest() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: 'blue' }}>Minimal Test Page</h1>
      <p>This is a basic page with no dependencies to test if Next.js is working correctly.</p>
      <button 
        style={{ 
          backgroundColor: 'blue', 
          color: 'white', 
          border: 'none', 
          padding: '10px 15px', 
          borderRadius: '5px', 
          cursor: 'pointer' 
        }}
      >
        Test Button
      </button>
    </div>
  );
} 